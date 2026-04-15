import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { buildDashboardContext } from "@/lib/dashboard-context";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const SUGGESTIONS = [
  "What's the current budget status?",
  "How many clients are migrating?",
  "What's the Copilot adoption rate?",
  "Show me the roadmap progress",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const streamChat = useCallback(
    async (allMessages: Msg[]) => {
      setIsLoading(true);
      let assistantSoFar = "";

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
            );
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      try {
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: allMessages }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: "Request failed" }));
          upsert(`⚠️ ${err.error || "Something went wrong. Please try again."}`);
          setIsLoading(false);
          return;
        }

        if (!resp.body) {
          upsert("⚠️ No response received.");
          setIsLoading(false);
          return;
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) upsert(content);
            } catch {
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }
      } catch (e) {
        console.error("Chat error:", e);
        upsert("⚠️ Connection error. Please try again.");
      }
      setIsLoading(false);
    },
    []
  );

  const send = (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;
    const userMsg: Msg = { role: "user", content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    streamChat(newMessages);
  };

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[560px] rounded-xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-heading font-semibold">OSES Assistant</p>
              <p className="text-[10px] text-muted-foreground">Ask anything about the dashboard</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground text-center">
                  Hi! I can help you explore OSES dashboard data — budget, people, GitHub, Jira, roadmap, and more.
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-[11px] px-3 py-2 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-foreground"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none [&>*]:my-1 [&_ul]:pl-4 [&_ol]:pl-4 [&_li]:my-0.5 [&_p]:my-1 [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_code]:text-[10px] [&_code]:bg-background/50 [&_code]:px-1 [&_code]:rounded">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
                <div className="bg-muted/50 rounded-lg px-3 py-2">
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about budget, people, GitHub..."
                className="flex-1 bg-muted/50 rounded-lg px-3 py-2 text-xs border border-border focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 rounded-lg"
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
