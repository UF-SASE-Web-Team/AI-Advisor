import { useState } from "react";

interface ClassObj {
  title: string;
  credits: number;
  days: string;
}

export function SelectPlan() {
  const [mode, setMode] = useState<"default" | "edit">("default");
  const [semester, setSemester] = useState("My Super Long Semester Plan Name Fall 2026");

  const placeholderClasses: ClassObj[] = [
    { title: "MAC2311", credits: 4, days: "M,W,F - 12:50-1:40 PM\nR - 5:10-6:00 PM" },
    { title: "CIS4301", credits: 3, days: "M,W,F - 2:50-3:40 PM\nR - 7:10-8:00 PM" },
    { title: "COP4600", credits: 3, days: "T - 2:50-3:40 PM\nF - 6:10-8:00 PM" },
    { title: "CEN3031", credits: 3, days: "T - 12:50-1:40 PM\nR - 3:10-4:00 PM" },
    { title: "MAC2311", credits: 4, days: "M,W,F - 12:50-1:40 PM\nR - 5:10-6:00 PM" },
    { title: "CIS4301", credits: 3, days: "M,W,F - 2:50-3:40 PM\nR - 7:10-8:00 PM" },
    { title: "COP4600", credits: 3, days: "T - 2:50-3:40 PM\nF - 6:10-8:00 PM" },
    { title: "CEN3031", credits: 3, days: "T - 12:50-1:40 PM\nR - 3:10-4:00 PM" },
  ];

  return (
    <div className="my-3 mx-1 gap-3 h-full min-h-0 flex flex-col relative">
      <div className="w-1/2">
        <SemesterSelect value={semester} onChange={setSemester} />
      </div>

      <div className="border border-widget-border rounded-xl bg-white/60 p-3">
        <SemesterParameters />
      </div>

      <div className="flex-1 min-h-0 border border-widget-border rounded-xl bg-white/60 p-3 flex flex-col gap-3">
        {mode === "default" ? (
          <div className="flex justify-between items-center gap-2">
            <h3 className="font-bold text-gray-700 flex items-center gap-2 min-w-0 flex-1">
              <span className="truncate min-w-0">
                Generated Schedule: <span className="font-normal">{semester}</span>
              </span>
              <button
                aria-label="Rename semester plan"
                title="Rename semester plan"
                className="flex-none text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
            </h3>
            <button
              onClick={() => setMode("edit")}
              className="flex-none bg-widget-titlebar border border-widget-titlebar-border rounded-lg px-4 py-1 text-gray-700 font-bold hover:brightness-95 cursor-pointer text-sm"
            >
              Edit
            </button>
          </div>
        ) : (
          <AddClassRow onSave={() => setMode("default")} />
        )}

        <div className="flex-1 relative min-h-0">
          <ClassList>
            {placeholderClasses.map((c, i) => (
              <ClassItem key={i} {...c} showRemove={mode === "edit"} />
            ))}
          </ClassList>
        </div>
      </div>
    </div>
  );
}

const SemesterSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="relative w-full">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none bg-white border border-widget-border rounded-full py-1.5 pl-4 pr-10 text-gray-700 font-bold focus:outline-none cursor-pointer text-sm"
    >
      <option>My Super Long Semester Plan Name Fall 2026</option>
      <option>Semester 1</option>
      <option>Semester 2</option>
      <option>Semester 3</option>
    </select>
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-widget-border"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8l4 4 4-4" />
    </svg>
  </div>
);

const SemesterParameters = () => {
  const MIN = 0;
  const MAX = 21;
  const [minVal, setMinVal] = useState(14);
  const [maxVal, setMaxVal] = useState(18);

  const minPct = (minVal / MAX) * 100;
  const maxPct = (maxVal / MAX) * 100;

  const onMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(Number(e.target.value), maxVal);
    setMinVal(v);
  };
  const onMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(Number(e.target.value), minVal);
    setMaxVal(v);
  };

  const thumbCls =
    "absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none " +
    "[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full " +
    "[&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer " +
    "[&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:pointer-events-auto " +
    "[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 " +
    "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0 " +
    "[&::-moz-range-thumb]:cursor-pointer";

  return (
    <>
      <h3 className="font-bold text-gray-700 mb-2 text-sm underline">Semester Parameters</h3>
      <label className="block text-xs text-gray-600 mb-1">
        Credit Hours: {minVal}-{maxVal}
      </label>
      <div className="relative h-5 mb-3">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-300 rounded -translate-y-1/2" />
        <div
          className="absolute top-1/2 h-1 bg-blue-500 rounded -translate-y-1/2"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        <input
          type="range"
          min={MIN}
          max={MAX}
          value={minVal}
          onChange={onMinChange}
          className={thumbCls}
          aria-label="Minimum credit hours"
        />
        <input
          type="range"
          min={MIN}
          max={MAX}
          value={maxVal}
          onChange={onMaxChange}
          className={thumbCls}
          aria-label="Maximum credit hours"
        />
      </div>
      <button className="w-full bg-white border border-widget-border rounded-full py-1 px-3 text-gray-700 text-sm hover:bg-gray-50 cursor-pointer">
        Generate New Schedule
      </button>
    </>
  );
};

const AddClassRow = ({ onSave }: { onSave: () => void }) => (
  <div className="flex items-center gap-2">
    <span className="font-bold text-gray-700 text-sm">Add:</span>
    <input
      type="text"
      placeholder="Enter class code (MAC2311)"
      className="flex-1 bg-white border border-widget-border rounded-full py-1 px-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
    />
    <button
      onClick={onSave}
      className="bg-white border border-widget-border rounded-full py-1 px-4 text-gray-700 text-sm hover:bg-gray-50 cursor-pointer"
    >
      Save
    </button>
  </div>
);

const ClassList = ({ children }: any) => (
  <div className="grid grid-cols-2 gap-x-3 gap-y-2 content-start absolute inset-0 overflow-y-auto pr-2 custom-scrollbar">
    {children}
  </div>
);

const ClassItem = ({
  title,
  credits,
  days,
  showRemove = false,
}: ClassObj & { showRemove?: boolean }) => (
  <div className="bg-class-item border-1 border-class-item-border rounded-md px-3 py-2 shadow-sm flex flex-col self-start">
    <div className="flex items-center justify-between mb-1">
      <strong className="font-bold text-gray-700">{title}</strong>
      {showRemove && (
        <button
          aria-label={`Remove ${title}`}
          className="text-gray-500 hover:text-gray-700 cursor-pointer text-sm leading-none"
        >
          ×
        </button>
      )}
    </div>
    <p className="text-xs text-gray-600 mb-1">Credits: {credits}</p>
    <p className="text-xs text-gray-600 whitespace-pre-wrap">{days}</p>
  </div>
);
