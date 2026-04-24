import Calendar from "./Calendar";
import { SelectPlan } from "./SelectPlan";
import { Widget } from "./Widget";

export function EditSemesterPlan() {
  return (
    <Widget title="Edit Semester Plan" className="flex-1 min-h-0" titleClassName="text-center text-xl">
      <div className="flex flex-row gap-1 px-2 py-4 min-h-0 flex-1">
        <div className="flex-1 min-h-0 min-w-0">
          <SelectPlan />
        </div>
        <div className="flex-1 min-h-0 min-w-0 overflow-auto">
          <Calendar />
        </div>
      </div>
    </Widget>
  );
}
