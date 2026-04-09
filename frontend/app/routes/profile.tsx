import { DegreeAudit } from "~/components/DegreeAudit";
import { Calendar } from "~/components/Calendar";
import { SelectPlan } from "~/components/SelectPlan";
import { ChatContainer } from "~/components/Chatbot/ChatContainer";
import { TempButton } from "~/components/temp_upload";
import { Widget } from "~/components/Widget";
import { useState } from "react";

const semesters = ["Summer", "Fall", "Spring"] as const;

const mockData = {
    Summer: [],
    Fall: [
        { code: "COP3502C", credits: 4, grade: "A-", format: "In-Person", meetingInfo: "T 1:55 - 2:45 PM / R 3:15 - 4:05 PM"},
        { code: "ECO2021", credits: 3, grade: "B", format: "Online", meetingInfo: "Online"},
    ],
    Spring: [],
};

export async function loader() {
  return {};
}

export function TranscriptWidget() {
    const [activeSemester, setActiveSemester] = useState<"Summer" | "Fall" | "Spring">("Fall");
    const rows = mockData[activeSemester] ?? []

    return (
        <div className="flex flex-col gap-3 p-3">

            <div className="flex gap-2">
                {semesters.map((sem) => (
                    <button
                        key={sem}
                        onClick={() => setActiveSemester(sem)}
                        className={`px-4 py-1 rounded-full border text-sm font-medium transition-colors
                            ${activeSemester === sem
                                ? "bg-green-300 border-green-400 text-green-900"
                                : "bg-transparent border-gray-400 text-gray-600 hover:border-gray-600"
                            }`}>
                                {sem}
                            </button>
                ))}
            </div>
        </div>
    )
};

export default function UserProfile() {
  return (
    <div className="flex h-screen p-4 gap-4">
      <Widget title="Transcript">
        <TranscriptWidget />
      </Widget>
    </div>
  );
}