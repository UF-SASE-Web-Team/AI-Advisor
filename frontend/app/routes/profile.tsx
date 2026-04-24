import { UploadTranscript } from "~/components/profile_page/UploadTranscript";
import { ProfileSettings } from "~/components/profile_page/ProfileSettings";
import { Widget } from "~/components/dashboard/Widget";
import { TranscriptEditor } from "~/components/profile_page/TranscriptEditor";
import RightNav from "~/components/navigation/RightNav";
import { useState } from "react";

export default function UserProfile() {
    const [navHovered, setNavHovered] = useState(false);

    return (
        <div
            className={`font-mono flex flex-row h-screen p-4 gap-4 transition-all duration-300 ${
                navHovered ? "pr-32" : "pr-16"
            }`}
        >
            <RightNav
                onMouseEnter={() => setNavHovered(true)}
                onMouseLeave={() => setNavHovered(false)}
            />

            <div
                style={{ width: navHovered ? "25vw" : "30vw", height: "calc(100vh - 2rem)" }}
                className="flex flex-col gap-4 min-h-0 transition-all duration-300"
            >
                <Widget title="Profile Settings" titleClassName="text-xl" className="flex-none">
                    <ProfileSettings />
                </Widget>

                <Widget title="Upload Transcript" titleClassName="text-xl" className="flex-1 min-h-0">
                    <UploadTranscript />
                </Widget>
            </div>

            <div
                style={{ height: "calc(100vh - 2rem)" }}
                className="flex flex-col min-h-0 flex-1 min-w-0"
            >
                <Widget title="Edit Parameters" titleClassName="text-xl text-center" className="flex-1 min-h-0">
                    <TranscriptEditor />
                </Widget>
            </div>
        </div>
    );
}
