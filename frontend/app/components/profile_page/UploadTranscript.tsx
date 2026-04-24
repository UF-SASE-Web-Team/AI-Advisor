import React, { useState } from "react";
import { supabase } from "../../../supabase";
import { API_URL } from "~/config";

export function UploadTranscript() {
    const [isUploading, setIsUploading] = useState(false);

    const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputEl = event.target;
        try {
            const file = inputEl.files?.[0];
            if (!file) return;

            setIsUploading(true);

            const {
                data: { session },
            } = await supabase.auth.getSession();
            const accessToken = session?.access_token;
            if (!accessToken) {
                throw new Error("You must be logged in to upload a transcript.");
            }

            const formData = new FormData();
            formData.append("transcript", file);

            const response = await fetch(`${API_URL}/api/v2/transcript/upload/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                body: formData,
            });

            const rawBody = await response.text();
            const data = rawBody ? JSON.parse(rawBody) : {};

            if (!response.ok) {
                const message =
                    (data && typeof data.error === "string" && data.error) ||
                    (data && typeof data.error_message === "string" && data.error_message) ||
                    `upload failed (${response.status})`;
                throw new Error(message);
            }

            console.log(data);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setIsUploading(false);
            inputEl.value = "";
        }
    };


    return (
        <div>
            <input
                id="transcript-upload"
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                onChange={upload}
                disabled={isUploading}
            />
            <label
                htmlFor="transcript-upload"
                className={`
                inline-block px-2 py-1 rounded-full 
                bg-[#c8e6a0] border border-[#a8cc70] text-green-900
                text-xs font-medium
                ${isUploading ? "opacity-60 pointer-events-none" : "cursor-pointer"}`}
                aria-disabled={isUploading}
            >
                {isUploading ? "Uploading..." : "Upload"}
            </label>
        </div>



    );
}