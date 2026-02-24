import type { ReactNode } from "react";
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
      <ChatHeader />

      <WidgetBody>
        
        <ChatbotDisplay>
          <div>message!</div>
          <div>message 2!</div>
        </ChatbotDisplay>
        
        <ChatbotInput />
      </WidgetBody>
    </div>
  );
}

const ChatHeader = () => {
  return (
    <div
      className="
    p-3 font-bold
    bg-widget-titlebar
    border-1 border-widget-titlebar-border
    rounded-t-md"
    >
      AI-Advisor
    </div>
  );
};

const WidgetBody = ({ children }: any) => {
  return (
    <div
      className="
  bg-widget-bg
  border-1 border-widget-border
  grow flex flex-col
  rounded-b-md"
    >
      {children}
    </div>
  );
};
