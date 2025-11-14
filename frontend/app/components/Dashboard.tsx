import {DegreeAudit} from "./audit/DegreeAudit";
import {ScheduleCalendar} from "./calendar/ScheduleCalendar";
import {PlanPage} from "./plans/PlanPage";
import {CurrentSchedule} from "./schedule/CurrentSchedule";

export default function Dashboard() {
    return (
        <div className="flex items-center justify-center border">
            <PlanPage />
            <CurrentSchedule />
            <DegreeAudit />
            <ScheduleCalendar />
        </div>
    );
}