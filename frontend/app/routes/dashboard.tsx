import { DegreeAudit } from "~/components/dashboard/DegreeAudit";
import { Calendar } from "~/components/dashboard/Calendar";
import { SelectPlan } from "~/components/dashboard/SelectPlan";
import { ChatContainer } from "~/components/Chatbot/ChatContainer";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { supabase } from "supabase";
import { TempButton } from "~/components/dashboard/temp_upload";

type DayKey = "M" | "T" | "W" | "R" | "F";

const EMPTY_BLACKLIST: Record<DayKey, number[]> = {
  M: [],
  T: [],
  W: [],
  R: [],
  F: [],
};

export default function Dashboard() {
  const [renderDash, setRender] = useState(false);
    const [blacklist, setBlacklist] = useState<Record<DayKey, number[]>>(EMPTY_BLACKLIST);
    const [userId, setUserId] = useState<string | null>(null);
  
  // Redirect user if not logged in
  const navigate = useNavigate();
  useEffect(() => {
    const checkAuth = async () => {
      // TODO: At this point, only google login is implemented and populates the session var
      // Manual login might need a different check
      
      // Check if returning from OAuth callback
      const isOAuthReturn = new URLSearchParams(window.location.search).get("from") === "oauth";
      
      // Give OAuth session a moment to settle
      if (isOAuthReturn) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login?redirected=true"); }
      else { setRender(true); }
    };
    checkAuth();
  }, [navigate]);

  // Get user and load blacklist
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    supabase
      .from("user_preferences")
      .select("blacklist_slots")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        const next: Record<DayKey, number[]> = { ...EMPTY_BLACKLIST };
        const slots = (data?.blacklist_slots ?? []) as Array<{day: DayKey; period: number}>;

        slots.forEach((slot) => {
          if (next[slot.day]) {
            next[slot.day] = [...next[slot.day], slot.period].sort((a, b) => a - b);
          }
        });

        setBlacklist(next);
      });
  }, [userId]);

  // Dashboard page
  if (!renderDash) return null;
  return (
    <div className="grid grid-cols-[min-content_1fr] h-screen">
      <div
        style={{ width: "30vw" }}
        className="flex flex-col
        h-full">
        <DegreeAudit />
        <ChatContainer />
      </div>

      {/* primary widget */}
      <div
        className="
        flex-row"
      >
        <SelectPlan blacklist={blacklist} setBlacklist={setBlacklist} userId={userId} />
        <div className="flex flex-col flex-1">
          <Calendar blacklist={blacklist} setBlacklist={setBlacklist} userId={userId} />
          <div className="p-4 border-t">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Upload Transcript</h3>
            <TempButton />
          </div>
        </div>
      </div>
    </div>
  );
}
