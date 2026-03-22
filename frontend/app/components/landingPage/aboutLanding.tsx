const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

export function AboutLanding() {
  return (
    <div className="w-full bg-[#F6F8FF] overflow-x-clip">
      {/* About the Project — title+line left (touching edge), subsection content centered, spacer right */}
      <section className="py-24">
        <div className="w-full flex flex-col md:flex-row md:items-start gap-12 md:gap-16">
          <div className="py-4 w-96 flex-shrink-0 pl-4 md:pl-0">
            <h2 className="text-black text-3xl font-semibold font-mono text-right">
              About the
              <br />
              Project
            </h2>
            <div className="w-96 h-2.5 bg-dark-pink mt-4" />
          </div>
          <div className="flex-1 flex justify-center px-6 md:px-8 min-w-0">
            <div className="max-w-xl w-full space-y-2 mx-auto">
              <div>
                <h3 className="text-black text-base font-semibold font-mono mb-2">
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
          <div className="hidden md:block w-96 flex-shrink-0" aria-hidden />
        </div>
      </section>

      {/* Meet the Team — spacer left, subsection content centered, title+line right (touching edge) */}
      <section className="py-0">
        <div className="w-full flex flex-col md:flex-row md:items-start gap-12 md:gap-16">
          <div className="hidden md:block w-96 flex-shrink-0" aria-hidden />
          <div className="flex-1 flex justify-center px-6 md:px-8 min-w-0 order-first md:order-none">
            <div className="max-w-xl w-full mx-auto">
              <p className="text-black text-[10px] font-normal font-tenor leading-4">
                {LOREM}
                <br />
                <br />
                {LOREM}
              </p>
            </div>
          </div>
          <div className="py-4 w-96 flex-shrink-0 pr-4 md:pr-0 ml-auto md:ml-0">
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
