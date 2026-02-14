import { API_URL } from "~/config";
import { type FormData } from "../components/calendar/ScheduleCalendar";

<<<<<<< HEAD
export const setPreference = async (
=======
export const setSolverPreference = async (
>>>>>>> 55cb36c6c1f6d6f08223eea83697a911a6b618e5
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
<<<<<<< HEAD
=======

export const Solver = async () => {
  return await fetch(`${API_URL}/api/solve/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
  }).then(result => result.json());
};
>>>>>>> 55cb36c6c1f6d6f08223eea83697a911a6b618e5
