import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { publicUsers } from "@/data/social";

interface ChatMessage {
  id: string;
  from: string;
  text: string;
  createdAt: string;
}

const STORAGE_KEY = "chatMessages";

const timeNow = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const loadMessages = (): Record<string, ChatMessage[]> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

const saveMessages = (messages: Record<string, ChatMessage[]>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
};

const ConversationList = () => {
  const navigate = useNavigate();
  const [messages] = useState(loadMessages);

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-1">Messages</h1>
        <p className="text-sm text-muted-foreground mb-5">Chat with the SmartChef community</p>

        <div className="space-y-2">
          {Object.entries(publicUsers).map(([id, user], i) => {
            const history = messages[id] || [];
            const last = history[history.length - 1];
            return (
              <motion.button
                key={id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/chat/${id}`)}
                className="w-full flex items-center gap-3 p-3 bg-card rounded-2xl border border-border/50 hover:bg-muted transition-colors text-left"
              >
                <Avatar className="w-12 h-12 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {user.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {last ? `${last.from === "me" ? "You: " : ""}${last.text}` : "Start a conversation..."}
                  </p>
                </div>
                {last && <span className="text-[10px] text-muted-foreground flex-shrink-0">{last.createdAt}</span>}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Conversation = ({ userId }: { userId: string }) => {
  const navigate = useNavigate();
  const user = publicUsers[userId];
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages()[userId] || []);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const all = loadMessages();
    all[userId] = messages;
    saveMessages(all);
  }, [messages, userId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user) {
    return (
      <div className="min-h-screen pt-20 pb-24 md:pb-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">👤</p>
          <p className="text-sm font-medium text-foreground">User not found</p>
          <button
            onClick={() => navigate("/chat")}
            className="text-sm text-primary font-medium mt-3 hover:underline"
          >
            Back to messages
          </button>
        </div>
      </div>
    );
  }

  const sendMessage = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages(prev => [...prev, { id: `m-${Date.now()}`, from: "me", text: trimmed, createdAt: timeNow() }]);
    setText("");
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/chat")} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {user.name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">{user.name}</p>
            <p className="text-[10px] text-muted-foreground">{user.bio}</p>
          </div>
          <button
            onClick={() => navigate(`/user/${userId}`)}
            className="text-xs text-primary font-medium hover:underline flex-shrink-0"
          >
            View profile
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">👋</p>
              <p className="text-sm font-medium text-foreground">Say hello to {user.name.split(" ")[0]}!</p>
              <p className="text-xs text-muted-foreground mt-1">Message them anything about food or recipes.</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  msg.from === "me"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}
              >
                <p>{msg.text}</p>
                <p className={`text-[9px] mt-1 ${msg.from === "me" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {msg.createdAt}
                </p>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="flex items-center gap-2 mt-3"
        >
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`Message ${user.name.split(" ")[0]}...`}
            className="flex-1 bg-muted rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            aria-label="Send message"
            className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

const ChatPage = () => {
  const { userId } = useParams<{ userId: string }>();
  if (userId) return <Conversation key={userId} userId={userId} />;
  return <ConversationList />;
};

export default ChatPage;
