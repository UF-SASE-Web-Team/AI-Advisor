import React, { useState, useEffect, useContext, createContext } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../../supabase";
import { API_URL } from "~/config";

interface UserPlan {
  id: string;
  name: string;
  is_active: boolean;
  plan_data: any;
}

const MAX_PLAN_NAME_LEN = 60;
const MAX_TOTAL_CREDITS = 21;

// 12 muted, Notion-inspired course-accent colors. Soft desaturated backgrounds +
// dusty borders + dark text. Elegant rather than bright, and each hue is still
// clearly distinguishable from its neighbors.
export const COURSE_COLORS: { bg: string; border: string; text: string }[] = [
  { bg: "#FBE4E4", border: "#D9A4A4", text: "#7A2B2B" }, // dusty rose
  { bg: "#FAE8D7", border: "#D8AF85", text: "#784929" }, // peach
  { bg: "#FAF1D2", border: "#CDB97A", text: "#6D5A1A" }, // sand
  { bg: "#E5EFDE", border: "#A4C19A", text: "#3D5C33" }, // sage
  { bg: "#DDEDEA", border: "#95BFB7", text: "#2A5F55" }, // mint
  { bg: "#D8E9E2", border: "#8FBAA6", text: "#2E5E4B" }, // seafoam
  { bg: "#DDEBF1", border: "#93B9CC", text: "#2C5B78" }, // sky
  { bg: "#DEE4EC", border: "#99A8BC", text: "#2F4763" }, // dusty blue
  { bg: "#E0E1EF", border: "#A5A7C7", text: "#3D4076" }, // periwinkle
  { bg: "#EAE4F2", border: "#B9A8CE", text: "#4E3B77" }, // lavender
  { bg: "#F0DDED", border: "#C69CC0", text: "#6A2E65" }, // mauve
  { bg: "#F4DFEB", border: "#C597AE", text: "#6E334F" }, // pink
];

// Build a course → color map where each unique course gets the next palette entry
// (wrapping only if you somehow exceed 12 courses). This guarantees no duplicate
// colors within a plan, unlike a hash which can collide.
export const buildCourseColorMap = (
  codes: (string | undefined | null)[],
): Record<string, typeof COURSE_COLORS[number]> => {
  const map: Record<string, typeof COURSE_COLORS[number]> = {};
  let i = 0;
  for (const raw of codes) {
    const code = (raw ?? "").toString().trim().toUpperCase();
    if (!code) continue;
    if (map[code]) continue;
    map[code] = COURSE_COLORS[i % COURSE_COLORS.length];
    i += 1;
  }
  return map;
};

// Fallback lookup when a course isn't in the plan's color map (e.g., empty plan).
export const colorForCourse = (
  courseId: string | undefined | null,
  map?: Record<string, typeof COURSE_COLORS[number]>,
) => {
  const code = (courseId ?? "").toString().trim().toUpperCase();
  if (code && map && map[code]) return map[code];
  return COURSE_COLORS[COURSE_COLORS.length - 1];
};

// plan_data can be either the raw generate-API array (newer rows) or the older
// { semesters: [{ courses: [...] }] } wrap. Normalize to the flat array here.
const rawPlanCourses = (plan: UserPlan | undefined): any[] => {
  if (!plan) return [];
  const pd: any = plan.plan_data;
  if (Array.isArray(pd)) return pd;
  if (Array.isArray(pd?.semesters?.[0]?.courses)) return pd.semesters[0].courses;
  return [];
};

const classObjFromPlanCourse = (course: any): ClassObj => ({
  title: course.title ?? course.course_code ?? course.courseCode ?? "",
  credits: Number(course.credits ?? 0),
  days: course.days ?? "",
  course_name: course.course_name ?? course.name,
  unlocks_courses: course.unlocks_courses,
});

const classesFromPlan = (plan: UserPlan | undefined): ClassObj[] =>
  rawPlanCourses(plan).map(classObjFromPlanCourse);

