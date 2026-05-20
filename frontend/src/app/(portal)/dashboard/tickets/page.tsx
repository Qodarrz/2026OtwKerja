"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import { io, Socket } from "socket.io-client";
import {
  Headset,
  Search,
  Send,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Inbox,
  UserCheck,
  Bot,
  Loader2,
  Bell
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatSession {
  id: string;
  status: "BOT" | "OPEN" | "RESOLVED";
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  assignedToId: string | null;
  assignedTo: {
    id: string;
    name: string;
    email: string;
  } | null;
  messages: any[];
  createdAt: string;
  updatedAt: string;
}

export default function TicketingPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "OPEN" | "MY" | "RESOLVED">("OPEN");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll inside chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load all sessions on mount
  useEffect(() => {
    fetchSessions();
    connectGlobalSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/chat/sessions/admin/all");
      setSessions(data);
    } catch (e) {
      console.error("Gagal mengambil sesi chat:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Connect to global socket to listen to ticket activities
  const connectGlobalSocket = () => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    // Listen for new tickets or incoming message activity in real-time
    socket.on("ticket_activity", (data: any) => {
      setSessions((prevSessions) => {
        const index = prevSessions.findIndex((s) => s.id === data.sessionId);

        if (index !== -1) {
          // Update message snippet and status of existing session
          const updated = [...prevSessions];
          const session = { ...updated[index] };

          // Check if message already exists
          if (!session.messages.some((m: any) => m.id === data.latestMessage.id)) {
            session.messages = [...session.messages, data.latestMessage];
          }

          if (data.status) {
            session.status = data.status;
          }

          if (data.assignedTo !== undefined) {
            session.assignedTo = data.assignedTo;
            session.assignedToId = data.assignedTo?.id || null;

            // Re-render selectedSession if it is the one being updated
            setSelectedSession((prev) =>
              prev?.id === session.id ? { ...prev, assignedTo: session.assignedTo, assignedToId: session.assignedToId } : prev
            );
          }

          session.updatedAt = new Date().toISOString();
          updated[index] = session;

          // Sort by updatedAt descending
          return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        } else {
          // If a new ticket (session) gets escalated to OPEN, reload from backend
          fetchSessions();
          return prevSessions;
        }
      });
    });
  };

  // Switch active chat room
  const handleSelectSession = async (session: ChatSession) => {
    // Leave previous room if any
    if (socketRef.current && selectedSession) {
      socketRef.current.emit("leave_session", { sessionId: selectedSession.id });
    }

    setSelectedSession(session);
    setMessages([]);

    try {
      const { data } = await api.get(`/chat/sessions/${session.id}`);
      setMessages(data.messages);

      // Join room for this specific chat
      if (socketRef.current) {
        if (socketRef.current.connected) {
          socketRef.current.emit("join_session", { sessionId: session.id });
        } else {
          socketRef.current.once("connect", () => {
            socketRef.current?.emit("join_session", { sessionId: session.id });
          });
          socketRef.current.emit("join_session", { sessionId: session.id });
        }

        // Listen to live messages in this room
        socketRef.current.off("new_message"); // clear old listeners
        socketRef.current.on("new_message", (message: any) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev;
            return [...prev, message];
          });
        });

        // Listen for session resolution inside room
        socketRef.current.off("session_updated");
        socketRef.current.on("session_updated", (statusData: any) => {
          if (statusData.status === "RESOLVED") {
            setMessages((prev) => [...prev, statusData.message]);
            setSelectedSession((prevSession: any) =>
              prevSession ? { ...prevSession, status: "RESOLVED" } : null
            );
            fetchSessions();
          }
        });
      }
    } catch (e) {
      console.error("Gagal mengambil pesan sesi:", e);
    }
  };

  // Claim/assign ticket to self
  const handleClaimTicket = async () => {
    if (!selectedSession) return;
    try {
      const { data } = await api.patch(`/chat/sessions/${selectedSession.id}/assign`);
      setSelectedSession(data);
      fetchSessions();
      setToastMessage({
        title: "Tiket Diambil Alih",
        message: `Anda sekarang menangani tiket milik ${selectedSession.user.name}.`
      });
    } catch (e) {
      console.error("Gagal mengklaim tiket:", e);
    }
  };

  // Resolve/close ticket
  const handleResolveTicket = async () => {
    if (!selectedSession) return;
    try {
      const { data } = await api.patch(`/chat/sessions/${selectedSession.id}/resolve`);
      setSelectedSession(data);
      fetchSessions();
    } catch (e) {
      console.error("Gagal menyelesaikan tiket:", e);
    }
  };

  // Send message
  const handleSendMessage = () => {
    if (!inputValue.trim() || !selectedSession || !socketRef.current) return;

    // Optimistic UI Update
    const newMessage = {
      id: "temp_" + Date.now().toString(),
      content: inputValue.trim(),
      senderRole: "CS",
      senderName: user?.name,
      senderId: user?.id,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);

    socketRef.current.emit("send_message", {
      sessionId: selectedSession.id,
      content: inputValue.trim(),
    });

    setInputValue("");
  };

  // Filtering Logic
  const filteredSessions = sessions.filter((s) => {
    // 1. Search term match (User Name or Email)
    const matchesSearch =
      s.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.user.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Tab Filter
    if (activeTab === "ALL") return true;
    if (activeTab === "OPEN") return s.status === "OPEN" && s.assignedToId === null;
    if (activeTab === "MY") return s.status === "OPEN" && s.assignedToId === user?.id;
    if (activeTab === "RESOLVED") return s.status === "RESOLVED";

    return true;
  });

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 font-sans">

      {/* 1. Left Panel: Ticket Queue List */}
      <div className="w-96 bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-sm">

        {/* Header Search & Title */}
        <div className="p-5 border-b border-border space-y-4 bg-muted/20">
          <div>
            <h2 className="text-lg font-bold text-foreground leading-tight tracking-tight flex items-center gap-2">
              <Headset className="w-5 h-5 text-primary" /> Ruang Bantuan CS
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Kelola & selesaikan pengaduan warga secara real-time.</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari warga atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 bg-background border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl outline-none transition-all"
            />
          </div>
        </div>

        {/* Navigation Filter Tabs */}
        <div className="flex border-b border-border bg-muted/10 text-xs px-2 pt-2 gap-1">
          {[
            { id: "OPEN", label: "Antrean", icon: Inbox },
            { id: "MY", label: "Ditangani Saya", icon: UserCheck },
            { id: "RESOLVED", label: "Selesai", icon: CheckCircle },
            { id: "ALL", label: "Semua", icon: Inbox },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2.5 font-bold rounded-t-xl transition-all cursor-pointer ${activeTab === tab.id
                ? "bg-background text-primary border-t-2 border-primary"
                : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                }`}
            >
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Ticket List Scroll Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-muted/10">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" /> Memuat tiket...
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mb-2 text-muted-foreground/50" />
              <p className="text-xs font-bold">Tidak ada tiket</p>
              <p className="text-[10px] max-w-[80%] mt-0.5">Belum ada obrolan bantuan warga di kategori ini.</p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const latestMsg = session.messages[session.messages.length - 1];
              const isSelected = selectedSession?.id === session.id;

              return (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col gap-2 relative ${isSelected
                    ? "bg-primary/5 border-primary shadow-sm"
                    : "bg-card border-border hover:bg-muted/10 hover:border-primary/30"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground truncate max-w-[70%] tracking-tight">
                      {session.user.name}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${session.status === "OPEN"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      }`}>
                      {session.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground truncate italic">
                    {latestMsg ? latestMsg.content : "Memulai sesi obrolan..."}
                  </p>

                  <div className="flex items-center justify-between mt-1 text-[9px] text-muted-foreground font-semibold">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground/50" />
                      {new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {session.assignedTo ? (
                      <span className="text-[9px] font-bold text-primary">CS: {session.assignedTo.name}</span>
                    ) : (
                      <span className="text-[9px] font-bold text-destructive">Belum Ditugaskan</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Right Panel: Active Chat Screen */}
      <div className="flex-1 bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-sm">
        <AnimatePresence mode="wait">
          {!selectedSession ? (
            // Empty State view when no session selected
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-muted/5"
            >
              <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4 border border-primary/10 animate-bounce">
                <Headset className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Pilih Sesi Obrolan Bantuan</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">Pilih salah satu tiket pengaduan warga di daftar antrean kiri untuk memulai live chat interaktif.</p>
            </motion.div>
          ) : (
            // Active Chat Screen
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col h-full"
            >
              {/* Header Active Chat */}
              <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-foreground leading-tight tracking-tight">{selectedSession.user.name}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{selectedSession.user.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Claim ticket button if unassigned */}
                  {!selectedSession.assignedToId && selectedSession.status === "OPEN" && (
                    <button
                      onClick={handleClaimTicket}
                      className="text-xs font-bold bg-primary hover:bg-primary/95 text-primary-foreground px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      Ambil Alih Tiket
                    </button>
                  )}

                  {/* Resolve ticket button if OPEN */}
                  {selectedSession.status === "OPEN" && (
                    <button
                      onClick={handleResolveTicket}
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-white dark:text-emerald-400 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5 border dark:border-emerald-500/30"
                    >
                      <CheckCircle className="w-4 h-4" /> Selesaikan Tiket
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Message Box Scroll area */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-muted/5 scrollbar-thin">
                {messages.map((msg, index) => {
                  const isAgent = msg.senderId === user?.id;
                  const isSystem = msg.senderRole === "BOT" && msg.senderName === "Sistem";

                  if (isSystem) {
                    return (
                      <div key={msg.id || index} className="flex justify-center my-3">
                        <div className="bg-muted border border-border px-4 py-2 rounded-2xl text-[11px] text-muted-foreground text-center font-medium max-w-[80%] shadow-sm">
                          {msg.content}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex gap-3 max-w-[80%] ${isAgent ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${isAgent ? "bg-primary text-primary-foreground" : msg.senderRole === "BOT" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground border border-border"}`}>
                        {isAgent ? <User className="w-4 h-4" /> : msg.senderRole === "BOT" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div className="space-y-1">
                        <div className={`text-[10px] text-muted-foreground font-bold px-1 ${isAgent ? "text-right" : "text-left"}`}>
                          {msg.senderName} <span className="text-[8px] uppercase px-1 py-px bg-muted rounded font-bold">{msg.senderRole}</span>
                        </div>
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${isAgent
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-card border border-border text-foreground rounded-tl-none"
                            }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Bar Footer */}
              <div className="p-4 border-t border-border bg-card">
                {selectedSession.status === "RESOLVED" ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Sesi bantuan ini telah diselesaikan. Chat ditutup untuk warga.
                  </div>
                ) : !selectedSession.assignedToId ? (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3.5 text-center text-xs font-bold text-destructive">
                    Tiket ini belum diambil alih. Klik tombol "Ambil Alih Tiket" di atas untuk membalas obrolan warga.
                  </div>
                ) : selectedSession.assignedToId !== user?.id ? (
                  <div className="bg-muted/50 border border-border rounded-xl p-3.5 text-center text-xs font-bold text-muted-foreground">
                    Tiket obrolan sedang ditangani oleh CS Agen lain ({selectedSession.assignedTo?.name}).
                  </div>
                ) : (
                  <div className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Tulis balasan pesan untuk warga..."
                      className="flex-1 text-xs bg-muted/50 border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 px-4 py-3 rounded-xl outline-none transition-all"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim()}
                      className="p-3 bg-primary text-primary-foreground disabled:opacity-50 rounded-xl hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
                    >
                      <Send className="w-4 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast Notification Popup */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 bg-card border border-border shadow-2xl rounded-2xl p-4 max-w-sm flex gap-3 z-50 items-start"
          >
            <div className="bg-primary/10 p-2 rounded-full flex-shrink-0 text-primary">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">{toastMessage.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{toastMessage.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
