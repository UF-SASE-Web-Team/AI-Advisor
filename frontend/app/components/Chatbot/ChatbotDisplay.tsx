export function ChatbotDisplay(thisNode: any) {
  return (
    <div
      className="
    p-4
    grow
    overflow-y-auto
    "
    >
      {thisNode.children}
    </div>
  );
}