// Build the "M,W,F - M8:30-9:20\n..." shape ClassItem already parses, from the
// catalog row's sections[0].meetTimes.
const daysStringFromSections = (sections: any[]): string => {
  if (!Array.isArray(sections) || sections.length === 0) return "";
  const meetTimes = sections[0]?.meetTimes ?? [];
  if (!Array.isArray(meetTimes) || meetTimes.length === 0) return "";
  const DAY_ORDER: Record<string, number> = { M: 0, T: 1, W: 2, R: 3, F: 4 };
  const daySet = new Set<string>();
  const lines: string[] = [];
  for (const mt of meetTimes) {
    const ds: string[] = Array.isArray(mt.meetDays) ? mt.meetDays : [];
    ds.forEach((d) => daySet.add(d));
    if (mt.meetTimeBegin && mt.meetTimeEnd) {
      for (const d of ds) {
        lines.push(`${d}${mt.meetTimeBegin}-${mt.meetTimeEnd}`);
      }
    }
  }
  if (daySet.size === 0) return "";
  const daysList = [...daySet].sort(
    (a, b) => (DAY_ORDER[a] ?? 99) - (DAY_ORDER[b] ?? 99),
  );
  return lines.length > 0 ? `${daysList.join(",")} - ${lines.join("\n")}` : daysList.join(",");
};

// Turn a row from the `courses` catalog into the same shape the generator
// produces, so it round-trips cleanly through plan_data.
const catalogRowToPlanShape = (row: any) => ({
  title: row.course_code,
  course_name: row.course_name,
  credits: Number(row.credits ?? 0),
  days: daysStringFromSections(row.sections ?? []),
  sections: row.sections ?? [],
});

