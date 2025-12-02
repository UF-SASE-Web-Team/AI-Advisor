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
    slots: CourseSlot[]; // Changed from single day/period to list
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
                // The server sends one entry per time slot (e.g., 3 entries for a M/W/F class).
                // We group them by course_id so they display as one row.
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
                    // Add this specific slot to the course
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
        <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto", fontFamily: "sans-serif" }}>
            <style>{`
                .grid-container { display: grid; grid-template-columns: 50px repeat(5, 1fr); gap: 4px; margin-top: 10px; }
                .grid-header { font-weight: bold; text-align: center; padding: 8px; background: #eee; }
                .grid-label { font-weight: bold; display: flex; align-items: center; justify-content: center; color: #555; }
                .grid-cell { border: 1px solid #ddd; height: 35px; cursor: pointer; background-color: white; transition: 0.2s; }
                .grid-cell:hover { background-color: #f0f8ff; }
                .grid-cell.blacklisted { background-color: #ffcccc; border-color: #ff9999; }
                
                .input-group { display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 20px; }
                .input-item { display: flex; flex-direction: column; }
                .input-item input { padding: 6px; border: 1px solid #ccc; border-radius: 4px; width: 80px; }
                
                .btn { padding: 10px 20px; margin-right: 10px; cursor: pointer; border: none; border-radius: 4px; font-weight: bold; color: white; }
                .btn-save { background-color: #00529b; }
                .btn-gen { background-color: #f37021; }
                .btn:disabled { background-color: #ccc; cursor: not-allowed; }
                
                .status { margin-top: 15px; padding: 10px; border-radius: 4px; }
                .status.success { background: #d4edda; color: #155724; }
                .status.error { background: #f8d7da; color: #721c24; }
                .status.warning { background: #fff3cd; color: #856404; }

                table { width: 100%; border-collapse: collapse; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                th { background: #00529b; color: white; padding: 12px; text-align: left; }
                td { padding: 12px; border-bottom: 1px solid #eee; vertical-align: top; }
                tr:last-child td { border-bottom: none; }
                .slot-tag { display: inline-block; background: #eef; padding: 2px 6px; border-radius: 4px; margin: 2px; font-size: 0.9em; border: 1px solid #dde; }
            `}</style>

            <h2>Schedule Configuration</h2>
            
            <div className="input-group">
                <div className="input-item"><label>Major (X)</label><input type="number" name="x" value={formData.x} onChange={handleInputChange} min={0} /></div>
                <div className="input-item"><label>Minor (Y)</label><input type="number" name="y" value={formData.y} onChange={handleInputChange} min={0} /></div>
                <div className="input-item"><label>Elective (Z)</label><input type="number" name="z" value={formData.z} onChange={handleInputChange} min={0} /></div>
                <div className="input-item"><label>Min Credits</label><input type="number" name="min_credits" value={formData.min_credits} onChange={handleInputChange} min={1} /></div>
                <div className="input-item"><label>Max Credits</label><input type="number" name="max_credits" value={formData.max_credits} onChange={handleInputChange} min={1} /></div>
            </div>

            <h3>Blacklist Times (Click to Block)</h3>
            <div className="grid-container">
                <div></div> 
                {DAYS.map(d => <div key={d} className="grid-header">{d}</div>)}
                {PERIODS.map(p => (
                    <Fragment key={p}>
                        <div key={`label-${p}`} className="grid-label">P{p}</div>
                        {DAYS.map(d => (
                            <div 
                                key={`${d}-${p}`} 
                                className={`grid-cell ${blacklist[d]?.includes(p) ? 'blacklisted' : ''}`}
                                onClick={() => togglePeriod(d, p)}
                                title={`Toggle ${d} Period ${p}`}
                            />
                        ))}
                    </Fragment>
                ))}
            </div>
            
            <div style={{ marginTop: "20px" }}>
                <button onClick={handleSave} className="btn btn-save">Save Preferences</button>
                <button onClick={handleGenerate} className="btn btn-gen" disabled={loading}>
                    {loading ? "Solving..." : "Generate Schedule"}
                </button>
            </div>

            {status.msg && <div className={`status ${status.type}`}>{status.msg}</div>}

            {schedule.length > 0 && (
                <div>
                    <h3>Generated Schedule ({totalCredits} Credits)</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Credits</th>
                                <th>Type</th>
                                <th>Meeting Times</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedule.map((c, i) => (
                                <tr key={i}>
                                    <td><strong>{c.course_id}</strong></td>
                                    <td>{c.course_name}</td>
                                    <td>{c.credits}</td>
                                    <td>{c.course_type}</td>
                                    <td>
                                        {/* Display all slots for this course */}
                                        {c.slots.map((s, idx) => (
                                            <span key={idx} className="slot-tag">
                                                {s.day} Period {s.period}
                                            </span>
                                        ))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}