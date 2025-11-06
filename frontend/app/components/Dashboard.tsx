import DegreeAudit from "./audit/DegreeAudit";
import PlanPage from "./plans/PlanPage";
import CurrentSchedule from "./schedule/CurrentSchedule";

export default function Dashboard() {
    return (
        <div className="flex items-center justify-center border">
            <PlanPage />
            <CurrentSchedule />
            <DegreeAudit />
        </div>
    );
}