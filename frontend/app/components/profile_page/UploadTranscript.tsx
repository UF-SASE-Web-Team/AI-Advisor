import React from "react";
import { API_URL } from "~/config";

export function UploadTranscript() {
    const upload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("transcript", file);
        formData.append("userID", "AnyUserIDYouWant");

        fetch(`${API_URL}/api/v2/transcript/upload/`, {
            method: "POST",
            body: formData
        })
            .then(response => response.json())
            .then(data => console.log(data))
            .catch(error => console.error('Error:', error));
    };


    return (
        <div>
            <input id="upload" type="file" className="hidden"></input>
            <label htmlFor="upload"
                className="
                px-2 py-1 rounded-full 
                bg-[#c8e6a0] border border-[#a8cc70] text-green-900
                text-xs font-medium
                cursor-pointer">Upload</label>
        </div>



    );
}