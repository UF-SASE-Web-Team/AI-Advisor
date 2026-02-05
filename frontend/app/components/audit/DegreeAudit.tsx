import DegreeAuditPart from "./DegreeAuditPart";

export function DegreeAudit() {
    return (
        <div
            className="w-96 mx-auto min-h-screen pt-6"
            style={{ backgroundColor: "#E1EABB" }}
        >
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-8">
                <h1 className="text-slate-500 text-4xl text-[rgba(106,138,131,1)] font-bold font-figmaHand mb-3">
                    Degree Audit
                </h1>

                <p className="text-slate-500 text-base font-normal font-['IBM_Plex_Mono'] max-w-[280px]">
                    Track your progress towards graduation
                </p>
            </div>

            {/* Cards */}
            <div className="space-y-6">
                <DegreeAuditPart />
            </div>
        </div>
    );
}
