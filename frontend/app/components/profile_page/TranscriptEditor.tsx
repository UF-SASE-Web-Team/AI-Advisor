import { useState } from "react";

const mockData = {
    Summer: [],
    Fall: [
        { code: "COP3502C", credits: 4, grade: "A-", format: "In-Person", meetingInfo: "T 1:55 - 2:45 PM / R 3:15 - 4:05 PM" },
        { code: "ECO2021", credits: 3, grade: "B", format: "Online", meetingInfo: "Online" },
    ],
    Spring: [],
};

const years = ["Year 1", "Year 2", "Year 3", "Year 4"];

const semesters = ["Summer", "Fall", "Spring"] as const;
type Semester = typeof semesters[number];

interface Course {
    code: string;
    credits: number;
    grade: string;
    format: string;
    meetingInfo: string;
}


export function TranscriptEditor() {
    const [activeSemester, setActiveSemester] = useState<"Summer" | "Fall" | "Spring">("Fall");
    const rows = mockData[activeSemester] ?? []
    const [selectedYear, setSelectedYear] = useState("Year 1");
    const [isEditing, setIsEditing] = useState(false);
    const [courses, setCourses] = useState<Record<Semester, Course[]>>(mockData);

    const handleAddClass = () => {
        const newCourse: Course = {
            code: "",
            credits: 0,
            grade: "",
            format: "",
            meetingInfo: "",
        };
        setCourses((prev) => ({
            ...prev,
            [activeSemester]: [...prev[activeSemester], newCourse],
        }));
        setIsEditing(true);
    };

    const handleCourseChange = (index: number, field: keyof Course, value: string | number) => {
        setCourses((prev) => {
            const updated = [...prev[activeSemester]];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, [activeSemester]: updated };
        });
    };

    const handleDeleteCourse = (index: number) => {
        setCourses((prev) => {
            const updated = prev[activeSemester].filter((_, i) => i !== index);
            return { ...prev, [activeSemester]: updated };
        });
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
                    onClick={() => setIsEditing((v) => !v)}
                    className={`ml-50 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                        ${isEditing
                            ? "bg-[#c8e6a0] border-[#a8cc70] text-green-900"
                            : "bg-white border-gray-300 text-gray-600 hover:border-gray-500"
                        }`}>{isEditing ? "Done" : "Edit"}</button>
            </div>

            <div className="rounded-xl overflow-hidden border border-[#c8e6a0]">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-[#e8f5c8] text-green-900">
                            {isEditing && <th className="px-3 py-2 text-left font-medium w-8"></th>}
                            <th className="px-4 py-2 text-left font-medium">Course Code</th>
                            <th className="px-4 py-2 text-center font-medium">Credits</th>
                            <th className="px-4 py-2 text-center font-medium">Grade</th>
                            <th className="px-4 py-2 text-center font-medium">Format</th>
                            <th className="px-4 py-2 text-center font-medium">Meeting Info</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {rows.length === 0 && !isEditing ? (
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
                                                type="number"
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
                            <td colSpan={isEditing ? 6 : 5} className="text-center py-3">
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