const TRANSCRIPT_CACHE_KEY = "aiadvisor.transcript-codes";
const TRANSCRIPT_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const loadCachedTranscriptCodes = (userId: string): string[] | null => {
  try {
    const raw = localStorage.getItem(TRANSCRIPT_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (cached?.userId !== userId) return null;
    if (typeof cached.ts !== "number") return null;
    if (Date.now() - cached.ts > TRANSCRIPT_CACHE_TTL_MS) return null;
    return Array.isArray(cached.codes) ? cached.codes : null;
  } catch {
    return null;
  }
};

const saveCachedTranscriptCodes = (userId: string, codes: string[]) => {
  try {
    localStorage.setItem(
      TRANSCRIPT_CACHE_KEY,
      JSON.stringify({ userId, codes, ts: Date.now() }),
    );
  } catch {
    // quota exceeded / disabled — ignore
  }
};

// Session-scoped cache for autocomplete queries. Survives across expansions /
// re-open of the Add dialog within the same page load but not across reloads,
// because course data can change and we don't want stale dropdowns forever.
const courseSearchCache = new Map<string, any[]>();

const calendarCoursesFromPlan = (plan: UserPlan | undefined) =>
  rawPlanCourses(plan).flatMap((course: any) => {
    const sections = Array.isArray(course.sections) ? course.sections : [];
    const firstSection = sections[0];
    const meetTimes = Array.isArray(firstSection?.meetTimes) ? firstSection.meetTimes : [];
    const courseId = course.title ?? course.course_code ?? course.courseCode ?? "";
    return meetTimes
      .map((mt: any) => {
        const days = Array.isArray(mt.meetDays) ? mt.meetDays : [];
        if (days.length === 0) return null;
        const period = parseInt(mt.meetPeriodBegin ?? "1");
        const periodEnd = parseInt(mt.meetPeriodEnd ?? mt.meetPeriodBegin ?? "1");
        return {
          course_id: courseId,
          day: days.join(""),
          period,
          period_end: periodEnd,
        };
      })
      .filter(Boolean);
  });

interface ScheduleContextType {
  courses: any[];
  setCourses: (courses: any[]) => void;
  courseColorMap: Record<string, typeof COURSE_COLORS[number]>;
  setCourseColorMap: (map: Record<string, typeof COURSE_COLORS[number]>) => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(
  undefined
);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [courseColorMap, setCourseColorMap] = useState<
    Record<string, typeof COURSE_COLORS[number]>
  >({});

  return (
    <ScheduleContext.Provider value={{ courses, setCourses, courseColorMap, setCourseColorMap }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error("useSchedule must be used within ScheduleProvider");
  }
  return context;
}

interface ClassObj {
  title: string;
  credits: number;
  days: string;
  course_name?: string;
  unlocks_courses?: number;
}

export function SelectPlan() {
  const { setCourses, setCourseColorMap } = useSchedule();
  const [mode, setMode] = useState<"default" | "edit">("default");
  const [activePlanId, setActivePlanId] = useState<string>("");
  const [plans, setPlans] = useState<UserPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [takenCodes, setTakenCodes] = useState<Set<string>>(new Set());
  // null = unknown (still checking), true = has rows, false = checked, none.
  const [hasTranscript, setHasTranscript] = useState<boolean | null>(null);
  // Only the setter is read directly; state is accessed via the setter's prev arg.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_rawCourses, setRawCourses] = useState<any[]>([]);

  const currentPlanName = plans.find((p) => p.id === activePlanId)?.name ?? "";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setPlansLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("user_plans")
        .select("id, name, is_active, plan_data")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      console.log("[SelectPlan] fetch user_plans", {
        userId: user.id,
        rowsReturned: data?.length ?? 0,
        firstRow: data?.[0],
        error,
      });
      if (cancelled) return;
      if (error) {
        console.error("Failed to load user_plans", error);
        setPlansLoading(false);
        return;
      }
      const rows = (data ?? []) as UserPlan[];
      setPlans(rows);
      if (rows.length > 0) {
        const active = rows.find((p) => p.is_active) ?? rows[0];
        setActivePlanId(active.id);
      }
      setPlansLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const startRename = () => {
    if (!activePlanId) return;
    setRenameDraft(currentPlanName);
    setRenameError(null);
    setIsRenaming(true);
  };

  const cancelRename = () => {
    setIsRenaming(false);
    setRenameError(null);
  };

  const commitRename = async () => {
    const trimmed = renameDraft.trim();
    if (!activePlanId) return;
    if (trimmed === "" || trimmed === currentPlanName) {
      cancelRename();
      return;
    }
    const { error } = await supabase
      .from("user_plans")
      .update({ name: trimmed })
      .eq("id", activePlanId);
    if (error) {
      console.error("Failed to rename plan", error);
      setRenameError(error.message || "Could not rename plan.");
      return;
    }
    setPlans((prev) => prev.map((p) => (p.id === activePlanId ? { ...p, name: trimmed } : p)));
    setIsRenaming(false);
  };

  const [classes, setClasses] = useState<ClassObj[]>([
    {
      title: "",
      credits: 0,
      days: ""
    },{
      title: "",
      credits: 0,
      days: ""
    },{
      title: "",
      credits: 0,
      days: ""
    },{
      title: "",
      credits: 0,
      days: ""
    }
  ]);

  useEffect(() => {
    if (!activePlanId) return;
    const active = plans.find((p) => p.id === activePlanId);
    if (!active) return;
    const loaded = classesFromPlan(active);
    if (loaded.length > 0) setClasses(loaded);
    setRawCourses(rawPlanCourses(active));
    setCourses(calendarCoursesFromPlan(active));
  }, [activePlanId, plans, setCourses]);

  const persistPlanData = async (rawData: any[]) => {
    if (!activePlanId) return;
    const { error } = await supabase
      .from("user_plans")
      .update({ plan_data: rawData })
      .eq("id", activePlanId);
    if (error) {
      console.error("Failed to save plan_data", error);
      return;
    }
    setPlans((prev) =>
      prev.map((p) => (p.id === activePlanId ? { ...p, plan_data: rawData } : p)),
    );
  };

  const handleAddCourse = (rawRow: any): { ok: true } | { ok: false; reason: string } => {
    const enriched = catalogRowToPlanShape(rawRow);
    const currentTotal = classes.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
    const next = currentTotal + enriched.credits;
    if (next > MAX_TOTAL_CREDITS) {
      return {
        ok: false,
        reason: `Adding ${enriched.title} (${enriched.credits} cr) would exceed the ${MAX_TOTAL_CREDITS}-credit limit (${currentTotal}/${MAX_TOTAL_CREDITS} used).`,
      };
    }
    setRawCourses((prev) => {
      const nextRaw = [...prev, enriched];
      persistPlanData(nextRaw);
      setCourses(calendarCoursesFromPlan({ plan_data: nextRaw } as UserPlan));
      return nextRaw;
    });
    setClasses((prev) => [...prev, classObjFromPlanCourse(enriched)]);
    return { ok: true };
  };

  const handleRemoveCourse = (index: number) => {
    setRawCourses((prev) => {
      const next = prev.filter((_, i) => i !== index);
      persistPlanData(next);
      setCourses(calendarCoursesFromPlan({ plan_data: next } as UserPlan));
      return next;
    });
    setClasses((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerated = (generatedClasses: ClassObj[], rawData: any[]) => {
    setClasses(generatedClasses);
    setRawCourses(rawData);
    persistPlanData(rawData);
  };

  useEffect(() => {
    setCourseColorMap(buildCourseColorMap(classes.map((c) => c.title)));
  }, [classes, setCourseColorMap]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fast path: populate from localStorage so the autocomplete can filter
      // immediately on page load without waiting for the network.
      const cached = loadCachedTranscriptCodes(user.id);
      if (cached && !cancelled) {
        setTakenCodes(new Set(cached));
        if (cached.length > 0) setHasTranscript(true);
      }

      // Refresh in the background and update the cache.
      const { data, error } = await supabase
        .from("transcript")
        .select("course")
        .eq("id", user.id);
      if (cancelled || error) return;
      const codes = (data ?? [])
        .map((r: any) => (r.course ?? "").toString().trim().toUpperCase())
        .filter(Boolean);
      setTakenCodes(new Set(codes));
      setHasTranscript(codes.length > 0);
      saveCachedTranscriptCodes(user.id, codes);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="my-3 mx-1 gap-3 h-full min-h-0 min-w-0 flex flex-col relative">
      <div className="w-1/2 min-w-0">
        <SemesterSelect
          value={activePlanId}
          onChange={setActivePlanId}
          plans={plans}
          loading={plansLoading}
        />
      </div>

      <div className="border border-widget-border rounded-xl bg-white/60 p-3">
        <SemesterParameters onGenerate={handleGenerated} hasTranscript={hasTranscript} />
      </div>

      <div className="flex-1 min-h-0 min-w-0 border border-widget-border rounded-xl bg-white/60 p-3 flex flex-col gap-3">
        {mode === "default" ? (
          <div className="flex justify-between items-center gap-2 min-w-0 overflow-hidden">
            <h3 className="font-bold text-gray-700 flex items-center gap-2 min-w-0 flex-1">
              {isRenaming ? (
                <input
                  autoFocus
                  maxLength={MAX_PLAN_NAME_LEN}
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value.slice(0, MAX_PLAN_NAME_LEN))}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitRename();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      cancelRename();
                    }
                  }}
                  className="font-normal bg-white border border-widget-border rounded px-2 py-0.5 text-sm min-w-0 flex-1 focus:outline-none"
                />
              ) : (
                <span className="truncate min-w-0 flex-1" title={currentPlanName}>
                  {currentPlanName}
                </span>
              )}
              {!isRenaming && (
                <button
                  onClick={startRename}
                  disabled={!activePlanId}
                  aria-label="Rename semester plan"
                  title="Rename semester plan"
                  className="flex-none text-gray-500 hover:text-gray-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </button>
              )}
              {renameError && (
                <span className="text-xs text-red-500 font-normal truncate min-w-0 flex-none max-w-[8rem]">{renameError}</span>
              )}
            </h3>
            <button
              onClick={() => setMode("edit")}
              className="flex-none bg-widget-titlebar border border-widget-titlebar-border rounded-lg px-4 py-1 text-gray-700 font-bold hover:brightness-95 cursor-pointer text-sm"
            >
              Edit
            </button>
          </div>
        ) : (
          <AddClassRow
            takenCodes={takenCodes}
            existingCodes={new Set(classes.map((c) => c.title.trim().toUpperCase()).filter(Boolean))}
            remainingCredits={MAX_TOTAL_CREDITS - classes.reduce((s, c) => s + (Number(c.credits) || 0), 0)}
            onAdd={handleAddCourse}
            onClose={() => setMode("default")}
          />
        )}

        <div className="flex-1 relative min-h-0">
          <ClassList>
            {classes.map((c, i) => (
              <ClassItem
                key={i}
                {...c}
                showRemove={mode === "edit"}
                onRemove={() => handleRemoveCourse(i)}
              />
            ))}
          </ClassList>
        </div>
      </div>
    </div>
  );
}

