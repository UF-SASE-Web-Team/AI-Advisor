import { DegreeAudit } from "~/components/DegreeAudit";
import { Calendar } from "~/components/Calendar";
import { SelectPlan } from "~/components/SelectPlan";
import { ChatContainer } from "~/components/Chatbot/ChatContainer";
import { Sidebar } from "~/components/Sidebar";

export default function Dashboard() {
  // TODO: redirect to login page if user isn't logged in
  return (
    <div className="grid grid-cols-4 h-screen">
      <Sidebar>
        <DegreeAudit />
        <ChatContainer />
      </Sidebar>

      {/* primary widget */}
      <div
        className="col-span-3
        flex-row"
      >
        <SelectPlan />
        <Calendar />
      </div>
    </div>
  );
}
