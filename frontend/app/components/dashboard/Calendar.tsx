import React, { useEffect, useState } from "react";
import { useSchedule, colorForCourse } from "./SelectPlan";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

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
  M: "Mon",
  T: "Tue",
  W: "Wed",
  R: "Thu",
  F: "Fri",
};

function expandDays(course) {
  return course.day.split("").map((d) => ({
    ...course,
    day: dayMap[d],
  }));
}

function periodRange(course) {
  const start = Number(course.period);
  const rawEnd = course.period_end ?? course.period;
  const end = Number(rawEnd);
  if (Number.isNaN(start)) return [];
  const normalizedEnd = Number.isNaN(end) ? start : end;
  const from = Math.min(start, normalizedEnd);
  const to = Math.max(start, normalizedEnd);
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
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
      periodRange(c).forEach((p) => {
        if (grid[c.day] && p in grid[c.day]) {
          grid[c.day][p] = c;
        }
      });
    });
  });

  return grid;
}

export default function Calendar() {
  const { courses, courseColorMap } = useSchedule();

  const grid = buildGrid(courses);

  return (
    <div className="my-3 mx-1 gap-3 h-full min-h-0 flex flex-col">
      {/* Invisible spacer matches the dropdown in SelectPlan so the grid aligns with "Plan Generation". */}
      <div className="h-[2.125rem] invisible flex-none" aria-hidden="true" />
      <div className="rounded-md border border-widget-border bg-[#F9FFD5] p-2">
        <div className="grid grid-cols-[52px_repeat(5,minmax(0,1fr))] gap-0 border border-neutral-400">
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
                    {course && (() => {
                      const c = colorForCourse(course.course_id, courseColorMap);
                      return (
                        <span
                          className="inline-block max-w-[calc(100%-6px)] truncate rounded-md border px-2.5 py-0.5 text-center text-xs font-medium leading-tight"
                          style={{ backgroundColor: c.bg, borderColor: c.border, color: c.text }}
                        >
                          {course.course_id}
                        </span>
                      );
                    })()}
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
