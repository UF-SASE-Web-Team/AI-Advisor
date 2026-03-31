import { useRef, useState, useEffect } from "react";
import teamMembers from "./teamMembers.json";

type TeamMember = { name: string; role: string; description: string };
const TEAM_MEMBERS = teamMembers as TeamMember[];

const GAP = 24;
/** Carousel visible width: max-w-7xl (1280) - arrows (96) = 1184px. 8 cards: (1184 - 7*24)/8 = 127 */
const CAROUSEL_WIDTH = 1184;
const CARD_WIDTH = (CAROUSEL_WIDTH - 7 * GAP) / 8;
const CARD_UNIT = CARD_WIDTH + GAP;

const ArrowIcon = ({ left }: { left: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={left ? "" : "rotate-180"}
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export function ProfileLanding() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selected = TEAM_MEMBERS[selectedIndex ?? 0];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const stopWheel = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", stopWheel, { passive: false });
    return () => el.removeEventListener("wheel", stopWheel);
  }, []);

  function scrollLeft() {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const next = el.scrollLeft - CARD_UNIT;
    const isWrap = next < 0;
    el.scrollTo({
      left: isWrap ? maxScroll : next,
      behavior: isWrap ? "auto" : "smooth",
    });
  }

  function scrollRight() {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const next = el.scrollLeft + CARD_UNIT;
    const isWrap = next > maxScroll;
    // Member 1 appears after member 10 — instant wrap so it feels continuous
    el.scrollTo({
      left: isWrap ? 0 : next,
      behavior: isWrap ? "auto" : "smooth",
    });
  }

  return (
    <div className="w-full bg-[#F6F8FF] overflow-x-clip">
      <section className="relative max-w-7xl mx-auto px-8 md:px-16 py-24">
        <div className="mt-8 lg:mt-12 flex items-center gap-4 -mx-10 md:-mx-16">
          <button
            type="button"
            onClick={scrollLeft}
            aria-label="Scroll left"
            className="flex-shrink-0 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:opacity-90 transition"
          >
            <ArrowIcon left />
          </button>
          <div
            ref={scrollRef}
            className="flex flex-1 min-w-0 overflow-x-auto overflow-y-hidden scroll-smooth scrollbar-hide p-1 pb-4"
            style={{ gap: GAP, maxWidth: CAROUSEL_WIDTH }}
          >
            {TEAM_MEMBERS.map((member, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedIndex(i)}
                className={`flex-shrink-0 text-left transition rounded ${
                  selectedIndex !== null && selectedIndex === i
                    ? "ring-2 ring-black ring-offset-1"
                    : ""
                }`}
                style={{ width: CARD_WIDTH }}
              >
                <div
                  className="bg-zinc-300 rounded aspect-square"
                  style={{ width: CARD_WIDTH }}
                />
                <p className="mt-3 text-black text-[10px] font-normal font-tenor leading-4">
                  {member.name},
                  <br />
                  {member.role}
                </p>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={scrollRight}
            aria-label="Scroll right"
            className="flex-shrink-0 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:opacity-90 transition"
          >
            <ArrowIcon left={false} />
          </button>
        </div>

        <div className="mt-16 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-56 h-56 flex-shrink-0 bg-zinc-300 rounded" />
          <div>
            <h3 className="text-black text-2xl font-semibold font-mono">
              {selected.name}
            </h3>
            <p className="text-black text-base font-semibold font-mono mb-4">
              {selected.role}
            </p>
            <p className="text-black text-[10px] font-normal font-tenor leading-4 max-w-md">
              {selected.description}
            </p>
          </div>
        </div>

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
