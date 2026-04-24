import { Widget } from "./Widget";

interface ClassObj {
  title: string;
  credits: number;
  days: string;
}

export function SelectPlan() {
  const placeholderClasses = [
    {
      title: "ECO2021",
      credits: 3,
      days: "Online Asynchronous",
    },
    {
      title: "COP3502C",
      credits: 3,
      days: "T - 2:30-3:15 PM\nR - 3:15-4:05 PM",
    },
  ];

  return (
    <Widget title="Semester Plan Selection" className="flex-none h-73">
      <div className="m-3 gap-4 flex-1
      flex flex-row
      relative">
        <div className="flex-1 relative">
          <ClassList>
            <ClassItem {...placeholderClasses[0]} />
            <ClassItem {...placeholderClasses[1]} />
            <ClassItem {...placeholderClasses[0]} />
            <ClassItem {...placeholderClasses[1]} />
            <ClassItem {...placeholderClasses[0]} />
            <ClassItem {...placeholderClasses[1]} />
            <ClassItem {...placeholderClasses[0]} />
            <ClassItem {...placeholderClasses[1]} />
          </ClassList>
        </div>

        <SemPlanControls />
      </div>
    </Widget >
  );
}

const ClassList = ({ children }: any) => {
  return (
    <div
      className="
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
  gap-3
  absolute inset-0 overflow-y-auto pr-2 custom-scrollbar"
    >
      {children}
    </div>
  );
};

const ClassItem = ({ title, credits, days }: ClassObj) => {
  return (
    <div
      className="
    bg-class-item
    border-1 border-class-item-border
    rounded-md px-3 py-2 shadow-sm flex flex-col"
    >
      <strong className="block font-bold text-gray-700 mb-1">{title}</strong>
      <p className="text-xs text-gray-600 mb-1">Credits: {credits}</p>
      <p className="text-xs text-gray-600 whitespace-pre-wrap">{days}</p>
    </div>
  );
};

const SemPlanControls = () => {
  return (
    <div className="flex flex-col justify-center gap-2">
      <div className="relative w-full">
        <select className="w-full appearance-none bg-white border border-widget-border rounded-full py-1.5 pl-4 pr-10 text-gray-700 font-bold focus:outline-none cursor-pointer text-sm">
          <option>Semester 1</option>
          <option>Semester 2</option>
          <option>Semester 3</option>
        </select>

      </div>
      <button className="w-full bg-white border border-widget-border rounded-full py-1.5 px-4 text-gray-700 font-bold hover:bg-gray-50 transition-colors text-sm cursor-pointer">
        Edit
      </button>
    </div>
  );
};