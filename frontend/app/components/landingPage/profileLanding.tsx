const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

const TEAM_MEMBERS = Array.from({ length: 8 }, () => ({
  name: "First Lastname",
  role: "YourRole",
}));

export function ProfileLanding() {
  return (
    <div className="w-full bg-[#F6F8FF] overflow-x-clip">
        <section className="relative max-w-7xl mx-auto px-8 md:px-16 py-24">
        {/* Team member cards grid */}
        <div className="mt-20 flex gap-6 overflow-x-auto pb-4 md:overflow-visible md:grid md:grid-cols-4 lg:grid-cols-8">
          {TEAM_MEMBERS.map((member, i) => (
            <div key={i} className="flex-shrink-0 w-32">
              <div className="w-32 h-24 bg-zinc-300 rounded" />
              <p className="mt-3 text-black text-[10px] font-normal font-tenor leading-4">
                {member.name},
                <br />
                {member.role}
              </p>
            </div>
          ))}
        </div>

        {/* Featured team member */}
        <div className="mt-16 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-56 h-56 flex-shrink-0 bg-zinc-300 rounded" />
          <div>
            <h3 className="text-black text-2xl font-semibold font-mono">
              First Lastname
            </h3>
            <p className="text-black text-base font-semibold font-mono mb-4">
              YourRole
            </p>
            <p className="text-black text-[10px] font-normal font-tenor leading-4 max-w-md">
              {LOREM}
            </p>
          </div>
        </div>

        {/* Big team photo placeholder */}
        <div className="mt-20 w-full h-96 bg-zinc-300 rounded flex items-center justify-center">
          <div className="text-center">
            <p className="text-black text-xs font-semibold font-mono">
              big team photo
            </p>
            <p className="text-black text-xs font-semibold font-mono mt-1">
              can also be a collage of different photos
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
