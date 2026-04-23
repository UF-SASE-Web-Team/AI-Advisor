import { DegreeAudit } from "~/components/dashboard/DegreeAudit";
import { Calendar } from "~/components/dashboard/Calendar";
import { SelectPlan } from "~/components/dashboard/SelectPlan";
import { ChatContainer } from "~/components/Chatbot/ChatContainer";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { supabase } from "supabase";

export default function Dashboard() {
  const [renderDash, setRender] = useState(false);
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
        <SelectPlan />
        <Calendar />
      </div>
    </div>
  );
}
