import React from "react";
import { supabase } from "../../../supabase";
import { API_URL } from "~/config";

export function TempButton() {
    const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = event.target.files?.[0];
            if (!file) return;

            const { data: { session } } = await supabase.auth.getSession();
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

            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.error("Error:", error);
        }
    };


    return (

        <input
            // From https://stackoverflow.com/questions/76399846/how-to-style-html-file-input-using-tailwind-css
            className="text-sm text-stone-500
                    file:mr-5 file:py-1 file:px-3 file:border-[1px]
                    file:text-xs file:font-medium
                    file:bg-stone-50 file:text-stone-700
                    hover:file:cursor-pointer hover:file:bg-blue-50
                    hover:file:text-blue-700"
            type="file"
            accept=".pdf"
            id="transcript"
            onChange={upload}
        ></input>


    );
}