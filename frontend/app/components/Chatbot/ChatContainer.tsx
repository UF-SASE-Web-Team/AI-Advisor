import { useState, type ReactNode } from "react";
import { ChatbotDisplay } from "./ChatbotDisplay";
import { ChatbotInput } from "./ChatbotInput";

interface ChatMsg {
  text: string;
  sender: string;
  key: number;
}

export function ChatContainer() {
  const [msgHistory, setMsgHistory] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");

  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    if (input.trim() == "") return;

    // TODO: figure out exact message type, properties
    const newMsg: ChatMsg = {
      text: input,
      sender: "user",
      key: Date.now(),
    };
    setMsgHistory([...msgHistory, newMsg]);
    setInput("");
  };

  return (
    <div
      className="
      flex flex-col
      m-4
      "
    >
      <ChatHeader />

      <WidgetBody>
        <ChatbotDisplay history={msgHistory} />

        <ChatbotInput value={input} onChange={setInput} onSubmit={onSubmit} />
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
