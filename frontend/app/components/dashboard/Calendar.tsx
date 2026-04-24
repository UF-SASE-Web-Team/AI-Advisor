import React, { useEffect, useState } from "react";
import { fetchSchedule } from "../../apis/scheduleConfig";
import { useSchedule } from "./SelectPlan";

const days = ["Mon", "Tues", "Wed", "Thur", "Fri"];

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
  T: "Tues",
  W: "Wed",
  R: "Thur",
  F: "Fri",
};

function expandDays(course) {
  return course.day.split("").map((d) => ({
    ...course,
    day: dayMap[d],
  }));
}

function buildGrid(courses) {
  const grid = {};

  days.forEach((day) => {
    grid[day] = {};
    periodRows.forEach((p) => {
      grid[day][p] = null;
    });
  });

  courses.forEach((course) => {
    expandDays(course).forEach((c) => {
      grid[c.day][c.period] = c;
    });
  });

  return grid;
}

export default function Calendar() {
  const { courses } = useSchedule();
  
  const grid = buildGrid(courses);

  if (courses.length === 0) {
    return (
      <div className="min-h-0">
        <div className="rounded-md border border-widget-border bg-[#F9FFD5] p-6 text-[#807676]">
          No schedule generated yet
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-0 h-full flex flex-col my-3 mx-1 gap-3">
      <div className="h-[2.125rem] invisible flex-none" aria-hidden="true" />
      <div className="rounded-md border border-widget-border bg-[#F9FFD5] p-2 flex-1 min-h-0 flex flex-col">
        <div className="grid grid-cols-[36px_repeat(5,minmax(0,1fr))] grid-rows-[auto_repeat(15,minmax(2.25rem,1fr))] gap-0 border border-neutral-400 flex-1 min-h-0">
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

          {periodRows.map((period) => {
            if (period === 1) {
              return (
                <React.Fragment key={String(period)}>
                  <div className="flex items-center justify-center border-r border-b border-neutral-400 bg-neutral-50 px-0.5 py-0.5 text-center text-[10px] font-medium leading-tight">
                    {periodLabel(period)}
                  </div>
                  <div className="col-span-5 row-span-2 flex items-center justify-center border-b border-neutral-400 bg-[#E2EFFF] text-sm font-semibold tracking-wide text-[#4A4848]">
                    NO CLASSES
                  </div>
                </React.Fragment>
              );
            }

            if (period === 2) {
              return (
                <div
                  key={String(period)}
                  className="flex items-center justify-center border-r border-b border-neutral-400 bg-neutral-50 px-0.5 py-0.5 text-center text-[10px] font-medium leading-tight"
                >
                  {periodLabel(period)}
                </div>
              );
            }

            return (
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
                      className={`flex items-center justify-center border-b border-neutral-400 bg-[#FEFFF8] text-xs ${
                        isLastCol ? "" : "border-r border-neutral-400"
                      }`}
                    >
                      {course && (
                        <span className="inline-block max-w-full truncate rounded-lg border border-[#C2DBFC] bg-[#E2EFFF] px-3 py-1 text-center text-xs font-medium leading-tight text-[#4A4848]">
                          {course.course_id}
                        </span>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}