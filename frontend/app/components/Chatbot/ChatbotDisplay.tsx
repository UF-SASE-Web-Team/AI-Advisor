import { useEffect, useRef } from "react";
import { marked } from "marked";

export function ChatbotDisplay({ history, isThinking, freshUserKey }: any) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history, isThinking]);

  return (
    <div
      ref={scrollRef}
      className="
    p-4
    flex-1
    min-h-0
    overflow-y-auto
    flex flex-col gap-2
    "
    >
      {history.map((msg: any) => (
        msg.sender === "user" ? (
          <div
            key={msg.key}
            className={`p-3 shadow-sm rounded-xl text-sm max-w-3/4 bg-blue-200 self-end ${
              msg.key === freshUserKey ? "chat-bubble-rise" : ""
            }`}
          >
            {msg.text}
          </div>
        ) : (
          <div
            key={msg.key}
            className="p-3 shadow-sm rounded-xl text-sm max-w-3/4 bg-white text-gray-800 self-start"
            dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }}
          />
        )
      ))}
      {isThinking && <ThinkingBubble />}
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div
      className="p-3 shadow-sm rounded-xl text-sm bg-white text-gray-800 self-start"
      aria-label="Advisor is thinking"
      role="status"
    >
      <span className="flex items-center gap-1">
        <span className="sr-only">Thinking…</span>
        <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
        <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
        <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" />
      </span>
    </div>
  );
}
