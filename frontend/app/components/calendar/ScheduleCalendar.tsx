import { useState, Fragment } from "react";

// --- Types ---
interface FormData {
    x: number;
    y: number;
    z: number;
    min_credits: number;
    max_credits: number;
}

// Represents a single time slot for a course
interface CourseSlot {
    day: string;
    period: number;
}

// Represents the consolidated course with ALL its slots
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
    // --- State ---
    const [formData, setFormData] = useState<FormData>({
        x: 2,
        y: 1,
        z: 1,
        min_credits: 12,
        max_credits: 16,
    });

    const [blacklist, setBlacklist] = useState<Record<string, number[]>>({
        M: [], T: [], W: [], R: [], F: []
    });

    const [schedule, setSchedule] = useState<ScheduleCourse[]>([]);
    const [totalCredits, setTotalCredits] = useState<number>(0);
    const [status, setStatus] = useState<StatusMessage>({ msg: "", type: "" });
    const [loading, setLoading] = useState<boolean>(false);
    const [parameters, setParameters] = useState<boolean>(false);

    // --- Handlers ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: parseInt(value) || 0,
        }));
    };

    const togglePeriod = (day: string, period: number) => {
        setBlacklist(prev => {
            const currentPeriods = prev[day] || [];
            const isBlacklisted = currentPeriods.includes(period);
            
            let newPeriods;
            if (isBlacklisted) {
                newPeriods = currentPeriods.filter(p => p !== period);
            } else {
                newPeriods = [...currentPeriods, period].sort((a, b) => a - b);
            }
            return { ...prev, [day]: newPeriods };
        });
    };

    const handleSave = async () => {
        setStatus({ msg: "Saving preferences...", type: "info" });
        const payload = { ...formData, blacklisted_periods: blacklist };

        try {
            const res = await fetch("http://localhost:8080/api/userpreference/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setStatus({ msg: "Preferences saved!", type: "success" });
            } else {
                setStatus({ msg: "Failed to save preferences.", type: "error" });
            }
        } catch (err: any) {
            setStatus({ msg: `Network Error: ${err.message}`, type: "error" });
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        setStatus({ msg: "", type: "" });
        setSchedule([]);

        try {
            const res = await fetch("http://localhost:8080/api/solve/", {
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
                            slots: [] 
                        });
                    }
                    groupedMap.get(c.course_id)!.slots.push({
                        day: c.day,
                        period: c.period
                    });
                });

                const consolidatedSchedule = Array.from(groupedMap.values());
                
                setSchedule(consolidatedSchedule);
                setTotalCredits(data.total_credits);

                if (consolidatedSchedule.length === 0) {
                    setStatus({ msg: "No valid schedule found.", type: "warning" });
                }
            } else {
                setStatus({ msg: `Solver Error: ${data.error_message}`, type: "error" });
            }
        } catch (err: any) {
            setStatus({ msg: `Network Error: ${err.message}`, type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-[900px] bg-[#E1EABB] flex flex-col items-center px-8 py-6 font-sans">
            
            {/* Header */}
            <h1 className="text-[rgba(106,138,131,1)] text-4xl font-bold font-figmaHand mb-6">
                Weekly Schedule
            </h1>
            <div className="w-full max-w-5xl flex flex-row gap-8">
                
                {/* Inputs Card */}
                <div className="bg-[#6A8A83] rounded-3xl px-8 py-6 shadow-sm ">
                    <h3 className="text-white text-xl font-bold mb-4 font-mono tracking-widest uppercase">Parameters</h3>
                    <div className="flex gap-6 flex-col">
                        {[
                            { label: "Major (X)", name: "x" },
                            { label: "Minor (Y)", name: "y" },
                            { label: "Elective (Z)", name: "z" },
                            { label: "Min Credits", name: "min_credits" },
                            { label: "Max Credits", name: "max_credits" }
                        ].map((field) => (
                            <div key={field.name} className="flex flex-col gap-1">
                                <label className="text-white text-sm opacity-90">{field.label}</label>
                                <input 
                                    type="number" 
                                    name={field.name} 
                                    value={(formData as any)[field.name]} 
                                    onChange={handleInputChange} 
                                    min={0}
                                    max={18}
                                    className="p-2 w-24 rounded-xl border-2 border-[#2E3A3A] bg-[#E1EABB] text-[#2E3A3A] font-bold focus:outline-none focus:ring-2 focus:ring-white"
                                />
                            </div>
                        ))}
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
                            ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#6A8A83] hover:bg-[#5a7872]'}
                        `}
                    >
                        {loading ? "Solving..." : "Generate Schedule"}
                    </button>

                    </div>
            </div>


                {/* Grid Card */}
                <div className="bg-white/40 rounded-3xl p-6 shadow-sm border border-[#6A8A83]/20 min-w-[500px]">
                <div className="flex justify-between">
                    <h3 className="text-[#2E3A3A] text-xl font-bold mb-4 font-figmaHand">
                        Blacklist Times <span className="text-sm font-sans font-normal opacity-70">(Click slots to block)</span>
                    </h3>
                    <button type="button" onClick={() => setParameters(!parameters)}>
                        {parameters ? "Hide Parameters" : "Show Parameters"}
                    </button>
                </div>
                    
                    <div className="grid grid-cols-[50px_repeat(5,1fr)] gap-2">
                        {/* Header Row */}
                        <div></div> 
                        {DAYS.map(d => (
                            <div key={d} className="text-center font-bold text-[#2E3A3A] py-2 bg-[#6A8A83]/20 rounded-lg">
                                {d}
                            </div>
                        ))}

                        {/* Grid Body */}
                        {PERIODS.map(p => (
                            <Fragment key={p}>
                                <div className="flex items-center justify-center font-bold text-[#6A8A83]">P{p}</div>
                                {DAYS.map(d => {
                                    const isBlocked = blacklist[d]?.includes(p);
                                    return (
                                        <div 
                                            key={`${d}-${p}`} 
                                            onClick={() => togglePeriod(d, p)}
                                            className={`
                                                h-8 rounded-lg cursor-pointer transition-all duration-200 border-2
                                                ${isBlocked 
                                                    ? 'bg-[#2E3A3A] border-[#2E3A3A]' 
                                                    : 'bg-white border-transparent hover:border-[#6A8A83] hover:bg-white/80'}
                                            `}
                                            title={`Toggle ${d} Period ${p}`}
                                        />
                                    );
                                })}
                            </Fragment>
                        ))}
                    </div>
                </div>
                
                

                {/* Status Message */}
                {status.msg && (
                    <div className={`p-4 rounded-xl font-bold border-2 ${
                        status.type === 'success' ? 'bg-[#d4edda] text-[#155724] border-[#c3e6cb]' :
                        status.type === 'error' ? 'bg-[#f8d7da] text-[#721c24] border-[#f5c6cb]' :
                        'bg-[#fff3cd] text-[#856404] border-[#ffeeba]'
                    }`}>
                        {status.msg}
                    </div>
                )}

                {/* Results Table */}
                {schedule.length > 0 && (
                    <div className="bg-white/60 rounded-3xl p-6 shadow-sm overflow-hidden">
                        <div className="flex justify-between items-end mb-4 border-b-2 border-[#6A8A83] pb-2">
                            <h3 className="text-[#2E3A3A] text-2xl font-bold font-figmaHand">Generated Schedule</h3>
                            <span className="text-[#6A8A83] font-bold text-lg">{totalCredits} Credits</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[#2E3A3A]">
                                        <th className="p-3 font-mono tracking-wider uppercase text-sm">Code</th>
                                        <th className="p-3 font-mono tracking-wider uppercase text-sm">Name</th>
                                        <th className="p-3 font-mono tracking-wider uppercase text-sm">Credits</th>
                                        <th className="p-3 font-mono tracking-wider uppercase text-sm">Type</th>
                                        <th className="p-3 font-mono tracking-wider uppercase text-sm">Meeting Times</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-700">
                                    {schedule.map((c, i) => (
                                        <tr key={i} className="border-b border-gray-200 hover:bg-white/50 transition-colors">
                                            <td className="p-3 font-bold text-[#6A8A83]">{c.course_id}</td>
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
                                                        <span key={idx} className="bg-[#2E3A3A] text-white px-2 py-1 rounded text-xs font-mono">
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