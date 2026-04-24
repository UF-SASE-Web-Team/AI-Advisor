import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabase";
import { API_URL } from "~/config";

const BUCKET = "transcripts-pdf";

export function UploadTranscript() {
  const [file, setFile] = useState<File | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [remoteUrl, setRemoteUrl] = useState<string | null>(null);
  const [remoteName, setRemoteName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const pdfUrl = localUrl || remoteUrl;

  // Local preview for the currently-selected file
  useEffect(() => {
    if (!file) {
      setLocalUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setLocalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // On mount, load the latest transcript for this user from Supabase storage
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: files, error } = await supabase.storage
        .from(BUCKET)
        .list(user.id, {
          limit: 1,
          sortBy: { column: "created_at", order: "desc" },
        });
      if (error || !files || files.length === 0 || cancelled) return;

      const latest = files[0];
      const path = `${user.id}/${latest.name}`;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      if (pub?.publicUrl && !cancelled) {
        setRemoteUrl(pub.publicUrl);
        setRemoteName(latest.name);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const f = event.target.files?.[0];
    if (f) {
      setFile(f);
      setStatusMsg(null);
    }
    event.target.value = "";
  };

  const onSubmit = async () => {
    if (!file) return;
    setIsUploading(true);
    setStatusMsg(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!user || !accessToken) {
        throw new Error("You must be logged in to upload a transcript.");
      }

      // 1) Upload to Supabase storage bucket
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          contentType: file.type || "application/pdf",
          upsert: false,
        });
      if (storageError) throw storageError;

      // 2) POST to the existing backend ingest endpoint
      const formData = new FormData();
      formData.append("transcript", file);
      const response = await fetch(`${API_URL}/api/v2/transcript/upload/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
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

      // 3) Refresh preview to point at the newly-stored file
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      if (pub?.publicUrl) {
        setRemoteUrl(pub.publicUrl);
        setRemoteName(file.name);
      }

      setStatusMsg("Transcript uploaded.");
      setFile(null);
    } catch (error) {
      console.error("Error:", error);
      setStatusMsg(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-2 flex-1 min-h-0">
      <div className="flex gap-2 flex-wrap">
        <input
          id="transcript-upload"
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          onChange={onSelect}
        />
        <label
          htmlFor="transcript-upload"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c8e6a0] border border-[#a8cc70] text-green-900 text-xs font-medium cursor-pointer hover:brightness-95"
        >
          <UploadIcon />
          {file || remoteUrl ? "Change File" : "Upload New Transcript"}
        </label>
        {file && (
          <button
            onClick={onSubmit}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c8e6a0] border border-[#a8cc70] text-green-900 text-xs font-medium cursor-pointer hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <CheckIcon />
            {isUploading ? "Submitting…" : "Submit"}
          </button>
        )}
      </div>

      {file && (
        <p className="text-xs text-gray-600 truncate" title={file.name}>
          Selected: {file.name}
        </p>
      )}
      {!file && remoteName && (
        <p className="text-xs text-gray-500 truncate" title={remoteName}>
          Current: {remoteName}
        </p>
      )}
      {statusMsg && <p className="text-xs text-gray-600">{statusMsg}</p>}

      <div className="bg-white rounded border border-gray-300 flex-1 min-h-[280px] overflow-hidden">
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            title="Transcript preview"
            className="w-full h-full"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-xs font-mono">
            (No PDF selected)
          </div>
        )}
      </div>
    </div>
  );
}

const UploadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-3.5 h-3.5"
    aria-hidden="true"
  >
    <path d="M12 16V4" />
    <path d="M6 10l6-6 6 6" />
    <path d="M4 20h16" />
  </svg>
);

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-3.5 h-3.5"
    aria-hidden="true"
  >
    <path d="M5 12l5 5L20 7" />
  </svg>
);
