import React, { useEffect, useState } from "react";
import { fetchSchedule } from "../apis/scheduleConfig"; // adjust path if needed

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const periods = [1,2,3,4,5,6,7,8,9,10,11];

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
    periods.forEach(p => {
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
    return <div className="p-6">Loading schedule...</div>;
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-2">
        
        {/* Empty corner */}
        <div></div>

        {/* Day headers */}
        {days.map(day => (
          <div
            key={day}
            className="text-center font-semibold py-2 border-b"
          >
            {day}
          </div>
        ))}

        {/* Grid */}
        {periods.map(period => (
          <React.Fragment key={period}>
            
            {/* Period label */}
            <div className="text-center py-4 font-medium">
              {period}
            </div>

            {/* Cells */}
            {days.map(day => {
              const course = grid[day][period];

              return (
                <div
                  key={day + period}
                  className="h-20 border rounded-lg flex items-center justify-center bg-white"
                >
                  {course && (
                    <div className="bg-blue-200 text-blue-900 px-3 py-1 rounded-full text-sm shadow">
                      {course.course_id}
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}