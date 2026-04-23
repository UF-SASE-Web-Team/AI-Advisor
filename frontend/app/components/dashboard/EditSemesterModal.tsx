import { Fragment, useMemo, useState } from "react";
import { supabase } from "../../../supabase";

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

interface EditSemesterModalProps {
  semester: string;
  onClose: () => void;
  blacklist: Record<DayKey, number[]>;
  setBlacklist: (blacklist: Record<DayKey, number[]>) => void;
  userId: string | null;
}

export function EditSemesterModal({ semester, onClose, blacklist, setBlacklist, userId }: EditSemesterModalProps) {
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");


  const blacklistSlots = useMemo(
    () =>
      Object.entries(blacklist).flatMap(([day, periods]) =>
        periods.map((period) => ({ day: day as DayKey, period } as BlacklistSlot))
      ),
    [blacklist]
  );

  const togglePeriod = (day: DayKey, period: number) => {
    const next = { ...blacklist };
    const exists = next[day].includes(period);
    next[day] = exists
      ? next[day].filter((p) => p !== period)
      : [...next[day], period].sort((a, b) => a - b);

    setBlacklist(next);
  };

  const handleSave = async () => {
    if (!userId) return;

    setSaveState("saving");

    const { error } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: userId,
          blacklist_slots: Object.entries(blacklist).flatMap(([d, periods]) =>
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
    setTimeout(() => {
      setSaveState("idle");
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Edit {semester}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6">
          {/* Blacklist Times Section */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Blacklist Times</h3>
            <p className="text-sm text-gray-600 mb-3">Select time periods to avoid when generating your schedule</p>
            
            <div className="grid grid-cols-[40px_repeat(5,minmax(0,1fr))] gap-1 text-xs bg-gray-50 p-3 rounded-lg">
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
                        onClick={() => togglePeriod(day, period)}
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

            <div className="mt-2 text-xs text-gray-600">
              {!userId ? "Log in to edit blacklist times." : "Click a slot to block or unblock it."}
            </div>
            <div className="mt-1 text-xs font-semibold text-gray-700">
              {saveState === "saving" && "Saving..."}
              {saveState === "saved" && "✓ Saved"}
              {saveState === "error" && "Could not save changes"}
              {saveState === "idle" && `${blacklistSlots.length} blocked slot${blacklistSlots.length === 1 ? "" : "s"}`}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saveState === "saving"}
            className="px-4 py-2 bg-[#a2bd4b] text-white font-medium rounded-lg hover:bg-[#8fa43c] transition-colors disabled:opacity-50"
          >
            {saveState === "saving" ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