const SemesterSelect = ({
  value,
  onChange,
  plans,
  loading,
}: {
  value: string;
  onChange: (v: string) => void;
  plans: UserPlan[];
  loading: boolean;
}) => {
  const isEmpty = !loading && plans.length === 0;
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || isEmpty}
        className="w-full min-w-0 truncate appearance-none bg-white border border-widget-border rounded-full py-1.5 pl-4 pr-10 text-gray-700 font-bold focus:outline-none cursor-pointer text-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <option value="">Loading plans…</option>
        ) : isEmpty ? (
          <option value="">No saved plans</option>
        ) : (
          plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))
        )}
      </select>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-widget-border"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 8l4 4 4-4" />
      </svg>
    </div>
  );
};

const SemesterParameters = ({
  onGenerate,
  hasTranscript,
}: {
  onGenerate: (classes: ClassObj[], rawData: any[]) => void;
  hasTranscript: boolean | null;
}) => {
  const navigate = useNavigate();
  const { setCourses } = useSchedule();
  const MIN = 0;
  const MAX = 21;
  const [minVal, setMinVal] = useState(12);
  const [maxVal, setMaxVal] = useState(18);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const minPct = (minVal / MAX) * 100;
  const maxPct = (maxVal / MAX) * 100;

  const onMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(Number(e.target.value), maxVal);
    setMinVal(v);
  };

  const onMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(Number(e.target.value), minVal);
    setMaxVal(v);
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setSuccess(false);

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) throw new Error("You must be logged in.");

      const targetCredits = Math.round((minVal + maxVal) / 2);
      const response = await fetch(`${API_URL}/api/v2/schedule/generate/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          min_credits: minVal,
          // Cap at the midpoint so the backend aims for the average of the slider range
          // instead of always filling up to the max.
          max_credits: targetCredits,
          target_credits: targetCredits,
        }),
      });

      const rawBody = await response.text();
      const data = rawBody ? JSON.parse(rawBody) : {};

      if (!response.ok) {
        throw new Error(
          (typeof data.error === "string" && data.error) ||
          (typeof data.error_message === "string" && data.error_message) ||
          `generate failed (${response.status})`
        );
      }

      // Transform raw schedule data to ClassObj format for SelectPlan
      const classObjects: ClassObj[] = data.map((course: any) => ({
        title: course.title,
        credits: course.credits,
        days: course.days,
        course_name: course.course_name,
        unlocks_courses: course.unlocks_courses,
      }));

      onGenerate(classObjects, Array.isArray(data) ? data : []);

      // Transform to calendar format and update context
      const calendarCourses = data.map((course: any) => {
        const sections = course.sections || [];
        if (sections.length === 0) return null;

        const firstSection = sections[0];
        const meetTimes = firstSection.meetTimes || [];
        if (meetTimes.length === 0) return null;

        const mt = meetTimes[0];
        const days = mt.meetDays || [];
        const period = parseInt(mt.meetPeriodBegin || 1);
        const periodEnd = parseInt(mt.meetPeriodEnd || mt.meetPeriodBegin || 1);

        if (days.length === 0) return null;

        return {
          course_id: course.title,
          day: days.join(""),
          period: period,
          period_end: periodEnd,
        };
      }).filter(Boolean);

      setCourses(calendarCourses);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  };

  const thumbCls =
    "absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none " +
    "[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full " +
    "[&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer " +
    "[&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:pointer-events-auto " +
    "[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 " +
    "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0 " +
    "[&::-moz-range-thumb]:cursor-pointer";

  if (hasTranscript === false) {
    return (
      <>
        <h3 className="font-bold text-gray-700 mb-2">Plan Generation</h3>
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="w-full text-left text-sm text-gray-700 bg-white border border-widget-border rounded-md px-3 py-2 hover:bg-gray-50 cursor-pointer"
        >
          Upload your transcript to start generating!{" "}
          <span className="text-green-700 font-semibold underline">Go to profile →</span>
        </button>
      </>
    );
  }

  return (
    <>
      <h3 className="font-bold text-gray-700 mb-2">
        Plan Generation
      </h3>
      <label className="block text-xs text-gray-600 mb-1">
        Credit Hours: {minVal}-{maxVal}
      </label>
      <div className="relative h-5 mb-3">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-300 rounded -translate-y-1/2" />
        <div
          className="absolute top-1/2 h-1 bg-blue-500 rounded -translate-y-1/2"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        <input
          type="range"
          min={MIN}
          max={MAX}
          value={minVal}
          onChange={onMinChange}
          className={thumbCls}
          aria-label="Minimum credit hours"
        />
        <input
          type="range"
          min={MIN}
          max={MAX}
          value={maxVal}
          onChange={onMaxChange}
          className={thumbCls}
          aria-label="Maximum credit hours"
        />
      </div>
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className={`w-full bg-white border border-widget-border rounded-full py-1 px-3 text-gray-700 text-sm hover:bg-gray-50 cursor-pointer ${isGenerating ? "opacity-60 pointer-events-none" : ""
          }`}
      >
        {isGenerating ? "Generating..." : "Generate New Schedule"}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {success && (
        <p className="text-xs text-green-600 mt-1">
          ✓ Schedule generated successfully.
        </p>
      )}
    </>
  );
};

const AddClassRow = ({
  takenCodes,
  existingCodes,
  remainingCredits,
  onAdd,
  onClose,
}: {
  takenCodes: Set<string>;
  existingCodes: Set<string>;
  remainingCredits: number;
  onAdd: (rawRow: any) => { ok: true } | { ok: false; reason: string };
  onClose: () => void;
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    const safe = trimmed.replace(/[,%]/g, "");

    // Session cache hit → show instantly, still revalidate in background.
    const cached = courseSearchCache.get(safe.toLowerCase());
    if (cached) {
      const filteredCached = cached.filter((r: any) => {
        const code = (r.course_code ?? "").toString().trim().toUpperCase();
        return code !== "" && !takenCodes.has(code) && !existingCodes.has(code);
      });
      setResults(filteredCached);
      setHighlighted(0);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const handle = setTimeout(async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("course_code, course_name, credits, sections")
        .or(`course_code.ilike.%${safe}%,course_name.ilike.%${safe}%`)
        .limit(20);
      setIsSearching(false);
      if (error) {
        console.error("Course search failed", error);
        setResults([]);
        return;
      }
      const rows = data ?? [];
      courseSearchCache.set(safe.toLowerCase(), rows);
      const filtered = rows.filter((r: any) => {
        const code = (r.course_code ?? "").toString().trim().toUpperCase();
        return code !== "" && !takenCodes.has(code) && !existingCodes.has(code);
      });
      setResults(filtered);
      setHighlighted(0);
    }, 200);
    return () => clearTimeout(handle);
  }, [query, takenCodes, existingCodes]);

  const select = (row: any) => {
    const credits = Number(row.credits ?? 0);
    if (credits > remainingCredits) {
      setAddError(
        `${row.course_code} is ${credits} cr — only ${remainingCredits} left before hitting the ${MAX_TOTAL_CREDITS}-credit limit.`,
      );
      return;
    }
    const result = onAdd(row);
    if (!result.ok) {
      setAddError(result.reason);
      return;
    }
    setAddError(null);
    setQuery("");
    setResults([]);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
      setIsOpen(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
      setIsOpen(true);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = results[highlighted];
      if (pick) select(pick);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const trimmed = query.trim();
  const showDropdown = isOpen && trimmed.length >= 2;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="font-bold text-gray-700 text-sm">Add:</span>
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 120)}
            onKeyDown={onKeyDown}
            autoFocus
            placeholder="Search by code or name (e.g. MAC2311)"
            className="w-full bg-white border border-widget-border rounded-full py-1 px-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
          />
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-widget-border rounded-md shadow-lg max-h-64 overflow-y-auto custom-scrollbar">
              {isSearching && results.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-400">Searching…</div>
              ) : results.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-400">No matches.</div>
              ) : (
                results.map((r, i) => {
                  const rowCredits = Number(r.credits ?? 0);
                  const wouldOvershoot = rowCredits > remainingCredits;
                  return (
                    <button
                      type="button"
                      key={`${r.course_code}-${i}`}
                      onMouseDown={(e) => { e.preventDefault(); if (!wouldOvershoot) select(r); }}
                      onMouseEnter={() => setHighlighted(i)}
                      disabled={wouldOvershoot}
                      title={wouldOvershoot ? `Exceeds ${MAX_TOTAL_CREDITS}-credit cap` : undefined}
                      className={`w-full text-left px-3 py-1.5 border-b border-gray-100 last:border-b-0 flex items-center justify-between gap-2 ${
                        wouldOvershoot ? "bg-gray-50 opacity-50 cursor-not-allowed" : i === highlighted ? "bg-gray-100" : "bg-white"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-gray-800 text-sm">{r.course_code}</div>
                        <div className="text-xs text-gray-500 truncate">{r.course_name}</div>
                      </div>
                      <div className="flex-none text-[11px] text-gray-500">{rowCredits} cr</div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="bg-white border border-widget-border rounded-full py-1 px-4 text-gray-700 text-sm hover:bg-gray-50 cursor-pointer"
        >
          Done
        </button>
      </div>
      <div className="flex items-center justify-between gap-2 pl-10">
        <span className="text-[11px] text-gray-500">
          {MAX_TOTAL_CREDITS - remainingCredits}/{MAX_TOTAL_CREDITS} credits used · {remainingCredits} remaining
        </span>
        {addError && <span className="text-[11px] text-red-500 truncate">{addError}</span>}
      </div>
    </div>
  );
};

