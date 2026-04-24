import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../supabase";

const years = ["Year 1", "Year 2", "Year 3", "Year 4"];

const semesters = ["Summer", "Fall", "Spring"] as const;
type Semester = typeof semesters[number];

interface Course {
    code: string;
    name: string;
    credits: number;
    grade: string;
    format: string;
    meetingInfo: string;
}

type CoursesBySemester = Record<Semester, Course[]>;

const emptyBuckets: CoursesBySemester = { Summer: [], Fall: [], Spring: [] };

const normalizeRow = (row: Record<string, any>): Course => ({
    code: row.course ?? "",
    name: row.name ?? "",
    credits: Number(row.credit_attempted ?? 0),
    grade: row.grade ?? "",
    format: "",
    meetingInfo: "",
});

const yearToNumber = (year: string): number => {
    const match = year.match(/\d+/);
    return match ? Number(match[0]) : 1;
};

const parseTerm = (
    term: string | null | undefined,
): { semester: Semester; calendarYear: number } | null => {
    if (!term) return null;
    const match = term.match(/^(Fall|Spring|Summer|Spr|Sum)\s+(\d{4})$/i);
    if (!match) return null;
    const raw = match[1].toLowerCase();
    const sem: Semester | null =
        raw === "fall" ? "Fall" :
        raw === "spring" || raw === "spr" ? "Spring" :
        raw === "summer" || raw === "sum" ? "Summer" :
        null;
    if (!sem) return null;
    return { semester: sem, calendarYear: Number(match[2]) };
};

const defaultStartYear = (): number => new Date().getFullYear();

const calendarYearFor = (yearStr: string, startYear: number): number =>
    startYear + yearToNumber(yearStr) - 1;

const termFor = (semester: Semester, yearStr: string, startYear: number): string =>
    `${semester} ${calendarYearFor(yearStr, startYear)}`;

