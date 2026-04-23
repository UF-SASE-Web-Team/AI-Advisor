import { Fragment, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../supabase";
import { Widget } from "./Widget";

type DayKey = "M" | "T" | "W" | "R" | "F";

interface BlacklistSlot {
  day: DayKey;
  period: number;
}

const DAYS: DayKey[] = ["M", "T", "W", "R", "F"];
const PERIODS = Array.from({ length: 11 }, (_, i) => i + 1);

const EMPTY_BLACKLIST: Record<DayKey, number[]> = {
  M: [],
  T: [],
  W: [],
  R: [],
  F: [],
};

interface CalendarProps {
  blacklist: Record<DayKey, number[]>;
  setBlacklist: (blacklist: Record<DayKey, number[]>) => void;
  userId: string | null;
}

export function Calendar({ blacklist, setBlacklist, userId }: CalendarProps) {
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");


  const blacklistSlots = useMemo(
    () =>
      Object.entries(blacklist).flatMap(([day, periods]) =>
        periods.map((period) => ({ day: day as DayKey, period } as BlacklistSlot))
      ),
    [blacklist]
  );

  const togglePeriod = async (day: DayKey, period: number) => {
    if (!userId) return;

    const next = { ...blacklist };
    const exists = next[day].includes(period);
    next[day] = exists
      ? next[day].filter((p) => p !== period)
      : [...next[day], period].sort((a, b) => a - b);

    setBlacklist(next);
    setSaveState("saving");

    const { error } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: userId,
          blacklist_slots: Object.entries(next).flatMap(([d, periods]) =>
            periods.map((p) => ({ day: d, period: p }))
          ),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      setSaveState("error");
      return;
    }

    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 1200);
  };

  return (
    <Widget title="Blacklist Times">
      <div className="flex flex-col gap-3 p-3 min-h-0 h-full">
        <div className="grid grid-cols-[40px_repeat(5,minmax(0,1fr))] gap-1 text-xs">
          <div></div>
          {DAYS.map((day) => (
            <div key={day} className="text-center font-bold text-gray-700">
              {day}
            </div>
          ))}

          {PERIODS.map((period) => (
            <Fragment key={period}>
              <div key={`label-${period}`} className="flex items-center justify-center font-bold text-[#6A8A83]">
                P{period}
              </div>
              {DAYS.map((day) => {
                const blocked = blacklist[day].includes(period);
                return (
                  <button
                    key={`${day}-${period}`}
                    type="button"
                    onClick={() => void togglePeriod(day, period)}
                    disabled={!userId}
                    className={`h-6 rounded border transition-colors ${
                      blocked
                        ? "bg-[#6A8A83] border-[#4d6d66]"
                        : "bg-white border-[#b8cf69] hover:bg-[#f6fcd9]"
                    } ${!userId ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    title={`${day} period ${period}`}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>

        <div className="text-xs text-gray-600">
          {!userId ? "Log in to edit blacklist times." : "Click a slot to block or unblock it."}
        </div>
        <div className="text-xs font-semibold text-gray-700">
          {saveState === "saving" && "Saving..."}
          {saveState === "saved" && "Saved"}
          {saveState === "error" && "Could not save changes"}
          {saveState === "idle" && `${blacklistSlots.length} blocked slot${blacklistSlots.length === 1 ? "" : "s"}`}
        </div>
      </div>
    </Widget>
  );
}
