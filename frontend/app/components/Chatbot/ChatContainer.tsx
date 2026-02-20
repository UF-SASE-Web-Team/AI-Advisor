import { ChatbotDisplay } from "./ChatbotDisplay";
import { ChatbotInput } from "./ChatbotInput";

export function ChatContainer() {
  return (
    <div className="border-4 border-red-600">
      {/*state / logic here*/}
      <ChatbotDisplay />
      <ChatbotInput />
    </div>
  );
}
