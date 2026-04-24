import { useEffect, useState } from "react";
import { ChatbotDisplay } from "./ChatbotDisplay";
import { ChatbotInput } from "./ChatbotInput";
import { createAdvisorSession, queryAdvisor } from "~/apis/chatbot";
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
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { session_id } = await createAdvisorSession({});
        setSessionId(session_id);
      } catch (err) {
        console.error("Failed to create advisor session", err);
      }
    })();
  }, []);

  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    if (input.trim() == "") return;

    const newMsg: ChatMsg = {
      text: input,
      sender: "user",
      key: Date.now(),
    };
    setMsgHistory([...msgHistory, newMsg]);
    setInput("");
  };

  useEffect(() => {
    const lastMsg: ChatMsg | undefined = msgHistory[msgHistory.length - 1];
    if (!lastMsg || lastMsg.sender == "bot") return;

    (async () => {
      const botMsg: ChatMsg = {
        text: "Connection Error :(",
        sender: "bot",
        key: Date.now(),
      };
      try {
        const response = await queryAdvisor({
          question: lastMsg.text,
          session_id: sessionId ?? undefined,
        });
        botMsg.text = response.error_message || response.answer;
        if (!sessionId && response.session_id) {
          setSessionId(response.session_id);
        }
      } catch (err) {
        console.error("Advisor query failed", err);
      }
      setMsgHistory((prev) => [...prev, botMsg]);
    })();
  }, [msgHistory]);

  return (
    <Widget title="AI Advisor" className="flex-1 min-h-0">
      <ChatbotDisplay history={msgHistory} />
      <ChatbotInput value={input} onChange={setInput} onSubmit={onSubmit} />
    </Widget>
  );
}
