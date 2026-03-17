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
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
      let botMsg: ChatMsg = {
        text: "Connection Error :(",
        sender: "bot",
        key: Date.now(),
      };
      try {
        const response = await sendMsgToBackend(lastMsg.text);
        if (!response.ok) throw new Error("response broke");

        const content = await response.json();
        botMsg.text = content.text;
      } catch (err) {}
      setMsgHistory([...msgHistory, botMsg]);
    })();
  });

  return (
    <div
      className={`
      flex flex-col m-4 min-h-0
      transition-all duration-300
      ${isExpanded ? "fixed top-4 left-4 right-4 bottom-4 z-50 shadow-xl" : "flex-1"}`}
    >
      <ChatHeader
        isExpanded={isExpanded}
        onMinimize={() => setIsMinimized(!isMinimized)}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
      />

      {!isMinimized && (
        <WidgetBody>
        <ChatbotDisplay history={msgHistory} />

        <ChatbotInput value={input} onChange={setInput} onSubmit={onSubmit} />
      </WidgetBody>
      )};
    </div>
  );
}

const ChatHeader = ({isExpanded, onMinimize, onToggleExpand}: {
  isExpanded: boolean;
  onMinimize: () => void;
  onToggleExpand: () => void;
}) => {
  return (
    <div
      className="
    p-3 font-bold
    bg-widget-titlebar
    border-1 border-widget-titlebar-border
    rounded-t-md
    flex items-center justify-between"
    >
      <span>AI-Advisor</span>

    <div className="flex items-center gap-2">
      <button
        onClick={onMinimize}
        className="hover:opacity-70 transition-opacity"
        aria-label="Minimize">
          <img src="./minimize_symbol.png" alt="Minimize" width={16} height={16} />
        </button>

      <button
        onClick={onToggleExpand}
        className="hover:opacity-70 transition-opacity"
        aria-label={isExpanded ? "Collapse" : "Expand"}>
          <img src="./expanding_arrows.png" width={16} height={16} />
        </button> 
    </div>
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
  rounded-b-md
  min-h-0"
    >
      {children}
    </div>
  );
};
