import { useState } from "react";
import {PlanNavigation} from "./PlanNavigation";

type Plan = {
  id: number;
  description: string;
};

export function PlanPage() {
  const [plans, setPlans] = useState<Plan[]>([
    { id: 1, description: "" },
    { id: 2, description: "" },
    { id: 3, description: "" },
  ]);

  const handleDescriptionChange = (id: number, value: string) => {
    setPlans((prev) =>
      prev.map((plan) =>
        plan.id === id ? { ...plan, description: value } : plan
      )
    );
  };

  const handleAddPlan = () => {
    setPlans((prev) => [...prev, { id: prev.length + 1, description: "" }]);
  };

  const handleDeletePlan = (id: number) => {
    setPlans((prev) => prev.filter((plan) => plan.id !== id));
  };

  return (
    <div className="h-[900px]  bg-[#E1EABB] px-8 py-6">
      <div className="mt-6 flex justify-start">
        <div className="w-full max-w-md pl-8 pr-4 py-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-[32px] leading-tight text-[rgba(106,138,131,1)] font-figmaHand font-semibold">
              Your Saved
              <br />
              Schedules
            </h1>
            <p className="mt-3 text-xs text-[rgba(106,138,131,1)] tracking-wide">
              View and add your schedule plans
            </p>
          </div>

          {/* Plan cards */}
          <div className="flex flex-col gap-6">
            {plans.map((plan, index) => (
              <div
                key={plan.id}
                className="relative group flex items-center gap-6 bg-white rounded-3xl px-6 py-5 shadow-sm w-full transition hover:bg-[#6A8A83] hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleDeletePlan(plan.id)}
                  className="absolute top-3 right-4 text-lg text-[#6A8A83] opacity-70 hover:opacity-100 hover:text-red-500 transition cursor-pointer"
                  aria-label="Delete plan"
                >
                  ×
                </button>

                {/* Number circle */}
                <div className="w-14 h-14 grid place-items-center rounded-full bg-[#6A8A83] text-white font-figmaHand text-2xl transition group-hover:bg-white group-hover:text-[#6A8A83]">
                  {index + 1}
                </div>

                {/* Text + editable description */}
                <div className="flex flex-col text-[rgba(106,138,131,1)] transition group-hover:text-white">
                  <div className="text-xl font-mono tracking-wide">Plan</div>
                  <input
                    type="text"
                    placeholder="Short Description"
                    value={plan.description}
                    onChange={(e) =>
                      handleDescriptionChange(plan.id, e.target.value)
                    }
                    className="mt-1 text-xs bg-transparent outline-none placeholder:opacity-80 placeholder:text-[rgba(106,138,131,1)] group-hover:placeholder:text-white"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* + New button */}
          <button
            type="button"
            onClick={handleAddPlan}
            className="mt-8 w-full rounded-3xl bg-[#6A8A83] py-3 text-white text-xl font-figmaHand shadow-sm hover:bg-[#5c7972] transition cursor-pointer"
          >
            + New
          </button>
        </div>
      </div>
    </div>
  );
}