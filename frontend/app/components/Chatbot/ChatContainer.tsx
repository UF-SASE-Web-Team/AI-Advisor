import { ChatbotDisplay } from "./ChatbotDisplay";
import { ChatbotInput } from "./ChatbotInput";

export function ChatContainer() {
  return (
    <div
      className="
      flex flex-col
      m-4
      "
    >
      <div
        className="
        p-3 font-bold
        bg-widget-titlebar
        border-1 border-widget-titlebar-border
        rounded-t-md"
      >
        AI-Advisor
      </div>

      <div
        className="
      bg-widget-bg
      border-1 border-widget-border
      grow flex flex-col
      rounded-b-md"
      >
        <ChatbotDisplay />
        <ChatbotInput />
      </div>
    </div>
  );
}
