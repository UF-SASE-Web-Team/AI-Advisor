import { useEffect, useRef, useState } from "react";
import teamMembers from "../../data/teamMembers.json";

type TeamMember = { name: string; role: string; description: string, imageUrl: string };
const TEAM_MEMBERS = teamMembers as TeamMember[];

const GAP = 24;
/** Carousel visible width: max-w-7xl (1280) - arrows (96) = 1184px. 8 cards: (1184 - 7*24)/8 = 127 */
const CAROUSEL_WIDTH = 1184;
const CARD_WIDTH = (CAROUSEL_WIDTH - 7 * GAP) / 8;
const CARD_UNIT = CARD_WIDTH + GAP;
const ARROW_BUTTON_SIZE = 40;
const CARD_PADDING = 8;
const ARROW_TOP_OFFSET = CARD_PADDING + (CARD_WIDTH - ARROW_BUTTON_SIZE) / 2;
const ROTATION_INTERVAL_MS = 4000;
const MANUAL_SELECTION_PAUSE_MS = 7000;

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
  const lastManualSelectionRef = useRef(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = TEAM_MEMBERS[selectedIndex];

  useEffect(() => {
    const rotation = window.setInterval(() => {
      if (Date.now() - lastManualSelectionRef.current < MANUAL_SELECTION_PAUSE_MS) {
        return;
      }

      setSelectedIndex((currentIndex) => (currentIndex + 1) % TEAM_MEMBERS.length);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(rotation);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    const next = Math.min(selectedIndex * CARD_UNIT, maxScroll);
    el.scrollTo({ left: next, behavior: "smooth" });
  }, [selectedIndex]);

  function onCarouselWheel(e: React.WheelEvent<HTMLDivElement>) {
    const el = scrollRef.current;
    if (!el) return;

    // Map vertical wheel movement to horizontal carousel scrolling.
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }

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

  function selectMember(index: number) {
    lastManualSelectionRef.current = Date.now();
    setSelectedIndex(index);
  }

  return (
    <div className="w-full bg-[#F6F8FF] overflow-x-clip">
      <section className="relative max-w-7xl mx-auto px-8 md:px-16 py-24">
        <div className="mt-8 lg:mt-12 flex items-start gap-4 -mx-10 md:-mx-16">
          <button
            type="button"
            onClick={scrollLeft}
            aria-label="Scroll left"
            className="shrink-0 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:opacity-90 transition"
            style={{ marginTop: ARROW_TOP_OFFSET }}
          >
            <ArrowIcon left />
          </button>
          <div
            ref={scrollRef}
            onWheel={onCarouselWheel}
            className="flex items-start flex-1 min-w-0 overflow-x-auto overflow-y-hidden scroll-smooth scrollbar-hide p-1 pb-4"
            style={{ gap: GAP, maxWidth: CAROUSEL_WIDTH }}
          >
            {TEAM_MEMBERS.map((member, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectMember(i)}
                className={`self-start shrink-0 text-left transition rounded p-2 overflow-hidden ${
                  selectedIndex === i
                    ? "ring-2 ring-black ring-offset-1"
                    : ""
                }`}
                style={{ width: CARD_WIDTH }}
              >
                <div
                  className="w-full rounded-2xl aspect-square overflow-hidden bg-zinc-300"
                >
                  <img
                    src={member.imageUrl}
                    alt={member.name}
                    className="block w-full h-full object-cover"
                  />
                </div>                
                <p className="mt-3 text-black text-[14px] font-normal font-tenor leading-4">
                  {member.name}
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
            className="shrink-0 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:opacity-90 transition"
            style={{ marginTop: ARROW_TOP_OFFSET }}
          >
            <ArrowIcon left={false} />
          </button>
        </div>

        <div className="mt-16 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-56 h-56 shrink-0 rounded-2xl overflow-hidden bg-zinc-300">
            <img
              src={selected.imageUrl}
              alt={selected.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="text-black text-2xl font-semibold font-mono">
              {selected.name}
            </h3>
            <p className="text-black text-base font-semibold font-mono mb-4">
              {selected.role}
            </p>
            <p className="text-black text-[18px] font-normal font-tenor leading-4 max-w-md">
              {selected.description}
            </p>
          </div>
        </div>
        <div className="mt-20 w-full h-96 flex items-center justify-center">
          <img src="/group_pic.JPG" className="rounded-2xl"></img>
        </div>
      </section>
    </div>
  );
}