export function TranscriptEditor() {
    const [activeSemester, setActiveSemester] = useState<Semester>("Fall");
    const [selectedYear, setSelectedYear] = useState("Year 1");
    const [isEditing, setIsEditing] = useState(false);
    const [coursesByYear, setCoursesByYear] = useState<Record<string, CoursesBySemester>>({});
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [startYear, setStartYear] = useState<number>(() => defaultStartYear());

    useEffect(() => {
        (async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data, error, status, count } = await supabase
                .from("transcript")
                .select("*", { count: "exact" })
                .eq("id", user.id);

            console.log("[TranscriptEditor] fetch transcript", {
                userId: user.id,
                status,
                count,
                rowsReturned: data?.length ?? 0,
                firstRow: data?.[0],
                error,
            });

            if (error) {
                console.error("Failed to load transcript", error);
                setLoadError(error.message || "Could not load transcript.");
                setLoading(false);
                return;
            }

            const parsedRows: { semester: Semester; calendarYear: number; course: Course }[] = [];
            let skippedTerm = 0;
            for (const row of data ?? []) {
                const parsed = parseTerm(row.term);
                if (!parsed) {
                    skippedTerm++;
                    continue;
                }
                parsedRows.push({ ...parsed, course: normalizeRow(row) });
            }

            const calendarYears = parsedRows.map((r) => r.calendarYear);
            const resolvedStart = calendarYears.length > 0 ? Math.min(...calendarYears) : defaultStartYear();
            setStartYear(resolvedStart);

            const buckets: Record<string, CoursesBySemester> = {};
            for (const { semester, calendarYear, course } of parsedRows) {
                const yearKey = `Year ${calendarYear - resolvedStart + 1}`;
                if (!buckets[yearKey]) {
                    buckets[yearKey] = { Summer: [], Fall: [], Spring: [] };
                }
                buckets[yearKey][semester].push(course);
            }

            console.log("[TranscriptEditor] grouped", {
                startYear: resolvedStart,
                buckets,
                skippedRowsMissingTerm: skippedTerm,
            });

            for (const yr of years) {
                const bucket = buckets[yr];
                if (!bucket) continue;
                const semWithData = semesters.find((s) => bucket[s].length > 0);
                if (semWithData) {
                    setSelectedYear(yr);
                    setActiveSemester(semWithData);
                    break;
                }
            }

            setCoursesByYear(buckets);
            setLoading(false);
        })();
    }, []);

    const rows = useMemo<Course[]>(() => {
        return coursesByYear[selectedYear]?.[activeSemester] ?? [];
    }, [coursesByYear, selectedYear, activeSemester]);

    const updateRows = (updater: (prev: Course[]) => Course[]) => {
        setCoursesByYear((prev) => {
            const yearBucket = prev[selectedYear] ?? { ...emptyBuckets };
            const updatedSem = updater(yearBucket[activeSemester] ?? []);
            return {
                ...prev,
                [selectedYear]: { ...yearBucket, [activeSemester]: updatedSem },
            };
        });
    };

    const handleAddClass = () => {
        updateRows((prev) => [
            ...prev,
            { code: "", name: "", credits: 0, grade: "", format: "", meetingInfo: "" },
        ]);
        setIsEditing(true);
    };

    const handleCourseChange = (index: number, field: keyof Course, value: string | number) => {
        updateRows((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleDeleteCourse = (index: number) => {
        updateRows((prev) => prev.filter((_, i) => i !== index));
    };

    const handleMoveCourse = (
        index: number,
        target: { year?: string; semester?: Semester },
    ) => {
        const destYear = target.year ?? selectedYear;
        const destSem = target.semester ?? activeSemester;
        if (destYear === selectedYear && destSem === activeSemester) return;

        setCoursesByYear((prev) => {
            const src = prev[selectedYear] ?? { ...emptyBuckets };
            const moved = src[activeSemester][index];
            if (!moved) return prev;

            const srcCleared: CoursesBySemester = {
                ...src,
                [activeSemester]: src[activeSemester].filter((_, i) => i !== index),
            };
            const dstBase = destYear === selectedYear ? srcCleared : (prev[destYear] ?? { ...emptyBuckets });
            const dstUpdated: CoursesBySemester = {
                ...dstBase,
                [destSem]: [...dstBase[destSem], moved],
            };

            return {
                ...prev,
                [selectedYear]: srcCleared,
                [destYear]: dstUpdated,
            };
        });

        // Follow the course to its new bucket so the user doesn't lose track of it.
        if (destYear !== selectedYear) setSelectedYear(destYear);
        if (destSem !== activeSemester) setActiveSemester(destSem);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError(null);

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            setSaveError("You must be signed in to save.");
            setIsSaving(false);
            return;
        }

        const { error: deleteError } = await supabase
            .from("transcript")
            .delete()
            .eq("id", user.id);

        if (deleteError) {
            console.error("Failed to clear existing transcript rows", deleteError);
            setSaveError(deleteError.message || "Could not save courses.");
            setIsSaving(false);
            return;
        }

        const payload: {
            id: string;
            term: string;
            course: string;
            name: string;
            credit_attempted: number;
            grade: string;
        }[] = [];
        for (const [yearKey, bucket] of Object.entries(coursesByYear)) {
            for (const sem of semesters) {
                const term = termFor(sem, yearKey, startYear);
                for (const c of bucket[sem]) {
                    if (c.code.trim() === "") continue;
                    payload.push({
                        id: user.id,
                        term,
                        course: c.code,
                        name: c.name.trim() !== "" ? c.name : c.code,
                        credit_attempted: c.credits,
                        grade: c.grade,
                    });
                }
            }
        }

        if (payload.length > 0) {
            const { error: insertError } = await supabase.from("transcript").insert(payload);
            if (insertError) {
                console.error("Failed to insert transcript rows", insertError);
                setSaveError(insertError.message || "Could not save courses.");
                setIsSaving(false);
                return;
            }
        }

        setIsSaving(false);
        setIsEditing(false);
    };

    const handleToggleEdit = () => {
        if (isEditing) {
            handleSave();
        } else {
            setSaveError(null);
            setIsEditing(true);
        }
    };

    return (
        <div className="flex flex-col gap-3 p-3 font-mono flex-1">

            <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-1.5 rounded-full border border-gray-400 text-sm bg-white cursor-pointer focus:outline-none">
                        {years.map((y) => (
                            <option key={y}>{y}</option>
                        ))}
                    </select>
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-green-600">▾</span>
                </div>

                {semesters.map((sem) => (
                    <button
                        key={sem}
                        onClick={() => setActiveSemester(sem)}
                        className={`ml-20 px-4 py-1.5 rounded-full border text-sm font-medium transition-colors
                            ${activeSemester === sem
                                ? "bg-[#c8e6a0] border-[#a8cc70] text-green-900"
                                : "bg-white border-gray-300 text-gray-600 hover:border-gray-500"
                            }`}>{sem}</button>
                ))}

                <button
                    onClick={handleToggleEdit}
                    disabled={isSaving}
                    className={`ml-50 px-4 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed
                        ${isEditing
                            ? "bg-[#c8e6a0] border-[#a8cc70] text-green-900"
                            : "bg-white border-gray-300 text-gray-600 hover:border-gray-500"
                        }`}>{isSaving ? "Saving…" : isEditing ? "Done" : "Edit"}</button>
                {saveError && (
                    <span className="text-xs text-red-500 ml-2">{saveError}</span>
                )}
            </div>

            <div className="rounded-xl overflow-hidden border border-[#c8e6a0]">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-[#e8f5c8] text-green-900">
                            {isEditing && <th className="px-3 py-2 text-left font-medium w-8"></th>}
                            {isEditing && <th className="px-3 py-2 text-center font-medium">Year</th>}
                            {isEditing && <th className="px-3 py-2 text-center font-medium">Semester</th>}
                            <th className="px-4 py-2 text-left font-medium">Course Code</th>
                            <th className="px-4 py-2 text-center font-medium">Credits</th>
                            <th className="px-4 py-2 text-center font-medium">Grade</th>
                            <th className="px-4 py-2 text-center font-medium">Format</th>
                            <th className="px-4 py-2 text-center font-medium">Meeting Info</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {loading ? (
                            <tr>
                                <td colSpan={isEditing ? 8 : 5} className="text-center py-6 text-gray-400 text-sm">
                                    Loading courses…
                                </td>
                            </tr>
                        ) : loadError ? (
                            <tr>
                                <td colSpan={isEditing ? 8 : 5} className="text-center py-6 text-red-500 text-sm">
                                    {loadError}
                                </td>
                            </tr>
                        ) : rows.length === 0 && !isEditing ? (
                            <tr>
                                <td colSpan={5} className="text-center py-6 text-gray-400 text-sm">No Classes for this semester</td>
                            </tr>
                        ) : (
                            rows.map((course, i) => (
                                <tr key={i} className="border-t border-[#d4edaa]">
                                    {isEditing && (
                                        <td className="px-2 py-2 text-center">
                                            <button
                                                onClick={() => handleDeleteCourse(i)}
                                                className="text-red-400 hover:text-red-600 font-bold text-base leading-none"
                                                title="Remove">✕</button>
                                        </td>
                                    )}
                                    {isEditing && (
                                        <td className="px-2 py-2 text-center">
                                            <select
                                                className="border border-gray-300 rounded px-1 py-0.5 text-sm bg-white"
                                                value={selectedYear}
                                                onChange={(e) => handleMoveCourse(i, { year: e.target.value })}
                                                title="Move to year">
                                                {years.map((y) => (
                                                    <option key={y}>{y}</option>
                                                ))}
                                            </select>
                                        </td>
                                    )}
                                    {isEditing && (
                                        <td className="px-2 py-2 text-center">
                                            <select
                                                className="border border-gray-300 rounded px-1 py-0.5 text-sm bg-white"
                                                value={activeSemester}
                                                onChange={(e) => handleMoveCourse(i, { semester: e.target.value as Semester })}
                                                title="Move to semester">
                                                {semesters.map((s) => (
                                                    <option key={s}>{s}</option>
                                                ))}
                                            </select>
                                        </td>
                                    )}
                                    <td className="px-4 py-3">
                                        {isEditing ? (
                                            <input
                                                className="border border-gray-300 rounded px-2 py-0.5 w-28 text-sm"
                                                value={course.code}
                                                onChange={(e) => handleCourseChange(i, "code", e.target.value)} />
                                        ) : course.code}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                className="border border-gray-300 rounded px-2 py-0.5 w-14 text-sm text-center"
                                                value={course.credits}
                                                onChange={(e) => handleCourseChange(i, "credits", Number(e.target.value))} />
                                        ) : course.credits}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {isEditing ? (
                                            <input
                                                className="border border-gray-300 rounded px-2 py-0.5 w-16 text-sm text-center"
                                                value={course.grade}
                                                onChange={(e) => handleCourseChange(i, "grade", e.target.value)} />
                                        ) : course.grade}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {isEditing ? (
                                            <select
                                                className="border border-gray-300 rounded px-2 py-0.5 text-sm"
                                                value={course.format}
                                                onChange={(e) => handleCourseChange(i, "format", e.target.value)}>
                                                <option>In Person</option>
                                                <option>Online</option>
                                                <option>Hybrid</option>
                                            </select>
                                        ) : course.format}
                                    </td>
                                    <td className="px-4 py-3 text-center whitespace-pre-line">
                                        {isEditing ? (
                                            <input
                                                className="border border-gray-300 rounded px-2 py-0.5 w-40 text-sm"
                                                value={course.meetingInfo}
                                                onChange={(e) => handleCourseChange(i, "meetingInfo", e.target.value)} />
                                        ) : course.meetingInfo}
                                    </td>
                                </tr>
                            ))
                        )}

                        <tr className="border-t border-[#d4edaa]">
                            <td colSpan={isEditing ? 8 : 5} className="text-center py-3">
                                <button
                                    onClick={handleAddClass}
                                    className="text-green-700 hover:text-green-900 text-sm font-medium">⊕ Add class</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
};
