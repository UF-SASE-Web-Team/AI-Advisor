import { DegreeAudit } from "~/components/DegreeAudit";
import { Calendar } from "~/components/Calendar";
import { SelectPlan } from "~/components/SelectPlan";
import { ChatContainer } from "~/components/Chatbot/ChatContainer";

export default function Dashboard() {
  // TODO: redirect to login page if user isn't logged in
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ width: "25vw" }}>
        <DegreeAudit />
        <ChatContainer />
      </div>
      
      <div style={{ flexDirection: "column", flex: 1 }}>
        <SelectPlan />
        <Calendar />
      </div>
    </div>
  );
}
