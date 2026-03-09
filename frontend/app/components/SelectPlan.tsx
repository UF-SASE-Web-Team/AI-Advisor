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
      <div
        className="m-3
      flex flex-row"
      >
        <ClassList>
          <ClassItem {...placeholderClasses[0]} />
          <ClassItem {...placeholderClasses[1]} />
        </ClassList>

        <SemPlanControls />
      </div>
    </Widget>
  );
}

const ClassList = ({ children }: any) => {
  return (
    <div
      className="
  grid
  gap-2"
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
    border-1 border-class-item-border"
    >
      <strong>{title}</strong>
      <p>Credits: {credits}</p>
      <p>{days}</p>
    </div>
  );
};

const SemPlanControls = () => {
  return <div className="">sldfjlksdfj</div>;
};
