const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

export function AboutLanding() {
  return (
    <div className="w-full bg-[#F6F8FF] overflow-x-clip">
      {/* About the Project — title+line left (touching edge), subsection content centered, spacer right */}
      <section id="about-the-project" className="py-24 scroll-mt-4">
        <div className="w-full flex flex-col lg:flex-row lg:items-start gap-10 lg:gap-14 xl:gap-16">
          <div className="py-4 w-full lg:w-80 xl:w-96 flex-shrink-0 px-6 lg:px-0">
            <h2 className="text-black text-3xl font-semibold font-mono lg:text-right">
              About the
              <br />
              Project
            </h2>
            <div className="w-full lg:w-80 xl:w-96 h-2.5 bg-dark-pink mt-4" />
          </div>
          <div className="flex-1 flex justify-center px-6 sm:px-8 min-w-0">
            <div className="max-w-2xl w-full space-y-3 mx-auto">
              <div>
                <h3 className="text-black text-lg lg:text-xl font-semibold font-mono mb-2">
                  Subsection #1
                </h3>
                <p className="text-black text-sm lg:text-base font-normal font-tenor leading-6 lg:leading-7">
                  {LOREM}
                  <br />
                  <br />
                  {LOREM}
                </p>
              </div>
              <p className="text-black text-sm lg:text-base font-normal font-tenor leading-6 lg:leading-7">
                {LOREM}
              </p>
            </div>
          </div>
          <div className="hidden lg:block w-80 xl:w-96 flex-shrink-0" aria-hidden />
        </div>
      </section>

      {/* Meet the Team — spacer left, subsection content centered, title+line right (touching edge) */}
      <section className="py-0">
        <div className="w-full flex flex-col lg:flex-row lg:items-start gap-10 lg:gap-14 xl:gap-16">
          <div className="hidden lg:block w-80 xl:w-96 flex-shrink-0" aria-hidden />
          <div className="flex-1 flex justify-center px-6 sm:px-8 min-w-0 order-first lg:order-none">
            <div className="max-w-2xl w-full mx-auto">
              <p className="text-black text-sm lg:text-base font-normal font-tenor leading-6 lg:leading-7">
                {LOREM}
                <br />
                <br />
                {LOREM}
              </p>
            </div>
          </div>
          <div className="py-4 xl:pt-120 w-full lg:w-80 xl:w-96 flex-shrink-0 px-6 lg:px-0 ml-auto lg:ml-0">
            <h2 className="text-black text-3xl font-semibold font-mono text-left">
              Meet the
              <br />
              Team
            </h2>
            <div className="w-full lg:w-80 xl:w-96 h-2.5 bg-dark-pink mt-4" />
          </div>
        </div>
      </section>
    </div>
  );
}
