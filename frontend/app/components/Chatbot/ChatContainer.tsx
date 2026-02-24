import { useEffect, useState, type ReactNode } from "react";
import { ChatbotDisplay } from "./ChatbotDisplay";
import { ChatbotInput } from "./ChatbotInput";
import { sendMsgToBackend } from "~/apis/chatbot";

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

  useEffect(() => {
    const lastMsg: ChatMsg = msgHistory[msgHistory.length - 1];
    if (msgHistory.length == 0 || lastMsg.sender == "bot") return;

    (async () => {
      try {
        const response = await sendMsgToBackend(lastMsg.text);
        if (!response.ok) throw new Error("response broke");
      } catch (err) {
        const errorMsg: ChatMsg = {
          text: "Connection Error :(",
          sender: "bot",
          key: Date.now(),
        };
        setMsgHistory([...msgHistory, errorMsg]);
      }
    })();
  });

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
