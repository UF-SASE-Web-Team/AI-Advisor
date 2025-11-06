import PlanNavigation from "./PlanNavigation";

export default function PlanPage() {
    return (
        <div className="min-h-screen w-full bg-[#E1EABB] flex flex-col items-start px-8 py-6">
            <PlanNavigation />
            <h1 className="text-gray-800 text-3xl font-semibold mt-4">Plan page</h1>
            <div className="w-96 h-24 text-center justify-start text-slate-500 text-4xl font-bold font-['Figma_Hand']">Your Saved Schedules</div>
        </div>
    );
}