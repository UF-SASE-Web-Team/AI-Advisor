export default function DegreeAuditDashboard() {
  const audits = [
    { title: "General Education and Quest", completed: 1, total: 13 },
    { title: "Critical Tracking", completed: 8, total: 20 },
    { title: "CS College Requirements", completed: 5, total: 10 },
    { title: "CS Core & Electives", completed: 3, total: 5 },
    { title: "GenEd International Requirement", completed: 0, total: 2 },
    { title: "University Writing & General Requirement", completed: 1, total: 1 },
  ];

  return (
    <div className="space-y-4">
      {audits.map((audit, index) => {
        const radius = 25;
        const center = 28;
        const percentage = audit.completed / audit.total;
        const angle = 360 * percentage;

        // Convert angle to radians for SVG
        const radians = ((angle - 90) * Math.PI) / 180;
        const x = center + radius * Math.cos(radians);
        const y = center + radius * Math.sin(radians);

        // Determine if the arc should be large (greater than 180 degrees)
        const largeArc = angle > 180 ? 1 : 0;

        // Path for progress circle
        const pathData =
          percentage === 1
            ? `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center - 0.01} ${center - radius}` // full circle
            : `M ${center} ${center - radius} A ${radius} ${radius} 0 ${largeArc} 1 ${x} ${y}`;

        return (
          <div
            key={index}
            className="w-88 h-28 bg-white rounded-[20px] mx-auto px-6 py-3 flex items-center justify-between ml-4 mr-4"
          >
            {/* Left text */}
            <h1 className="text-slate-500 text-xl font-medium font-['IBM_Plex_Mono'] leading-tight max-w-[220px]">
              {audit.title}:
            </h1>

            {/* Progress ring */}
            <div className="relative w-14 h-14">
              <svg width="56" height="56">
                {/* Background circle */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="4"
                />
                {/* Progress path */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-600 font-['IBM_Plex_Mono']">
                {audit.completed}/{audit.total}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
