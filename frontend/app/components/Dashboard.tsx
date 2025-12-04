import {DegreeAudit} from "./audit/DegreeAudit";
import {ScheduleCalendar} from "./calendar/ScheduleCalendar";
import {PlanPage} from "./plans/PlanPage";
import {CurrentSchedule} from "./schedule/CurrentSchedule";
import  NavigationBar from "./navigation/NavigationBar";

export default function Dashboard() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="absolute top-0 right-0 z-10">
        <NavigationBar />
      </div>

      <div className="flex flex-1 gap-4 p-4">
        <PlanPage />
        <CurrentSchedule />
        <DegreeAudit />
        <ScheduleCalendar />
      </div>
    </div>
  );
}