export function AboutLanding() {
  return (
    <div className="w-full bg-[#F6F8FF] overflow-x-clip">
      {/* About the Project — title+line left (touching edge), subsection content centered, spacer right */}
      <section id="about-the-project" className="py-24 scroll-mt-4">
        <div className="w-full flex flex-col lg:flex-row lg:items-start gap-10 lg:gap-14 xl:gap-16">
          <div className="py-4 w-full lg:w-60 xl:w-64 shrink-0 px-6 lg:px-0">
            <h2 className="text-black text-3xl font-semibold font-mono lg:text-right">
              About the
              <br />
              Project
            </h2>
            <div className="w-full lg:w-60 xl:w-64 h-2.5 bg-dark-pink mt-4" />
          </div>
          <div className="flex-1 flex justify-center lg:justify-start px-6 sm:px-8 lg:pr-16 xl:pr-24 min-w-0">
            <div className="w-full max-w-2xl lg:max-w-none space-y-4 mx-auto lg:mx-0">
              <details className="group rounded-xl border border-[#D7DDF5] bg-white/70 px-5 py-4">
                <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-black text-lg lg:text-xl font-semibold font-mono">About</h3>
                      <p className="mt-1 text-black/75 text-sm lg:text-base font-normal font-tenor truncate group-open:hidden">
                        AI Advisor helps students turn transcripts into clear, personalized semester plans.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 pt-1">
                      <span className="text-xs sm:text-sm font-mono text-black/70 group-open:hidden">See more</span>
                      <span className="hidden group-open:inline text-xs sm:text-sm font-mono text-black/70">See less</span>
                      <span className="text-xl transition-transform duration-200 group-open:rotate-180">⌄</span>
                    </div>
                  </div>
                </summary>
                <p className="pt-3 text-black text-sm lg:text-base font-normal font-tenor leading-6 lg:leading-7">
                  AI Advisor is designed to help students plan their future semesters by turning transcripts into clear, personalized pathways.
                  <br />
                  <br />
                  Not sure what classes to take or how heavy coursework will be? The AI Advisor helps you understand your progress, suggests courses, and guides you towards a balanced schedule.
                  <br />
                  <br />
                  By analyzing your transcript, the AI Advisor identifies your strengths and weaknesses, and recommends courses that align with your goals and interests. It also helps you plan a balanced schedule by suggesting a mix of challenging and manageable courses each semester.
                </p>
              </details>

              <details className="group rounded-xl border border-[#D7DDF5] bg-white/70 px-5 py-4">
                <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-black text-lg lg:text-xl font-semibold font-mono">What it does</h3>
                      <p className="mt-1 text-black/75 text-sm lg:text-base font-normal font-tenor truncate group-open:hidden">
                        Shows degree progress and suggests upcoming classes with a balanced workload.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 pt-1">
                      <span className="text-xs sm:text-sm font-mono text-black/70 group-open:hidden">See more</span>
                      <span className="hidden group-open:inline text-xs sm:text-sm font-mono text-black/70">See less</span>
                      <span className="text-xl transition-transform duration-200 group-open:rotate-180">⌄</span>
                    </div>
                  </div>
                </summary>
                <ul className="pt-3 list-disc list-inside space-y-1 text-black text-sm lg:text-base font-normal font-tenor leading-6 lg:leading-7">
                  <li>Shows degree progress</li>
                  <li>Suggest classes for upcoming semesters</li>
                  <li>Helps build a balanced workload</li>
                  <li>Give insight on class difficulty and time commitment</li>
                </ul>
              </details>

              <details className="group rounded-xl border border-[#D7DDF5] bg-white/70 px-5 py-4">
                <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-black text-lg lg:text-xl font-semibold font-mono">How it works</h3>
                      <p className="mt-1 text-black/75 text-sm lg:text-base font-normal font-tenor truncate group-open:hidden">
                        Upload your transcript, ask questions, and receive personalized recommendations.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 pt-1">
                      <span className="text-xs sm:text-sm font-mono text-black/70 group-open:hidden">See more</span>
                      <span className="hidden group-open:inline text-xs sm:text-sm font-mono text-black/70">See less</span>
                      <span className="text-xl transition-transform duration-200 group-open:rotate-180">⌄</span>
                    </div>
                  </div>
                </summary>
                <ol className="pt-3 list-disc list-inside space-y-1 text-black text-sm lg:text-base font-normal font-tenor leading-6 lg:leading-7">
                  <li>Upload your transcript</li>
                  <li>Ask questions</li>
                  <li>Get personalized recommendations</li>
                </ol>
              </details>

              <details className="group rounded-xl border border-[#D7DDF5] bg-white/70 px-5 py-4">
                <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-black text-lg lg:text-xl font-semibold font-mono">Built to Support your Decisions</h3>
                      <p className="mt-1 text-black/75 text-sm lg:text-base font-normal font-tenor truncate group-open:hidden">
                        The advisor guides decisions and complements guidance from official degree requirements.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 pt-1">
                      <span className="text-xs sm:text-sm font-mono text-black/70 group-open:hidden">See more</span>
                      <span className="hidden group-open:inline text-xs sm:text-sm font-mono text-black/70">See less</span>
                      <span className="text-xl transition-transform duration-200 group-open:rotate-180">⌄</span>
                    </div>
                  </div>
                </summary>
                <p className="pt-3 text-black text-sm lg:text-base font-normal font-tenor leading-6 lg:leading-7">
                  The AI Advisor was built to guide your decisions, not fully make them for you. The advisor provides helpful academic advice, but should not overrule degree requirements and advice academic advisors provide.
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Team — subsection content with title+line on the right */}
      <section className="py-0">
        <div className="w-full flex flex-col lg:flex-row lg:items-start gap-10 lg:gap-14 xl:gap-16">
          <div className="flex-1 flex justify-center lg:justify-start px-6 sm:px-8 lg:pl-16 xl:pl-24 min-w-0 order-first lg:order-0">
            <div className="w-full max-w-2xl lg:max-w-none mx-auto lg:mx-0">
              <div className="rounded-xl border border-[#D7DDF5] bg-white/70 px-5 py-4">
                <h3 className="text-black text-lg lg:text-xl font-semibold font-mono">About the Team</h3>
                <p className="pt-3 text-black text-sm lg:text-base font-normal font-tenor leading-6 lg:leading-7">
                  This app was developed by the UF SASE Web Dev Semester Project Team! The Projects was run by our webmasters Thuy Le and Lynette Hemingway! Our backend leads are Jonathan Tang and Nathan Kim. Our frontend leads are Helen Zou and Kenzo Fukuda. Lastly, our UI/UX lead is Grace Zhao. All of our leads guided the team members to complete the tasks that helped create the AI Advisor!
                </p>
              </div>
            </div>
          </div>
          <div className="py-4 w-full lg:w-80 xl:w-64 shrink-0 px-6 lg:px-0 ml-auto lg:ml-0">
            <h2 className="text-black text-3xl font-semibold font-mono text-left">
              Meet the
              <br />
              Team
            </h2>
            <div className="w-full lg:w-80 xl:w-64 h-2.5 bg-dark-pink mt-4" />
          </div>
        </div>
      </section>
    </div>
  );
}
