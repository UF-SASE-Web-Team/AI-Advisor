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
    <Widget title="Semester Plan Selection">
      <div className="m-3 gap-4 min-h-0
      flex flex-row flex-1
      relative">
        {/* Left col */}
        <div className="flex-1 relative min-h-0">
          {/* Scrollable area*/}
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

        {/* Right col */}
        <div className="flex-none w-[160px] md:w-[200px]">
          <SemPlanControls />
          <Invis2RowHeightBlock />
        </div>
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
    rounded-md px-3 py-2 shadow-sm h-full flex flex-col"
    >
      <strong className="block font-bold text-gray-700 mb-1">{title}</strong>
      <p className="text-xs text-gray-600 mb-1">Credits: {credits}</p>
      <p className="text-xs text-gray-600 whitespace-pre-wrap">{days}</p>
    </div>
  );
};

const SemPlanControls = () => {
  return (
    <div className="flex flex-col justify-center gap-2 w-full h-full">
      <div className="relative w-full">
        <select className="w-full appearance-none bg-white border border-widget-border rounded-full py-1.5 pl-4 pr-10 text-gray-700 font-bold focus:outline-none cursor-pointer text-sm">
          <option>Semester 1</option>
          <option>Semester 2</option>
          <option>Semester 3</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#a2bd4b]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      <button className="w-full bg-white border border-widget-border rounded-full py-1.5 px-4 text-gray-700 font-bold hover:bg-gray-50 transition-colors text-sm">
        Edit
      </button>
    </div>
  );
};

const Invis2RowHeightBlock = ({ classItem }: any) => {
  return (
    <div className="invisible pointer-events-none" aria-hidden="true">
      <div className="grid grid-cols-1 gap-3">
        <ClassItem {...classItem} />
        <ClassItem {...classItem} />
      </div>
    </div>
  );
}