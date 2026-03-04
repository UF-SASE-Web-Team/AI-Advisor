import { DegreeAudit } from "~/components/DegreeAudit";
import { Calendar } from "~/components/Calendar";
import { SelectPlan } from "~/components/SelectPlan";
import { ChatContainer } from "~/components/Chatbot/ChatContainer";

export default function Dashboard() {
  // TODO: redirect to login page if user isn't logged in
  return (
    <div className="grid grid-cols-4 h-screen">
      <div
        className="
        col-span-1 grid grid-rows-2
        border-r
        "
      >
        <DegreeAudit />
        <ChatContainer />
      </div>

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
