import { DegreeAudit } from "~/components/dashboard/DegreeAudit";
import { Calendar } from "~/components/dashboard/Calendar";
import { SelectPlan } from "~/components/dashboard/SelectPlan";
import { ChatContainer } from "~/components/Chatbot/ChatContainer";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { supabase } from "supabase";
import { TempButton } from "~/components/dashboard/temp_upload";

export default function Dashboard() {
  const [renderDash, setRender] = useState(false);
  // Redirect user if not logged in
  const navigate = useNavigate();
  useEffect(() => {
    const checkAuth = async () => {
      // TODO: At this point, only google login is implemented and populates the session var
      // Manual login might need a different check
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); }
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
        <TempButton />
      </div>
    </div>
  );
}
