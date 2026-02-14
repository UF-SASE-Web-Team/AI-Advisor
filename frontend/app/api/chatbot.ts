import { API_URL } from "~/config";
import { type FormData } from "../components/calendar/ScheduleCalendar";

export const setSolverPreference = async (
  formData: FormData,
  blacklist: Record<string, number[]>,
) => {
  return await fetch(`${API_URL}/api/userpreference/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      x: formData.x,
      y: formData.y,
      z: formData.z,
      min_credits: formData.min_credits,
      max_credits: formData.max_credits,
      blacklisted_periods: blacklist,
    }),
  });
};

export const Solver = async () => {
  return await fetch(`${API_URL}/api/solve/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
  }).then(result => result.json());
};
