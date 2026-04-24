import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ChatbotDisplay } from "./ChatbotDisplay";
import { ChatbotInput } from "./ChatbotInput";
import { createAdvisorSession, queryAdvisor } from "~/apis/chatbot";
import { Widget } from "../dashboard/Widget";
import { supabase } from "../../../supabase";

interface ChatMsg {
  text: string;
  sender: "user" | "bot";
  key: string;
}

interface ChatSessionRow {
  id: string;
  title: string | null;
  created_at: string | null;
}

interface ChatMessageRow {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string | null;
}

interface ChatHistoryItem {
  id: string;
  latestQuery: string;
  createdAt: string | null;
  updatedAt: string | null;
}

const welcomeMessage: ChatMsg = {
  text: "Ask me a question!",
  sender: "bot",
  key: "welcome",
};

export function ChatContainer() {
  const [msgHistory, setMsgHistory] = useState<ChatMsg[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<ChatHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartingNewChat, setIsStartingNewChat] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    })();
  }, []);

  const userMessageCount = useMemo(
    () => msgHistory.filter((msg) => msg.sender === "user").length,
    [msgHistory],
  );

  const getUserId = async () => {
    if (userId) return userId;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    setUserId(user.id);
    return user.id;
  };

  const loadHistory = async () => {
    const currentUserId = await getUserId();
    if (!currentUserId) {
      setHistoryError("Sign in to view chat history.");
      setHistoryItems([]);
      return;
    }

    setHistoryLoading(true);
    setHistoryError("");
    try {
      const { data: sessions, error: sessionsError } = await supabase
        .from("chat_sessions")
        .select("id, title, created_at")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false });

      if (sessionsError) throw sessionsError;

      const rows = (sessions ?? []) as ChatSessionRow[];
      const sessionIds = rows.map((session) => session.id);
      if (sessionIds.length === 0) {
        setHistoryItems([]);
        return;
      }

      const { data: messages, error: messagesError } = await supabase
        .from("chat_messages")
        .select("id, session_id, role, content, created_at")
        .in("session_id", sessionIds)
        .order("created_at", { ascending: false });

      if (messagesError) throw messagesError;

      const latestUserMessages = new Map<string, ChatMessageRow>();
      const latestMessages = new Map<string, ChatMessageRow>();
      for (const message of (messages ?? []) as ChatMessageRow[]) {
        if (!latestMessages.has(message.session_id)) {
          latestMessages.set(message.session_id, message);
        }
        if (message.role === "user" && !latestUserMessages.has(message.session_id)) {
          latestUserMessages.set(message.session_id, message);
        }
      }

      setHistoryItems(
        rows
          .map((session) => {
            const latestUserMessage = latestUserMessages.get(session.id);
            const latestMessage = latestMessages.get(session.id);
            const latestQuery =
              latestUserMessage?.content ||
              latestMessage?.content ||
              session.title ||
              "Untitled chat";

            return {
              id: session.id,
              latestQuery,
              createdAt: session.created_at,
              updatedAt: latestMessage?.created_at ?? session.created_at,
            };
          })
          .filter((session) => session.latestQuery.trim() !== "Untitled chat")
          .sort((a, b) => {
            const aTime = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
            const bTime = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
            return bTime - aTime;
          }),
      );
    } catch (err) {
      console.error("Failed to load chat history", err);
      setHistoryError("Could not load chat history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistory = async () => {
    const nextOpen = !historyOpen;
    setHistoryOpen(nextOpen);
    if (nextOpen) {
      await loadHistory();
    }
  };

  const loadSession = async (selectedSessionId: string) => {
    setLoadingSessionId(selectedSessionId);
    setHistoryError("");
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, role, content, created_at")
        .eq("session_id", selectedSessionId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const messages = (data ?? []) as Omit<ChatMessageRow, "session_id">[];
      setSessionId(selectedSessionId);
      setMsgHistory(
        messages.length > 0
          ? messages.map((message, index) => ({
              text: message.content,
              sender: getMessageSender(message.role),
              key:
                message.id ||
                `${selectedSessionId}-${message.role}-${message.created_at ?? "no-date"}-${index}`,
            }))
          : [welcomeMessage],
      );
      setHistoryOpen(false);
    } catch (err) {
      console.error("Failed to load chat session", err);
      setHistoryError("Could not load that conversation.");
    } finally {
      setLoadingSessionId(null);
    }
  };

  const startNewChat = async () => {
    if (isStartingNewChat) return;

    setIsStartingNewChat(true);
    setHistoryError("");
    try {
      const currentUserId = await getUserId();
      const { session_id } = await createAdvisorSession({
        title: "New chat",
        user_id: currentUserId ?? undefined,
      });

      setSessionId(session_id);
      setMsgHistory([welcomeMessage]);
      setInput("");
      setHistoryOpen(false);
    } catch (err) {
      console.error("Failed to start new chat", err);
      setHistoryError("Could not start a new chat.");
    } finally {
      setIsStartingNewChat(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = input.trim();
    if (question === "" || isSubmitting) return;

    const newMsg: ChatMsg = {
      text: question,
      sender: "user",
      key: `pending-user-${Date.now()}`,
    };
    setMsgHistory((prev) => [...prev, newMsg]);
    setInput("");
    setIsSubmitting(true);

    try {
      const currentUserId = await getUserId();
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const { session_id } = await createAdvisorSession({
          title: question.slice(0, 80),
          user_id: currentUserId ?? undefined,
        });
        activeSessionId = session_id;
        setSessionId(session_id);
      }

      const response = await queryAdvisor({
        question,
        session_id: activeSessionId,
        user_id: currentUserId ?? undefined,
      });

      const botMsg: ChatMsg = {
        text: response.error_message || response.answer,
        sender: "bot",
        key: `pending-bot-${Date.now()}`,
      };
      if (response.session_id && response.session_id !== activeSessionId) {
        setSessionId(response.session_id);
      }
      setMsgHistory((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Advisor query failed", err);
      setMsgHistory((prev) => [
        ...prev,
        {
          text: "Connection Error :(",
          sender: "bot",
          key: `error-bot-${Date.now()}`,
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Widget title="AI Advisor" className="flex-1 min-h-0" titleClassName="text-xl">
      <div className="flex items-center justify-between gap-2 border-b border-widget-border px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openHistory}
            className="rounded-full border border-widget-border bg-white px-3 py-1 text-sm font-medium text-gray-800 shadow-sm hover:bg-blue-50"
          >
            History
          </button>
          <button
            type="button"
            onClick={startNewChat}
            disabled={isStartingNewChat}
            className="rounded-full border border-widget-border bg-white px-3 py-1 text-sm font-medium text-gray-800 shadow-sm hover:bg-blue-50 disabled:opacity-60"
          >
            {isStartingNewChat ? "Starting..." : "New Chat"}
          </button>
        </div>
        <span className="text-xs text-gray-600">
          {userMessageCount > 0 ? `${userMessageCount} sent` : "No active chat"}
        </span>
      </div>
      {historyOpen && (
        <div className="max-h-52 overflow-y-auto border-b border-widget-border bg-white/70 p-2">
          {historyLoading && <p className="px-2 py-3 text-sm text-gray-600">Loading chats...</p>}
          {historyError && <p className="px-2 py-3 text-sm text-red-600">{historyError}</p>}
          {!historyLoading && !historyError && historyItems.length === 0 && (
            <p className="px-2 py-3 text-sm text-gray-600">No saved chats yet.</p>
          )}
          {!historyLoading &&
            historyItems.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => loadSession(session.id)}
                className="mb-2 w-full rounded-md border border-gray-200 bg-white p-2 text-left text-sm shadow-sm hover:border-blue-300 hover:bg-blue-50 disabled:opacity-60"
                disabled={loadingSessionId === session.id}
              >
                <span className="block truncate font-medium text-gray-900">
                  {session.latestQuery}
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  {formatChatDate(session.updatedAt ?? session.createdAt)}
                </span>
              </button>
            ))}
        </div>
      )}
      <ChatbotDisplay history={msgHistory} />
      <ChatbotInput
        value={input}
        onChange={setInput}
        onSubmit={onSubmit}
        disabled={isSubmitting}
      />
    </Widget>
  );
}

function getMessageSender(role: string): "user" | "bot" {
  return role.toLowerCase() === "user" ? "user" : "bot";
}

function formatChatDate(value: string | null) {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
