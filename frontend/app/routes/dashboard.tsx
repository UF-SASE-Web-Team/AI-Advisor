import { DegreeAudit } from "~/components/DegreeAudit";
import { Calendar } from "~/components/Calendar";
import { SelectPlan } from "~/components/SelectPlan";
import { ChatContainer } from "~/components/Chatbot/ChatContainer";
import RightNav from "~/components/navigation/RightNav";

export default function Dashboard() {
  // TODO: redirect to login page if user isn't logged in
  return (
    <>
      <RightNav />

      <div className="grid grid-cols-[min-content_1fr] h-screen pr-12">
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
    </>
  );
}
