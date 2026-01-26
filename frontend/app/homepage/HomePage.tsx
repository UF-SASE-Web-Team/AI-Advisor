import React, { useState } from "react";
import Dashboard from "~/components/Dashboard";
import NavigationBar from "~/components/navigation/NavigationBar";
import { API_URL } from "~/config";

export default function HomePage() {
  const [chatbotInput, setChatbotInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const MAX_VISIBLE_MESSAGES = 5;
  const visibleMessages = messages.slice(0, MAX_VISIBLE_MESSAGES);
  const hiddenCount = Math.max(0, messages.length - visibleMessages.length);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!chatbotInput.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/rag/query/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: chatbotInput, max_results: 5 }),
      });
      const data = await response.json();
      const newMessage = data.answer;
      setMessages((prev) => [newMessage, ...prev]);
      setIsChatOpen(true);
      setChatbotInput("");
    } catch (error) {
      console.error("Error submitting chatbot input:", error);
      setMessages((prev) => [`Error: ${String(error)}`, ...prev]);
      setIsChatOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeChatbotInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatbotInput(e.target.value);
  };
  const toggleChat = () => setIsChatOpen((v) => !v);

  return (
    <div className="bg-white min-h-screen">
      {/* Header with two rows */}
      <div className="w-full bg-slate-500 shadow-[0px_10px_10px_0px_rgba(0,0,0,0.25)]">
        {/* Top row: Navigation/Login */}
        <div className="w-full flex justify-end">
          <NavigationBar />
        </div>

        {/* Bottom row: AI Input and Chat */}
        <div className="w-full pl-5 pr-5 pb-4 flex gap-4 items-center justify-between">
        <form
          className="flex-1 flex items-center gap-4"
          onSubmit={handleSubmit}
        >
          <div className="flex-1 h-20 bg-white shadow-[0px_10px_4px_0px_rgba(0,0,0,0.50)] flex items-center justify-between rounded">
            <input
              className="w-full pl-5 text-black text-2xl font-figmaHand bg-transparent outline-none"
              type="text"
              value={chatbotInput}
              onChange={handleChangeChatbotInput}
              placeholder="Ask AI-Advisor..."
            />
            <button
              type="submit"
              className="w-24 h-20 bg-lime-100 rounded-r-lg shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] border border-lime-100 cursor-pointer text-black text-2xl font-figmaHand"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </form>

        <div className="relative">
          <button
            type="button"
            onClick={toggleChat}
            aria-expanded={isChatOpen}
            aria-label="Open chat history"
            className="w-24 h-24 rounded-full bg-lime-100 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] border border-lime-100 flex items-center justify-center hover:scale-105 transition-transform duration-200"
            title="Open chat panel"
          >
            <img 
              src="/chatbot-icon.png" 
              alt="Chatbot" 
              className="w-16 h-16"
            />
          </button>

          {isChatOpen && (
            <div className="absolute right-0 top-full mt-2 w-[28rem] max-h-[80vh] bg-white rounded-lg shadow-[0_18px_40px_rgba(2,6,23,0.35)] border overflow-hidden flex flex-col z-50">
              <div className="flex items-center justify-between px-5 py-3 bg-slate-500 border-b">
                <div className="text-white font-figmaHand text-lg">
                  AI-Advisor
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMessages([])}
                    className="text-sm bg-slate-600/30 text-white px-2 py-1 rounded hover:bg-slate-600/50"
                    title="Clear"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="w-8 h-8 rounded-full bg-lime-100 flex items-center justify-center text-slate-700 hover:scale-95"
                    title="Close"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-auto flex-1 space-y-4 bg-white">
                {hiddenCount > 0 && (
                  <div className="text-sm text-lime-700 font-figmaHand">
                    +{hiddenCount} more
                  </div>
                )}

                {visibleMessages.length === 0 ? (
                  <div className="text-base text-slate-500 font-figmaHand">
                    No messages yet — send a question to see responses.
                  </div>
                ) : (
                  visibleMessages.map((m, i) => (
                    <div
                      key={i}
                      className="bg-white p-4 rounded-lg shadow-[0_8px_20px_rgba(2,6,23,0.06)] text-slate-700 text-sm font-figmaHand border"
                    >
                      {m}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      <Dashboard />
    </div>
  );
}
