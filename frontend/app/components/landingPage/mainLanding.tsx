export function mainLanding() {
  return (
    <div className="w-full min-h-screen bg-[#F6F8FF] overflow-x-hidden">
      {/* NAVBAR */}
      <nav className="top-0 left-0 z-50 w-full h-20 bg-[#C4CC9E] shadow-md flex items-center px-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#E77C3C]" />
          <h1 className="justify-start text-[#C94A6A] text-3xl font-bold font-silkscreen">
            AI Advisor
          </h1>
        </div>

        <span className="ml-16 text-[#F07CA3] font-semibold font-mono">
          Made By UF SASE
        </span>

        <button className="ml-auto px-4 py-2 rounded-xl bg-[#2E6B4E] text-[#C4CC9E] font-semibold font-mono">
          Log In
        </button>
      </nav>

      {/* HERO */}
      <section className="pt-32 h-[85vh] bg-stone-50 flex items-center justify-center">
        <div className="max-w-7xl w-full px-8 grid grid-cols-2 gap-16">
          {/* LEFT TEXT */}
          <div className="flex flex-col gap-6">
            <h2 className="text-4xl font-bold font-silkscreen">
              Create Your Dream Schedule
            </h2>

            <p className="text-[#9CA3AF] font-semibold font-mono max-w-xl">
              Integrated with AI to provide smart suggestions that see all
              possibilities so you can make optimal decisions.
            </p>

            <button className="mt-6 w-fit px-10 py-4 rounded-2xl bg-[#2EA9FF] text-[#F6F8FF] text-3xl font-bold font-silkscreen">
              Get Started
            </button>
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
        <div className="w-full h-32 bg-[#4F8F64] shadow-md" />

        {/* SCROLL INDICATOR at the bottom of the strip */}
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-24 h-24 rounded-full bg-[#F6A5C0] flex items-center justify-center shadow-lg">
          <div className="w-6 h-6 border border-black" />
        </div>

        {/* Scroll indicator text below the circle */}
        <span className="absolute -bottom-15 left-1/2 transform -translate-x-1/2 text-[#C94A6A] font-semibold font-mono">
          learn about the project
        </span>
      </div>
    </div>
  );
}
