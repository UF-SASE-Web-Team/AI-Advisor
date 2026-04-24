import { DegreeAudit } from "~/components/dashboard/DegreeAudit";
import { EditSemesterPlan } from "~/components/dashboard/EditSemesterPlan";
import { ChatContainer } from "~/components/Chatbot/ChatContainer";
import RightNav from "~/components/navigation/RightNav";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { supabase } from "../../supabase";

export default function Dashboard() {
  const [renderDash, setRender] = useState(false);
  const [navHovered, setNavHovered] = useState(false);
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
    <div
      className={`font-mono grid grid-cols-[min-content_1fr] h-screen p-4 gap-4 transition-all duration-300 ${
        navHovered ? "pr-32" : "pr-16"
      }`}
    >
      <RightNav
        onMouseEnter={() => setNavHovered(true)}
        onMouseLeave={() => setNavHovered(false)}
      />
      <div
        style={{ width: navHovered ? "17vw" : "22vw", height: "calc(100vh - 2rem)" }}
        className="flex flex-col min-h-0 transition-all duration-300">
        <ChatContainer />
      </div>

      <div
        style={{ height: "calc(100vh - 2rem)" }}
        className="flex flex-col min-h-0">
        <EditSemesterPlan />
      </div>
    </div>
  );
}
