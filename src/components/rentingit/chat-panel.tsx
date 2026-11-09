"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { relativeTime } from "./format";

type Props = {
  bookingId: string;
  currentUserId: string;
};

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  message: string;
  createdAt: string;
  sender: { id: string; name: string };
};

export function ChatPanel({ bookingId, currentUserId }: Props) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Fetch conversation + messages
  const { data, isLoading } = useQuery({
    queryKey: ["conversation", bookingId],
    queryFn: async () => {
      const r = await fetch(`/api/conversations/${bookingId}`, { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to load chat");
      return r.json();
    },
  });

  const conversation = data?.conversation;
  const messages: Message[] = conversation?.messages || [];
  const otherParty = data?.otherParty;

  // Send message mutation
  const send = useMutation({
    mutationFn: async (message: string) => {
      const r = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conversation.id, message }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      return j.message;
    },
    onSuccess: (msg) => {
      // Optimistic: query will refetch; also push to local state via invalidation
      qc.setQueryData(["conversation", bookingId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          conversation: {
            ...old.conversation,
            messages: [...(old.conversation.messages || []), msg],
          },
        };
      });
      setText("");
      socketRef.current?.emit("typing:stop", { conversationId: conversation.id, userId: currentUserId });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // WebSocket connection
  useEffect(() => {
    if (!conversation?.id) return;
    const socket = io("/?XTransformPort=3003", { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("conversation:join", { conversationId: conversation.id, userId: currentUserId });
    });

    socket.on("message:new", (msg: Message) => {
      qc.setQueryData(["conversation", bookingId], (old: any) => {
        if (!old) return old;
        // De-dupe
        if (old.conversation.messages.some((m: Message) => m.id === msg.id)) return old;
        return {
          ...old,
          conversation: {
            ...old.conversation,
            messages: [...(old.conversation.messages || []), msg],
          },
        };
      });
      setOtherUserTyping(false);
    });

    socket.on("typing:start", ({ userId, userName }: { userId: string; userName: string }) => {
      if (userId !== currentUserId) {
        setOtherUserTyping(true);
      }
    });
    socket.on("typing:stop", ({ userId }: { userId: string }) => {
      if (userId !== currentUserId) setOtherUserTyping(false);
    });

    return () => {
      socket.emit("conversation:leave", { conversationId: conversation.id });
      socket.disconnect();
    };
  }, [conversation?.id, currentUserId, bookingId, qc]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !conversation) return;
    send.mutate(text.trim());
  };

  const handleTyping = (val: string) => {
    setText(val);
    if (!conversation) return;
    if (val.trim()) {
      socketRef.current?.emit("typing:start", {
        conversationId: conversation.id,
        userId: currentUserId,
        userName: "You",
      });
    } else {
      socketRef.current?.emit("typing:stop", {
        conversationId: conversation.id,
        userId: currentUserId,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[400px] rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border bg-muted/30">
        <div className="relative">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-brand-gradient text-white text-xs font-semibold">
              {otherParty?.name?.split(" ").map((s: string) => s[0]).slice(0, 2).join("") || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{otherParty?.name || "Loading…"}</div>
          <div className="text-xs text-muted-foreground">
            {otherUserTyping ? (
              <span className="text-primary flex items-center gap-1">
                <span className="flex gap-0.5">
                  <span className="h-1 w-1 rounded-full bg-primary pulse-dot" />
                  <span className="h-1 w-1 rounded-full bg-primary pulse-dot" style={{ animationDelay: "0.2s" }} />
                  <span className="h-1 w-1 rounded-full bg-primary pulse-dot" style={{ animationDelay: "0.4s" }} />
                </span>
                typing…
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Online
              </span>
            )}
          </div>
        </div>
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto fancy-scroll p-3 space-y-2 bg-muted/10">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-sm text-muted-foreground">
            <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
            <p>Say hi to {otherParty?.name?.split(" ")[0]} 👋</p>
            <p className="text-xs mt-1">Coordinate pickup time, location, or ask any questions.</p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? "bg-brand-gradient text-white rounded-br-sm"
                        : "bg-card border border-border rounded-bl-sm"
                    }`}
                  >
                    {m.message}
                  </div>
                  <div className={`text-[10px] text-muted-foreground mt-0.5 px-1 ${mine ? "text-right" : "text-left"}`}>
                    {mine ? "You · " : `${m.sender.name.split(" ")[0]} · `}{relativeTime(m.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-2 border-t border-border bg-card flex gap-2">
        <Input
          placeholder={`Message ${otherParty?.name?.split(" ")[0] || ""}…`
          }
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          className="flex-1"
          maxLength={2000}
        />
        <Button type="submit" size="icon" disabled={!text.trim() || send.isPending} className="bg-brand-gradient text-white hover:opacity-90">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
