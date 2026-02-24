export function ChatbotDisplay({ history }: any) {
  return (
    <div
      className="
    p-4
    grow
    overflow-y-auto
    "
    >
      {history.map((msg: any) => {
        <div key={msg.key}>{msg.text}</div>;
      })}
    </div>
  );
}
