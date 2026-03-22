const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

export function AboutLanding() {
  return (
    <div className="w-full bg-[#F6F8FF] overflow-x-hidden">
      {/* About the Project — line on left, text right-aligned relative to line */}
      <section className="py-24">
        <div className="px-6 md:px-8">
          <div className="w-96">
            <h2 className="text-black text-3xl font-semibold font-mono text-right">
              About the
              <br />
              Project
            </h2>
            <div className="w-96 h-2.5 bg-dark-pink mt-4" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-8 mt-12 grid md:grid-cols-[minmax(0,11rem)_1fr] gap-12 md:gap-16">
          <div />
          <div className="space-y-6">
            <div>
              <h3 className="text-black text-base font-semibold font-mono mb-4">
                Subsection #1
              </h3>
              <p className="text-black text-[10px] font-normal font-tenor leading-4">
                {LOREM}
                <br />
                <br />
                {LOREM}
              </p>
            </div>
            <p className="text-black text-[10px] font-normal font-tenor leading-4">
              {LOREM}
            </p>
          </div>
        </div>
      </section>

      {/* Meet the Team — line on right, text left-aligned relative to line */}
      
      <section className="py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-8 mt-12 grid md:grid-cols-[1fr_minmax(0,11rem)] gap-12 md:gap-16">
          <div className="order-2 md:order-1">
            <p className="text-black text-[10px] font-normal font-tenor leading-4">
              {LOREM}
              <br />
              <br />
              {LOREM}
            </p>
          </div>
          <div className="order-1 md:order-2" />
        </div>
        <div className="px-6 md:px-8 flex justify-end">
          <div className="w-96">
            <h2 className="text-black text-3xl font-semibold font-mono text-left">
              Meet the
              <br />
              Team
            </h2>
            <div className="w-96 h-2.5 bg-dark-pink mt-4" />
          </div>
        </div>
      </section>
    </div>
  );
}
