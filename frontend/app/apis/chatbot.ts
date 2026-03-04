import { API_URL } from "~/config";
import { type FormData } from "../components/old/calendar/ScheduleCalendar";

export const sendMsgToBackend = (msg: string) => {
  return fetch(`${API_URL}/api/placeholder-bot-endpoint/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      msg: msg,
    }),
  });
};
