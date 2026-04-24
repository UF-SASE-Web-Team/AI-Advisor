import { useEffect, useState, type ReactNode } from "react";
import { ChatbotDisplay } from "./ChatbotDisplay";
import { ChatbotInput } from "./ChatbotInput";
import { sendMsgToBackend } from "~/apis/chatbot";
import { Widget } from "../dashboard/Widget";

interface ChatMsg {
  text: string;
  sender: string;
  key: number;
}

export function ChatContainer() {
  const [msgHistory, setMsgHistory] = useState<ChatMsg[]>([{
    text: "Ask me a question!",
    sender: "bot",
    key: Date.now(),
  }]);
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
      } catch (err) { }
      setMsgHistory([...msgHistory, botMsg]);
    })();
  });

  return (
    <Widget title="AI Advisor">
      <ChatbotDisplay history={msgHistory} />
      <ChatbotInput value={input} onChange={setInput} onSubmit={onSubmit} />
    </Widget>
  );
}
