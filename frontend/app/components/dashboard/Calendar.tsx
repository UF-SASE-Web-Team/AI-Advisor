import React, { useEffect, useState } from "react";
import { fetchSchedule } from "../../apis/scheduleConfig"; // adjust path if needed

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

/** Row keys: standard periods plus exam / online rows */
const periodRows: Array<number | string> = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
  "E1",
  "E2",
  "E3",
  "ONLINE",
];

function periodLabel(period: number | string): string {
  return String(period);
}

const dayMap = {
  M: "Monday",
  T: "Tuesday",
  W: "Wednesday",
  R: "Thursday",
  F: "Friday",
};

function expandDays(course) {
  return course.day.split("").map((d) => ({
    ...course,
    day: dayMap[d],
  }));
}

function buildGrid(courses) {
  const grid = {};

  days.forEach(day => {
    grid[day] = {};
    periodRows.forEach(p => {
      grid[day][p] = null;
    });
  });

  courses.forEach(course => {
    expandDays(course).forEach(c => {
      grid[c.day][c.period] = c;
    });
  });

  return grid;
}

export default function Calendar() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetchSchedule("/mock", {
        method: "POST",
        body: JSON.stringify({
          x: 1,
          y: 2,
          z: 3,
          min_creds: 6,
          max_creds: 12,
          blacklisted_periods: [],
        }),
      });

      const data = await res.json();

      if (data.status === "success") {
        setCourses(data.scheduled_courses);
      } else {
        console.error(data.error_message);
      }

      setLoading(false);
    }

    load();
  }, []);

  const grid = buildGrid(courses);

  if (loading) {
    return (
      <div className="m-4 min-h-0">
        <div className="rounded-md border border-widget-border bg-[#F9FFD5] p-6 text-[#807676]">
          Loading schedule...
        </div>
      </div>
    );
  }

  return (
    <div className="m-4 min-h-0">
      <div className="rounded-md border border-widget-border bg-[#F9FFD5] p-6">
        <div className="grid grid-cols-[52px_repeat(5,1fr)] gap-0 border border-neutral-400">
          <div className="border-r border-b border-neutral-400 bg-neutral-50" />

          {days.map((day, dayIdx) => (
            <div
              key={day}
              className={`border-b border-neutral-400 bg-neutral-50 px-0.5 py-1 text-center text-[11px] font-semibold leading-tight ${
                dayIdx === days.length - 1 ? "" : "border-r border-neutral-400"
              }`}
            >
              {day}
            </div>
          ))}

          {periodRows.map(period => (
            <React.Fragment key={String(period)}>
              <div className="flex items-center justify-center border-r border-b border-neutral-400 bg-neutral-50 px-0.5 py-0.5 text-center text-[10px] font-medium leading-tight">
                {periodLabel(period)}
              </div>

              {days.map((day, dayIdx) => {
                const course = grid[day][period];
                const isLastCol = dayIdx === days.length - 1;

                return (
                  <div
                    key={`${day}-${String(period)}`}
                    className={`flex h-8 min-h-8 items-center justify-center border-b border-neutral-400 bg-[#FEFFF8] text-xs ${
                      isLastCol ? "" : "border-r border-neutral-400"
                    }`}
                  >
                    {course && (
                      <span className="inline-block max-w-[calc(100%-6px)] min-w-[6.25rem] truncate rounded-md border border-[#C2DBFC] bg-[#E2EFFF] px-2.5 py-0.5 text-center text-xs font-medium leading-tight text-[#4A4848]">
                        {course.course_id}
                      </span>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}