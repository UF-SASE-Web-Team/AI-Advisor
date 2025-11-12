import PlanNavigation from "./PlanNavigation";

export default function PlanPage() {
  return (
    <div className="min-h-screen w-full bg-[#E1EABB] flex flex-col items-start px-8 py-6">
      <PlanNavigation />
      <h1 className="text-gray-800 text-3xl font-semibold mt-4">Plan page</h1>
      <div className="w-96 h-24 text-center justify-start text-[rgba(106,138,131,1)] text-4xl font-bold font-figmaHand">
        Your Saved Schedules
      </div>

      <div className="flex flex-col gap-6 ml-4">
        <div className="flex items-center gap-4 bg-[#6A8A83] rounded-3xl px-6 py-6 w-[360px] shadow-sm">
          <div className="w-12 h-12 grid place-items-center rounded-full border-2 border-[#2E3A3A] text-[#2E3A3A] font-figmaHand text-2xl">
            1
          </div>
          <div className="text-white">
            <div className="uppercase font-mono tracking-widest text-xl">
              PLAN
            </div>
            <div className="text-sm opacity-90">Short Description</div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-[#6A8A83] rounded-3xl px-6 py-6 w-[360px] shadow-sm">
          <div className="w-12 h-12 grid place-items-center rounded-full border-2 border-[#2E3A3A] text-[#2E3A3A] font-figmaHand text-2xl">
            2
          </div>
          <div className="text-white">
            <div className="uppercase font-mono tracking-widest text-xl">
              PLAN
            </div>
            <div className="text-sm opacity-90">Short Description</div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-[#6A8A83] rounded-3xl px-6 py-6 w-[360px] shadow-sm">
          <div className="w-12 h-12 grid place-items-center rounded-full border-2 border-[#2E3A3A] text-[#2E3A3A] font-figmaHand text-2xl">
            3
          </div>
          <div className="text-white">
            <div className="uppercase font-mono tracking-widest text-xl">
              PLAN
            </div>
            <div className="text-sm opacity-90">Short Description</div>
          </div>
        </div>
      </div>
    </div>
  );
}