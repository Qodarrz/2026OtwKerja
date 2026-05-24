"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, Headset, LogIn, Loader2, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import { io, Socket } from "socket.io-client";
import Link from "next/link";

interface Message {
  id?: string;
  senderName: string;
  senderRole: string; // 'BOT' | 'USER' | 'ADMIN'
  content: string;
  createdAt: Date;
}

export function ChatWidget() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Load session from backend if logged in and widget is open
  useEffect(() => {
    if (!isAuthenticated || !isOpen) {
      // Close socket when widget closes
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const initChatSession = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.post("/chat/sessions");
        setSession(data);
        setIsEscalated(data.status === "OPEN");

        // Parse dates
        const formattedMessages = data.messages.map((m: any) => ({
          ...m,
          createdAt: new Date(m.createdAt),
        }));
        setMessages(formattedMessages);
        setUnreadCount(0);

        if (data.status === "OPEN" || data.status === "BOT") {
          connectWebSocket(data.id);
        }
      } catch (e) {
        console.error("Gagal memuat sesi chat:", e);
      } finally {
        setIsLoading(false);
      }
    };

    initChatSession();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, isOpen]);

  // Socket connection helper
  const connectWebSocket = (sessionId: string) => {
    if (socketRef.current) return;

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    if (socket.connected) {
      socket.emit("join_session", { sessionId });
    }

    socket.on("connect", () => {
      socket.emit("join_session", { sessionId });
    });

    socket.on("new_message", (message: any) => {
      setMessages((prev) => {
        // Prevent duplicate messages if already in state
        if (prev.some((m) => m.id === message.id)) return prev;
        return [
          ...prev,
          {
            ...message,
            createdAt: new Date(message.createdAt),
          },
        ];
      });

      // Increase unread count if chat widget is closed
      if (!isOpen) {
        setUnreadCount((c) => c + 1);
      }
    });

    socket.on("session_updated", (data: any) => {
      if (data.status === "RESOLVED") {
        setIsEscalated(false);
        setMessages((prev) => [
          ...prev,
          {
            ...data.message,
            createdAt: new Date(data.message.createdAt),
          },
        ]);
        setSession((prevSession: any) =>
          prevSession ? { ...prevSession, status: "RESOLVED" } : null
        );
      } else if (data.status === "OPEN" && data.message) {
        // Appends the system message (e.g. "Staff joined the chat")
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [
            ...prev,
            {
              ...data.message,
              createdAt: new Date(data.message.createdAt),
            },
          ];
        });
      }
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err);
    });
  };

  const handleEscalateToCS = async () => {
    if (!isAuthenticated) {
      setMessages((prev) => [
        ...prev,
        {
          senderName: "Virtual Assistant",
          senderRole: "BOT",
          content: "Mohon masuk (login) terlebih dahulu untuk terhubung ke staf Customer Service kami.",
          createdAt: new Date(),
        },
      ]);
      return;
    }

    setIsLoading(true);
    try {
      let targetSessionId = session?.id;

      // If the current session is resolved, create a new one first before escalating
      if (!session || session.status === "RESOLVED") {
        const { data: newSession } = await api.post("/chat/sessions");
        setSession(newSession);
        targetSessionId = newSession.id;
      }

      const { data } = await api.patch(`/chat/sessions/${targetSessionId}/escalate`);
      setSession(data);
      setIsEscalated(true);

      const formattedMessages = data.messages.map((m: any) => ({
        ...m,
        createdAt: new Date(m.createdAt),
      }));
      setMessages(formattedMessages);

      connectWebSocket(data.id);
    } catch (e) {
      console.error("Gagal melakukan eskalasi:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetQuestion = (question: string, answer: string) => {
    // 1. Add user question to screen locally
    const userMsg: Message = {
      senderName: user?.name || "Citizen",
      senderRole: "USER",
      content: question,
      createdAt: new Date(),
    };

    // 2. Add bot answer
    const botMsg: Message = {
      senderName: "Virtual Assistant",
      senderRole: "BOT",
      content: answer,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Send through WebSocket (Backend handles both CS and AI Bot replies)
    if (socketRef.current && session) {
      socketRef.current.emit("send_message", {
        sessionId: session.id,
        content: inputValue.trim(),
      });
      setInputValue("");
    } else {
      // Fallback if socket disconnected
      const userMsg: Message = {
        senderName: user?.name || "Citizen",
        senderRole: "USER",
        content: inputValue.trim(),
        createdAt: new Date(),
      };

      const botReply: Message = {
        senderName: "Virtual Assistant",
        senderRole: "BOT",
        content: "Koneksi terputus. Silakan muat ulang halaman.",
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMsg, botReply]);
      setInputValue("");
    }
  };

  const presetOptions = [
    {
      title: "Cara mendaftar Izin Bangunan (IMB)",
      question: "Bagaimana cara mendaftar IMB?",
      answer: "Untuk mendaftar Izin Mendirikan Bangunan (IMB), Anda perlu membuka portal Anda, lalu klik menu 'Pengajuan Baru', pilih 'Building Permit'. Isi formulir lengkap terkait detail lokasi tanah, luas lahan, tinggi bangunan, dan unggah dokumen persyaratan seperti KTP dan Sertifikat Hak Milik.",
    },
    {
      title: "Cara mendaftar Izin Usaha Mikro (IUMK)",
      question: "Bagaimana cara mendaftar IUMK?",
      answer: "Untuk mendaftar Izin Usaha Mikro (IUMK), pilih kategori 'Business License' di halaman Pengajuan Baru. Lengkapi data badan usaha, nama komersial, jenis industri, lokasi operasional, dan estimasi total karyawan.",
    },
    {
      title: "Berapa lama durasi SLA verifikasi?",
      question: "Berapa lama durasi SLA verifikasi berkas?",
      answer: "Proses verifikasi dibagi menjadi tiga tahap SLA utama: 1) Document Check memakan waktu maksimal 24 jam. 2) Field Inspection (peninjauan lokasi lapangan) maksimal 48 jam. 3) Legalization (pengesahan) memakan waktu maksimal 24 jam.",
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Chat Bubble Button */}
      <motion.button
        onClick={() => {
          setIsOpen(!isOpen);
          setUnreadCount(0);
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-primary/95 transition-all hover:shadow-primary/20"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}

        {/* Unread Message Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-destructive border border-background text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </motion.button>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-18 right-0 w-96 h-130 bg-card/95 border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Chat Header */}
            <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">

                <div>
                  <h4 className="font-bold text-sm leading-tight">FlowGov Asisten</h4>
                  <p className="text-[10px] text-primary-foreground/80 font-bold uppercase tracking-wider">Virtual Support</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-primary-foreground/10 rounded-full transition-all text-primary-foreground/80 hover:text-primary-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Message List Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-muted/30 scrollbar-thin">
              {messages.map((msg, index) => {
                const isUser = msg.senderRole === "USER";
                const isSystem = msg.senderRole === "BOT" && msg.senderName === "Sistem";

                if (isSystem) {
                  return (
                    <div key={index} className="flex justify-center my-2">
                      <div className="bg-muted border border-border px-3 py-1.5 rounded-xl text-[11px] text-muted-foreground text-center font-medium max-w-[85%] shadow-sm">
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={index}
                    className={`flex gap-2.5 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                  >
                    {!isUser && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${msg.senderRole === "BOT"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground border border-border"
                        }`}>
                        {msg.senderRole === "BOT" ? <Bot className="w-4 h-4" /> : <Headset className="w-4 h-4" />}
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className={`text-[10px] text-muted-foreground font-bold tracking-tight px-1 ${isUser ? "text-right" : "text-left"}`}>
                        {msg.senderName}
                      </div>
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${isUser
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

              {isLoading && (
                <div className="flex gap-2 max-w-[80%] items-center text-muted-foreground text-xs py-2 px-1">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Sedang memuat...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Action Preset Options Panel */}
            {!isEscalated && (
              <div className="p-2.5 border-t border-border bg-card/60 flex flex-col gap-1.5">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider px-1">Pertanyaan Populer</p>

                {/* Horizontal Slider for Presets */}
                <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide px-1">
                  {presetOptions.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handlePresetQuestion(opt.question, opt.answer)}
                      className="whitespace-nowrap flex-shrink-0 text-[11px] bg-muted hover:bg-accent hover:text-accent-foreground border border-border hover:border-accent-foreground/20 px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer font-medium text-foreground shadow-sm"
                    >
                      {opt.title}
                    </button>
                  ))}
                </div>

                {/* CS Escalation Button */}
                <button
                  onClick={handleEscalateToCS}
                  className="w-full mt-0.5 flex items-center justify-center gap-1.5 text-[11px] bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold px-3 py-2 rounded-xl transition-all shadow-sm border border-border cursor-pointer"
                >
                  <Headset className="w-3.5 h-3.5" /> Hubungi Customer Service
                </button>
              </div>
            )}

            {/* Inactive Resolved State Panel (Removed for seamless transition) */}

            {/* Login Prompt for Guests */}
            {!isAuthenticated && (
              <div className="p-4 border-t border-border bg-card text-center space-y-3">
                <p className="text-xs text-muted-foreground font-medium">Log in ke FlowGov untuk mengakses live chat bersama staf Customer Service kami.</p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 justify-center text-xs bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-xl w-full hover:bg-primary/90 transition-all shadow-sm"
                >
                  <LogIn className="w-4 h-4" /> Log In Sekarang
                </Link>
              </div>
            )}

            {/* Chat Text Input Bar */}
            {isAuthenticated && (
              <div className="p-3 border-t border-border bg-card flex gap-2 items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder={
                    isEscalated
                      ? "Ketik pesan ke Customer Service..."
                      : "Ketik pesan untuk asisten virtual..."
                  }
                  className="flex-1 text-xs bg-muted/50 border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 px-3.5 py-2.5 rounded-xl outline-none transition-all"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="p-2.5 bg-primary text-primary-foreground disabled:bg-muted disabled:text-muted-foreground rounded-xl hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
