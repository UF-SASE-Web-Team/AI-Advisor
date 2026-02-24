export function ChatbotDisplay({ history }: any) {
  return (
    <div
      className="
    p-4
    grow
    overflow-y-auto
    flex flex-col gap-2
    "
    >
      {history.map((msg: any) => (
        <div
          key={msg.key}
          className={`
            p-3
          shadow-sm
          rounded-xl
          text-sm
          max-w-3/4
          ${msg.sender == "user" ? "bg-blue-200 self-end" : "bg-white text-gray-800 self-start"}`}
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
}
