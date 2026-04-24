import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";

export function ProfileSettings() {
  const [name, setName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const meta = (user.user_metadata ?? {}) as Record<string, any>;
        const displayName =
          meta.full_name ||
          meta.name ||
          meta.user_name ||
          (user.email ? user.email.split("@")[0] : "User");
        setName(displayName);
        setAvatarUrl(meta.avatar_url || meta.picture || null);
      }

      setLoading(false);
    })();
  }, []);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 bg-class-item border border-class-item-border rounded-md flex items-center justify-center text-gray-700 overflow-hidden flex-none">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <UserIcon />
          )}
        </div>
        <h2 className="text-xl font-bold tracking-wider text-gray-800 truncate">
          {loading ? "…" : name || "User"}
        </h2>
      </div>

      <div className="border border-widget-border rounded-xl bg-white/70 p-3 flex flex-col gap-2">
        <h3 className="font-bold text-gray-700 underline">Major</h3>
        <p className="text-sm text-gray-700">Computer Science</p>
      </div>
    </div>
  );
}

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-6 h-6"
    aria-hidden="true"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
