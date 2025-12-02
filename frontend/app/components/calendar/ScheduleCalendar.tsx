import { useState } from "react";

interface FormData {
    x: number;            // Major courses
    y: number;            // Minor courses
    z: number;            // Electives
    min_credits: number;
    max_credits: number;
}

interface ScheduleItem {
    course_id: string;
    course_name: string;
    credits: number;
    course_type: string;
    day: string;
    period: number;
}

interface StatusMessage {
    msg: string;
    type: "success" | "error" | "warning" | "info" | "";
}

const DAYS = ["M", "T", "W", "R", "F"];
const PERIODS = Array.from({ length: 11 }, (_, i) => i + 1);

export function ScheduleCalendar() {
    const [formData, setFormData] = useState<FormData>({
        x: 2,
        y: 1,
        z: 1,
        min_credits: 12,
        max_credits: 16,
    });

    // Blacklist state: { "M": [1, 2], "T": [] }
    const [blacklist, setBlacklist] = useState<Record<string, number[]>>({
        M: [], T: [], W: [], R: [], F: []
    });

    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [totalCredits, setTotalCredits] = useState<number>(0);
    const [status, setStatus] = useState<StatusMessage>({ msg: "", type: "" });
    const [loading, setLoading] = useState<boolean>(false);

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

        const payload = {
            ...formData,
            blacklisted_periods: blacklist,
        };

        try {
            //
            const res = await fetch("http://localhost:8080/api/userpreference/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setStatus({ msg: "Preferences saved! Ready to generate.", type: "success" });
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
                setSchedule(data.scheduled_courses || []);
                setTotalCredits(data.total_credits);
                if ((data.scheduled_courses || []).length === 0) {
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
        <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
            {/* Inline styles for the grid logic */}
            <style>{`
                .grid-container {
                    display: grid;
                    grid-template-columns: 50px repeat(5, 1fr); /* 1 col for labels, 5 for days */
                    gap: 5px;
                    margin-top: 10px;
                }
                .grid-header {
                    font-weight: bold;
                    text-align: center;
                    padding: 5px;
                    background: #f0f0f0;
                }
                .grid-label {
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .grid-cell {
                    border: 1px solid #ccc;
                    height: 40px;
                    cursor: pointer;
                    background-color: white;
                    transition: background 0.2s;
                }
                .grid-cell:hover {
                    background-color: #e6f7ff;
                }
                .grid-cell.blacklisted {
                    background-color: #ff4d4f; /* Red for blocked */
                    border-color: #d32f2f;
                }
                .input-group { margin-bottom: 15px; display: flex; gap: 20px; flex-wrap: wrap; }
                .input-item { display: flex; flex-direction: column; }
                .btn { padding: 10px 20px; margin-right: 10px; cursor: pointer; border: none; border-radius: 4px; font-weight: bold; }
                .btn-save { background-color: #00529b; color: white; }
                .btn-gen { background-color: #f37021; color: white; }
                .status { margin-top: 10px; padding: 10px; border-radius: 4px; }
                .status.success { background: #d4edda; color: #155724; }
                .status.error { background: #f8d7da; color: #721c24; }
            `}</style>

            <h2>Schedule Configuration</h2>
            
            {/* 1. Numeric Preferences */}
            <div className="input-group">
                <div className="input-item">
                    <label>Major (X)</label>
                    <input type="number" name="x" value={formData.x} onChange={handleInputChange} min={0} />
                </div>
                <div className="input-item">
                    <label>Minor (Y)</label>
                    <input type="number" name="y" value={formData.y} onChange={handleInputChange} min={0} />
                </div>
                <div className="input-item">
                    <label>Elective (Z)</label>
                    <input type="number" name="z" value={formData.z} onChange={handleInputChange} min={0} />
                </div>
                <div className="input-item">
                    <label>Min Credits</label>
                    <input type="number" name="min_credits" value={formData.min_credits} onChange={handleInputChange} min={1} />
                </div>
                <div className="input-item">
                    <label>Max Credits</label>
                    <input type="number" name="max_credits" value={formData.max_credits} onChange={handleInputChange} min={1} />
                </div>
            </div>

            {/* 2. Blacklist Grid */}
            <h3>Block Times (Click to blacklist)</h3>
            <div className="grid-container">
                {/* Header Row */}
                <div></div> {/* Empty top-left corner */}
                {DAYS.map(day => (
                    <div key={day} className="grid-header">{day}</div>
                ))}

                {/* Rows for Periods 1-11 */}
                {PERIODS.map(period => (
                    <>
                        {/* Row Label */}
                        <div key={`label-${period}`} className="grid-label">P{period}</div>
                        
                        {/* Cells for each Day */}
                        {DAYS.map(day => {
                            const isBlacklisted = blacklist[day]?.includes(period);
                            return (
                                <div
                                    key={`${day}-${period}`}
                                    className={`grid-cell ${isBlacklisted ? 'blacklisted' : ''}`}
                                    onClick={() => togglePeriod(day, period)}
                                    title={`Toggle ${day} Period ${period}`}
                                />
                            );
                        })}
                    </>
                ))}
            </div>
            
            <div style={{ marginTop: "20px" }}>
                <button onClick={handleSave} className="btn btn-save">Save Preferences</button>
                <button onClick={handleGenerate} className="btn btn-gen" disabled={loading}>
                    {loading ? "Solving..." : "Generate Schedule"}
                </button>
            </div>

            {/* Status Messages */}
            {status.msg && <div className={`status ${status.type}`}>{status.msg}</div>}

            {/* 3. Results Table */}
            {schedule.length > 0 && (
                <div style={{ marginTop: "30px" }}>
                    <h3>Generated Schedule ({totalCredits} Credits)</h3>
                    <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse", border: "1px solid #ddd" }}>
                        <thead>
                            <tr style={{ background: "#f9f9f9", textAlign: "left" }}>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Credits</th>
                                <th>Type</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedule.map((c, i) => (
                                <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                                    <td>{c.course_id}</td>
                                    <td>{c.course_name}</td>
                                    <td>{c.credits}</td>
                                    <td>{c.course_type}</td>
                                    <td>{c.day} Period {c.period}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}