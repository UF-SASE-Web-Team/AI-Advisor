import { useState, useEffect, Fragment } from "react";
import { supabase } from "../../../supabase";
import { API_URL } from "~/config";
import * as API from "../../api/chatbot";

export interface FormData {
  x: number;
  y: number;
  z: number;
  min_credits: number;
  max_credits: number;
}

interface CourseSlot {
  day: string;
  period: number;
}

interface ScheduleCourse {
  course_id: string;
  course_name: string;
  credits: number;
  course_type: string;
  slots: CourseSlot[];
}

interface StatusMessage {
  msg: string;
  type: "success" | "error" | "warning" | "info" | "";
}

const DAYS = ["M", "T", "W", "R", "F"];
const PERIODS = Array.from({ length: 11 }, (_, i) => i + 1);

export function ScheduleCalendar() {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({
    x: 2,
    y: 1,
    z: 1,
    min_credits: 12,
    max_credits: 16,
  });

  const [blacklist, setBlacklist] = useState<Record<string, number[]>>({
    M: [],
    T: [],
    W: [],
    R: [],
    F: [],
  });

  const [schedule, setSchedule] = useState<ScheduleCourse[]>([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [status, setStatus] = useState<StatusMessage>({ msg: "", type: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFormData({
            x: data.major_courses_required,
            y: data.minor_courses_required,
            z: data.elective_courses_required,
            min_credits: data.min_credits,
            max_credits: data.max_credits,
          });
          const blacklistMap: Record<string, number[]> = {
            M: [],
            T: [],
            W: [],
            R: [],
            F: [],
          };
          data.blacklist_slots.forEach((slot: any) => {
            if (blacklistMap[slot.day])
              blacklistMap[slot.day].push(slot.period);
          });
          setBlacklist(blacklistMap);
        }
      });
  }, [user]);

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseInt(value) || 0,
    }));
  };

  const togglePeriod = (day: string, period: number) => {
    setBlacklist((prev) => {
      const currentPeriods = prev[day] || [];
      const isBlacklisted = currentPeriods.includes(period);

      let newPeriods;
      if (isBlacklisted) {
        newPeriods = currentPeriods.filter((p) => p !== period);
      } else {
        newPeriods = [...currentPeriods, period].sort((a, b) => a - b);
      }
      return { ...prev, [day]: newPeriods };
    });
  };

  const handleSave = async () => {
    if (!user) {
      setStatus({ msg: "Please log in to save preferences.", type: "warning" });
      return;
    }

    setStatus({ msg: "Saving preferences...", type: "info" });

    const blacklistSlots = Object.entries(blacklist).flatMap(([day, periods]) =>
      periods.map((period) => ({ day, period })),
    );

    await supabase
      .from("user_preferences")
      .update({
        major_courses_required: formData.x,
        minor_courses_required: formData.y,
        elective_courses_required: formData.z,
        min_credits: formData.min_credits,
        max_credits: formData.max_credits,
        blacklist_slots: blacklistSlots,
      })
      .eq("user_id", user.id);

    setStatus({ msg: "Preferences saved to your account!", type: "success" });
  };

  const handleGenerate = async () => {
    setLoading(true);
    setStatus({ msg: "", type: "" });
    setSchedule([]);

    try {
      // First, save preferences to backend for the solver
      API.setPreference(formData, blacklist);

      // Then call the solver
      const res = await fetch(`${API_URL}/api/solve/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (data.status === "success") {
        const rawCourses = data.scheduled_courses || [];

        // --- GROUPING LOGIC ---
        const groupedMap = new Map<string, ScheduleCourse>();

        rawCourses.forEach((c: any) => {
          if (!groupedMap.has(c.course_id)) {
            groupedMap.set(c.course_id, {
              course_id: c.course_id,
              course_name: c.course_name,
              credits: c.credits,
              course_type: c.course_type,
              slots: [],
            });
          }
          groupedMap.get(c.course_id)!.slots.push({
            day: c.day,
            period: c.period,
          });
        });

        const consolidatedSchedule = Array.from(groupedMap.values());

        setSchedule(consolidatedSchedule);
        setTotalCredits(data.total_credits);

        if (consolidatedSchedule.length === 0) {
          setStatus({ msg: "No valid schedule found.", type: "warning" });
        }
      } else {
        setStatus({
          msg: `Solver Error: ${data.error_message}`,
          type: "error",
        });
      }
    } catch (err: any) {
      setStatus({ msg: `Network Error: ${err.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#E1EABB] flex flex-col items-start px-8 py-6 font-sans">
      {/* Header */}
      <h1 className="text-[rgba(106,138,131,1)] text-4xl font-bold font-figmaHand mb-6">
        Schedule Configuration
      </h1>

      <div className="w-full max-w-5xl flex flex-col gap-8">
        {/* Inputs Card */}
        <div className="bg-[#6A8A83] rounded-3xl px-8 py-6 shadow-sm">
          <h3 className="text-white text-xl font-bold mb-4 font-mono tracking-widest uppercase">
            Parameters
          </h3>
          <div className="flex gap-6 flex-wrap">
            {[
              { label: "Major (X)", name: "x" },
              { label: "Minor (Y)", name: "y" },
              { label: "Elective (Z)", name: "z" },
              { label: "Min Credits", name: "min_credits" },
              { label: "Max Credits", name: "max_credits" },
            ].map((field) => (
              <div key={field.name} className="flex flex-col gap-1">
                <label className="text-white text-sm opacity-90">
                  {field.label}
                </label>
                <input
                  type="number"
                  name={field.name}
                  value={(formData as any)[field.name]}
                  onChange={handleInputChange}
                  min={0}
                  className="p-2 w-24 rounded-xl border-2 border-[#2E3A3A] bg-[#E1EABB] text-[#2E3A3A] font-bold focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Grid Card */}
        <div className="bg-white/40 rounded-3xl p-6 shadow-sm border border-[#6A8A83]/20">
          <h3 className="text-[#2E3A3A] text-xl font-bold mb-4 font-figmaHand">
            Blacklist Times{" "}
            <span className="text-sm font-sans font-normal opacity-70">
              (Click slots to block)
            </span>
          </h3>

          <div className="grid grid-cols-[50px_repeat(5,1fr)] gap-2">
            {/* Header Row */}
            <div></div>
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center font-bold text-[#2E3A3A] py-2 bg-[#6A8A83]/20 rounded-lg"
              >
                {d}
              </div>
            ))}

            {/* Grid Body */}
            {PERIODS.map((p) => (
              <Fragment key={p}>
                <div className="flex items-center justify-center font-bold text-[#6A8A83]">
                  P{p}
                </div>
                {DAYS.map((d) => {
                  const isBlocked = blacklist[d]?.includes(p);
                  return (
                    <div
                      key={`${d}-${p}`}
                      onClick={() => togglePeriod(d, p)}
                      className={`
                                                h-10 rounded-lg cursor-pointer transition-all duration-200 border-2
                                                ${
                                                  isBlocked
                                                    ? "bg-[#2E3A3A] border-[#2E3A3A]"
                                                    : "bg-white border-transparent hover:border-[#6A8A83] hover:bg-white/80"
                                                }
                                            `}
                      title={`Toggle ${d} Period ${p}`}
                    />
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="bg-[#2E3A3A] hover:bg-[#1a2222] text-white px-6 py-3 rounded-full font-bold transition-colors shadow-sm"
          >
            Save Preferences
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`
                            px-6 py-3 rounded-full font-bold transition-colors shadow-sm text-white
                            ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#6A8A83] hover:bg-[#5a7872]"}
                        `}
          >
            {loading ? "Solving..." : "Generate Schedule"}
          </button>
        </div>

        {/* Status Message */}
        {status.msg && (
          <div
            className={`p-4 rounded-xl font-bold border-2  mt-4 ${
              status.type === "success"
                ? "bg-[#d4edda] text-[#155724] border-[#c3e6cb]"
                : status.type === "error"
                  ? "bg-[#f8d7da] text-[#721c24] border-[#f5c6cb]"
                  : "bg-[#fff3cd] text-[#856404] border-[#ffeeba]"
            }`}
          >
            {status.msg}
          </div>
        )}

        {/* Results Table */}
        {schedule.length > 0 && (
          <div className="bg-white/60 rounded-3xl p-6 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center mb-4 border-b-2 border-[#6A8A83] pb-2">
              <h3 className="text-[#2E3A3A] text-2xl font-bold font-figmaHand">
                Generated Schedule
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-[#6A8A83] font-bold text-lg">
                  {totalCredits} Credits
                </span>
                {user && (
                  <button
                    onClick={async () => {
                      const planName = prompt(
                        "Enter a name for this plan:",
                        `Schedule ${new Date().toLocaleDateString()}`,
                      );
                      if (!planName) return;

                      setStatus({
                        msg: "Saving schedule as plan...",
                        type: "info",
                      });

                      const { data } = await supabase
                        .from("user_plans")
                        .insert({
                          user_id: user.id,
                          name: planName,
                          description: `Generated with ${schedule.length} courses`,
                          plan_data: {
                            semesters: [
                              {
                                term: "Generated Schedule",
                                courses: schedule.map((c) => ({
                                  courseCode: c.course_id,
                                  sectionId: "generated",
                                  name: c.course_name,
                                  credits: c.credits,
                                  type: c.course_type,
                                  slots: c.slots,
                                })),
                              },
                            ],
                          },
                          total_credits: totalCredits,
                        })
                        .select()
                        .single();

                      if (data)
                        setStatus({
                          msg: "Schedule saved to your plans!",
                          type: "success",
                        });
                    }}
                    className="bg-[#6A8A83] hover:bg-[#5a7872] text-white px-4 py-2 rounded-full font-bold text-sm transition-colors shadow-sm"
                  >
                    💾 Save as Plan
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[#2E3A3A]">
                    <th className="p-3 font-mono tracking-wider uppercase text-sm">
                      Code
                    </th>
                    <th className="p-3 font-mono tracking-wider uppercase text-sm">
                      Name
                    </th>
                    <th className="p-3 font-mono tracking-wider uppercase text-sm">
                      Credits
                    </th>
                    <th className="p-3 font-mono tracking-wider uppercase text-sm">
                      Type
                    </th>
                    <th className="p-3 font-mono tracking-wider uppercase text-sm">
                      Meeting Times
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {schedule.map((c, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-200 hover:bg-white/50 transition-colors"
                    >
                      <td className="p-3 font-bold text-[#6A8A83]">
                        {c.course_id}
                      </td>
                      <td className="p-3">{c.course_name}</td>
                      <td className="p-3">{c.credits}</td>
                      <td className="p-3">
                        <span className="bg-[#E1EABB] text-[#2E3A3A] px-2 py-1 rounded text-xs font-bold border border-[#6A8A83]/30">
                          {c.course_type}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          {c.slots.map((s, idx) => (
                            <span
                              key={idx}
                              className="bg-[#2E3A3A] text-white px-2 py-1 rounded text-xs font-mono"
                            >
                              {s.day} P{s.period}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