const ClassList = ({ children }: any) => (
  <div className="grid grid-cols-2 gap-x-3 gap-y-2 content-start absolute inset-0 overflow-y-auto pr-0.5 custom-scrollbar">
    {children}
  </div>
);

const ClassItem = ({
  title,
  credits,
  days,
  showRemove = false,
  onRemove,
}: ClassObj & { showRemove?: boolean; onRemove?: () => void }) => {
  const [expanded, setExpanded] = useState(false);
  const { courseColorMap } = useSchedule();
  const color = colorForCourse(title, courseColorMap);

  const trimmed = (days || "").trim();
  let dayLine = trimmed;
  let timeLines: string[] = [];

  if (trimmed.includes(" - ")) {
    const [left, right] = trimmed.split(" - ");
    dayLine = left.trim();
    timeLines = right
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  if (!timeLines.length && trimmed.includes("\n")) {
    const [first, ...rest] = trimmed
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    dayLine = first || dayLine;
    timeLines = rest;
  }

  const formatTimeLine = (line: string) => {
    const match = line.match(/^([A-Za-z]+)\s*(\d.*)$/);
    if (!match) return line;
    return `${match[1]} ${match[2]}`.trim();
  };

  const formattedDayLine = dayLine
    ? `Meeting Day(s): ${dayLine.split(",").map((d) => d.trim()).filter(Boolean).join(", ")}`
    : "Meeting Day(s): TBA";

  const hasTimeLines = timeLines.length > 0;
  const visibleTimes = expanded ? timeLines : [];

  return (
    <div
      className="border-1 rounded-md px-4 py-3 pb-4 shadow-sm flex flex-col self-start h-fit"
      style={{ backgroundColor: color.bg, borderColor: color.border }}
    >
      <div className="flex items-center justify-between mb-1">
        <strong className="font-bold text-gray-700">{title}</strong>
        {showRemove && (
          <button
            onClick={onRemove}
            aria-label={`Remove ${title}`}
            className="flex-none inline-flex items-center justify-center w-6 h-6 rounded-full border border-red-300 bg-white text-red-500 text-lg font-bold leading-none hover:bg-red-500 hover:text-white hover:border-red-500 cursor-pointer transition-colors"
          >
            ×
          </button>
        )}
      </div>
      <p className="text-xs text-gray-600 mb-1">Credits: {credits}</p>
      <div className="text-xs text-gray-600">
        <p className="whitespace-pre-wrap">{formattedDayLine}</p>
        {visibleTimes.length > 0 && (
          <div className="mt-0.5 whitespace-pre-wrap">
            {visibleTimes.map((line, idx) => (
              <div key={`${title}-time-${idx}`}>{formatTimeLine(line)}</div>
            ))}
          </div>
        )}
        {hasTimeLines && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-[11px] text-green-700 hover:text-green-900 font-semibold cursor-pointer"
          >
            {expanded ? "See less ▲" : `See more (${timeLines.length}) ▼`}
          </button>
        )}
      </div>
    </div>
  );
};
