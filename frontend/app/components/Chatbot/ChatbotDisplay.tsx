import { useEffect, useRef } from "react";
import { marked } from "marked";

export function ChatbotDisplay({ history }: any) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history]);

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
            className="p-3 shadow-sm rounded-xl text-sm max-w-3/4 bg-blue-200 self-end"
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
    </div>
  );
}
