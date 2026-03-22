import { Link } from "react-router";

export function mainLanding() {
  return (
    <div className="w-full min-h-screen bg-[#F6F8FF] overflow-x-clip">
      {/* NAVBAR */}
      <nav className="top-0 left-0 z-50 w-full h-[12vh] min-h-[64px] bg-[#F9FFD5] shadow-md flex items-center overflow-visible px-6">
        <div className="flex items-center gap-4 relative h-full mt-3">
          <div
            className="absolute bottom-0 left-0 w-28 h-28 rounded-full bg-[#FFAF01] translate-y-1/3 flex-shrink-0"
            aria-hidden
          />
          <h1 className="relative mt-6 z-10 pl-32 justify-start text-[#FF4D65] text-3xl font-bold font-silkscreen">
            AI Advisor
          </h1>
        </div>

        <span className="ml-16 mt-10 text-[#F07CA3] font-semibold font-mono">
          Made By UF SASE
        </span>

        <Link
          to="/login"
          className="ml-auto px-4 py-2 rounded-xl bg-[#C7D964] text-[#F9FFD5] font-semibold font-mono transition-transform duration-200 hover:scale-105"
        >
          Log In
        </Link>
      </nav>

      {/* HERO */}
      <section className="pt-5vh h-[65vh] min-h-[400px] py-12 bg-stone-50 flex items-center justify-center">
        <div className="max-w-7xl w-full px-8 grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* LEFT TEXT */}
          <div className="flex flex-col gap-6">
            <h2 className="text-4xl font-bold font-silkscreen">
              Create Your Dream Schedule
            </h2>

            <p className="text-[#9CA3AF] font-semibold font-mono max-w-xl">
              Integrated with AI to provide smart suggestions that see all
              possibilities so you can make optimal decisions.
            </p>

            <Link
              to="/dashboard"
              className="mt-6 inline-flex w-fit items-center justify-center gap-3 px-14 py-4 rounded-2xl bg-[#2EA9FF] text-[#F6F8FF] text-3xl font-bold font-silkscreen leading-none transition-transform duration-200 hover:scale-105"
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 block translate-y-0.5"
                aria-hidden
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span className="leading-none">Get Started</span>
            </Link>
          </div>

          {/* RIGHT IMAGE PLACEHOLDER */}
          <div className="w-full h-72 bg-zinc-300 flex items-center justify-center text-black font-mono font-semibold">
            photo of happy people using the site
          </div>
        </div>
      </section>

      {/* GREEN STRIP + SCROLL INDICATOR WRAPPER */}
      <div className="relative">
        {/* GREEN STRIP */}
        <div className="w-full h-32 bg-[#E7F59C] shadow-md" />

        {/* SCROLL INDICATOR + curved text wrapper */}
        <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex flex-col items-center">
          {/* Curved text wrapping around top of circle */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 200 130"
            className="absolute top-0 w-72 h-36 -translate-y-15"
            aria-hidden
          >
            <defs>
              <path id="arcPath" d="M 25,118 A 60,60 0 0,1 175,118" />
            </defs>
            <text fill="#FF4D65" fontSize="14" fontWeight="600" fontFamily="IBM Plex Mono, monospace">
              <textPath xlinkHref="#arcPath" startOffset="50%" textAnchor="middle">
                ...or learn about the project
              </textPath>
            </text>
          </svg>
          {/* Pink circle */}
          <div className="relative w-29 h-29 rounded-full bg-[#F6A5C0] flex items-center justify-center shadow-lg">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="black"
              strokeWidth="0.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v12.5M6 12l6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
