import { API_URL } from "~/config";
import { type FormData } from "../components/old/calendar/ScheduleCalendar";

export const sendMsgToBackend = async (msg: string) => {
  return await fetch(`${API_URL}/api/placeholder-bot-endpoint/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      msg: msg,
    }),
  });
};
