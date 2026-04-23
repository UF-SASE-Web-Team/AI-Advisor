import { DegreeAudit } from "~/components/dashboard/DegreeAudit";
import { Calendar } from "~/components/dashboard/Calendar";
import { SelectPlan } from "~/components/dashboard/SelectPlan";
import { ChatContainer } from "~/components/Chatbot/ChatContainer";
import { UploadTranscript } from "~/components/profile_page/UploadTranscript";
import { Widget } from "~/components/dashboard/Widget";
import { useState } from "react";
import { TranscriptEditor } from "~/components/profile_page/TranscriptEditor";

export default function UserProfile() {
    return (
        <div className="flex flex-row h-screen p-4 gap-4">

            <Widget title="Upload Transcript">
                <div className="flex flex-col gap-2 p-2">

                    <div className="flex gap-2">
                        <UploadTranscript />
                        <button className="
                px-2 py-1 rounded-full 
                bg-[#c8e6a0] border border-[#a8cc70] text-green-900
                text-xs font-medium
                cursor-pointer">
                            Delete Old Transcript
                        </button>
                    </div>

                    <div className="bg-white rounded border border-gray-300 h-[280px] flex items-center justify-center text-gray-400 text-xs font-mono">
                        (Pdf viewer)
                    </div>
                </div>
            </Widget>

            <Widget title="Transcript Manual Input">
                <TranscriptEditor />
            </Widget>


        </div >
    );
}