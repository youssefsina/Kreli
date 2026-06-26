"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getMyConversations,
  getConversationMessages,
  uploadMaterielImage,
  type Conversation,
  type ChatMessage,
} from "@/lib/api";
import { getSocket } from "@/hooks/useSocket";
import { Send, Search, Package, Check, CheckCheck, Camera, AlertCircle, Loader2 } from "lucide-react";



function detectRestrictedContent(text: string): "phone" | "link" | null {
  const urlPattern = /\b(https?:\/\/|www\.)\S|\b\S+\.(com|net|org|io|ma|fr|info|co)\b/i;
  const phonePattern = /(\+?[\d][\s\-\.]{0,2}){7,}\d/;
  if (urlPattern.test(text)) return "link";
  if (phonePattern.test(text)) return "phone";
  return null;
}



function initials(nom: string) {
  return nom
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?";
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  const diffH = (Date.now() - d.getTime()) / 3_600_000;
  if (diffH < 24) return d.toLocaleTimeString("fr-MA", { hour: "2-digit", minute: "2-digit" });
  if (diffH < 168) return d.toLocaleDateString("fr-MA", { weekday: "short" });
  return d.toLocaleDateString("fr-MA", { day: "2-digit", month: "short" });
}

function dayLabel(iso: string) {
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (diffDays === 0) return "AUJOURD'HUI";
  if (diffDays === 1) return "HIER";
  return new Date(iso)
    .toLocaleDateString("fr-MA", { weekday: "long", day: "numeric", month: "long" })
    .toUpperCase();
}

function groupByDay(msgs: ChatMessage[]) {
  const groups: { day: string; messages: ChatMessage[] }[] = [];
  let lastDay = "";
  for (const msg of msgs) {
    const day = new Date(msg.createdAt).toDateString();
    if (day !== lastDay) {
      groups.push({ day: dayLabel(msg.createdAt), messages: [msg] });
      lastDay = day;
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }
  return groups;
}



function Avatar({
  nom,
  photo,
  size = 40,
  active = false,
}: {
  nom: string;
  photo?: string;
  size?: number;
  active?: boolean;
}) {
  return (
    <div
      className="relative shrink-0 flex items-center justify-center overflow-hidden rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: active ? "#F97316" : "#0F172A",
      }}
    >
      {photo ? (
        <Image src={photo} alt={nom} width={size} height={size} className="object-cover" />
      ) : (
        initials(nom)
      )}
    </div>
  );
}



export default function MessagesView() {
  const { user, token } = useAuth();
  const searchParams = useSearchParams();
  const convParam = searchParams.get("conv");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoOpenedRef = useRef(false);

  
  useEffect(() => {
    if (!user) return;
    getMyConversations()
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  
  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    socket.on(
      "receive_message",
      ({ conversationId, message }: { conversationId: string; message: ChatMessage }) => {
        setMessages((prev) => {
          if (activeConv?._id !== conversationId) return prev;
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        setConversations((prev) =>
          prev.map((c) =>
            c._id === conversationId
              ? {
                  ...c,
                  lastMessage: message,
                  dernierMsgAt: message.createdAt,
                  unreadCount:
                    activeConv?._id === conversationId
                      ? 0
                      : c.unreadCount + (message.expediteurId._id !== user?._id ? 1 : 0),
                }
              : c
          )
        );
      }
    );
    socket.on("message_error", ({ message }: { message: string }) => {
      setInputError(message);
    });
    return () => {
      socket.off("receive_message");
      socket.off("message_error");
    };
  }, [token, activeConv, user]);

  
  const openConversation = useCallback(
    async (conv: Conversation) => {
      setActiveConv(conv);
      setMessages([]);
      try {
        const msgs = await getConversationMessages(conv._id);
        setMessages(msgs);
        setConversations((prev) =>
          prev.map((c) => (c._id === conv._id ? { ...c, unreadCount: 0 } : c))
        );
        if (token) getSocket(token).emit("mark_read", { conversationId: conv._id });
      } catch {}
      setTimeout(() => inputRef.current?.focus(), 80);
    },
    [token]
  );

  
  useEffect(() => {
    if (autoOpenedRef.current || !convParam || conversations.length === 0) return;
    const target = conversations.find((c) => c._id === convParam);
    if (target) {
      autoOpenedRef.current = true;
      openConversation(target);
    }
  }, [convParam, conversations, openConversation]);

  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  
  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !activeConv || !token) return;

    const restricted = detectRestrictedContent(input.trim());
    if (restricted) {
      setInputError(
        restricted === "phone"
          ? "Les numéros de téléphone ne sont pas autorisés dans le chat."
          : "Les liens externes ne sont pas autorisés dans le chat."
      );
      return;
    }

    setInputError(null);
    setSending(true);
    getSocket(token).emit("send_message", { conversationId: activeConv._id, contenu: input.trim() });
    setInput("");
    setSending(false);
  }

  
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeConv || !token) return;
    e.target.value = "";
    setUploadingImage(true);
    try {
      const imageUrl = await uploadMaterielImage(file);
      getSocket(token).emit("send_message", { conversationId: activeConv._id, contenu: "", imageUrl });
    } catch {
      setInputError("Échec de l'envoi de l'image. Réessayez.");
    } finally {
      setUploadingImage(false);
    }
  }

  function getOther(conv: Conversation) {
    return conv.locataireId._id === user?._id ? conv.proprietaireId : conv.locataireId;
  }

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    const other = getOther(c);
    return other.nom.toLowerCase().includes(q) || c.materielId.nom.toLowerCase().includes(q);
  });

  const grouped = groupByDay(messages);
  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  
  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 80px)",
        margin: "20px 24px",
        borderRadius: 20,
        border: "1px solid #E2E8F0",
        overflow: "hidden",
        background: "#FFFFFF",
        boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
      }}
    >
      
      <aside
        style={{
          width: 320,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          background: "#F8FAFC",
          borderRight: "1px solid #E2E8F0",
        }}
      >
        
        <div
          style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2
              style={{
                fontFamily: "inherit",
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: "-0.03em",
                color: "#0F172A",
                margin: 0,
              }}
            >
              Messages
            </h2>
            {totalUnread > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  background: "#F97316",
                  color: "#FFFFFF",
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "0 5px",
                  fontFamily: "inherit",
                }}
              >
                {totalUnread}
              </span>
            )}
          </div>

          
          <div style={{ marginTop: 12, position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 13,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94A3B8",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                background: "#F1F5F9",
                border: "none",
                borderRadius: 99,
                padding: "9px 14px 9px 34px",
                fontSize: 13,
                color: "#0F172A",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#F1F5F9", animation: "pulse 1.5s ease-in-out infinite" }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ height: 12, width: "55%", borderRadius: 6, background: "#F1F5F9", animation: "pulse 1.5s ease-in-out infinite" }} />
                    <div style={{ height: 10, width: "80%", borderRadius: 6, background: "#F1F5F9", animation: "pulse 1.5s ease-in-out infinite" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "64px 24px", textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: "#F1F5F9", display: "grid", placeItems: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(10,10,9,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p style={{ fontSize: 13, color: "#64748B", margin: 0, fontWeight: 500 }}>
                {search ? "Aucune conversation trouvée" : "Aucune conversation"}
              </p>
            </div>
          ) : (
            <div style={{ padding: "8px 0" }}>
              {filtered.map((conv) => {
                const other = getOther(conv);
                const isActive = activeConv?._id === conv._id;
                return (
                  <button
                    key={conv._id}
                    onClick={() => openConversation(conv)}
                    style={{
                      display: "flex",
                      width: "100%",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px 12px 17px",
                      textAlign: "left",
                      border: "none",
                      borderLeft: isActive ? "3px solid #F97316" : "3px solid transparent",
                      cursor: "pointer",
                      transition: "background 150ms",
                      background: isActive ? "#FFF7ED" : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "#F1F5F9";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                  >
                    <Avatar nom={other.nom} photo={other.photo} size={40} active={isActive} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#0F172A",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {other.nom}
                        </span>
                        {conv.dernierMsgAt && (
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: "inherit",
                              color: "#94A3B8",
                              flexShrink: 0,
                              letterSpacing: "0.02em",
                            }}
                          >
                            {timeLabel(conv.dernierMsgAt)}
                          </span>
                        )}
                      </div>
                      <div style={{ marginTop: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                        <span
                          style={{
                            fontSize: 12,
                            color: "#94A3B8",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {conv.lastMessage
                            ? (conv.lastMessage.contenu || (conv.lastMessage.imageUrl ? "📷 Photo" : conv.materielId.nom))
                            : conv.materielId.nom}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span
                            style={{
                              flexShrink: 0,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 18,
                              height: 18,
                              borderRadius: 9,
                              background: "#F97316",
                              color: "#FFFFFF",
                              fontSize: 9,
                              fontWeight: 800,
                              fontFamily: "inherit",
                            }}
                          >
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      
      <section style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#FFFFFF" }}>
        {!activeConv ? (
          
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 32, textAlign: "center" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 24,
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                display: "grid",
                placeItems: "center",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(10,10,9,0.18)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>
                Sélectionnez une conversation
              </p>

            </div>
          </div>
        ) : (
          <>
            
            {(() => {
              const other = getOther(activeConv);
              return (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 24px",
                    borderBottom: "1px solid #E2E8F0",
                    background: "#FFFFFF",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar nom={other.nom} photo={other.photo} size={40} />
                    <div>
                      <p
                        style={{
                          fontFamily: "inherit",
                          fontSize: 16,
                          fontWeight: 800,
                          letterSpacing: "-0.025em",
                          color: "#0F172A",
                          margin: 0,
                        }}
                      >
                        {other.nom}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          marginTop: 2,
                          fontFamily: "inherit",
                          fontSize: 10,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          color: "#94A3B8",
                        }}
                      >
                        <Package size={10} />
                        {activeConv.materielId.nom}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px 24px 8px",
                display: "flex",
                flexDirection: "column",
                gap: 24,
              }}
            >
              {messages.length === 0 && (
                <p
                  style={{
                    textAlign: "center",
                    fontSize: 12,
                    fontFamily: "inherit",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: "#94A3B8",
                    marginTop: 32,
                  }}
                >
                  Commencez la conversation…
                </p>
              )}

              {grouped.map((group) => (
                <div key={group.day}>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{ flex: 1, height: 1, background: "#F1F5F9" }} />
                    <span
                      style={{
                        fontFamily: "inherit",
                        fontSize: 9,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#94A3B8",
                        background: "#F1F5F9",
                        borderRadius: 99,
                        padding: "4px 10px",
                      }}
                    >
                      {group.day}
                    </span>
                    <div style={{ flex: 1, height: 1, background: "#F1F5F9" }} />
                  </div>

                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {group.messages.map((msg) => {
                      const isMine = msg.expediteurId._id === user?._id;
                      const other = getOther(activeConv);
                      return (
                        <div
                          key={msg._id}
                          style={{
                            display: "flex",
                            alignItems: "flex-end",
                            gap: 8,
                            flexDirection: isMine ? "row-reverse" : "row",
                          }}
                        >
                          {!isMine && <Avatar nom={other.nom} photo={other.photo} size={28} />}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: isMine ? "flex-end" : "flex-start",
                              maxWidth: "62%",
                            }}
                          >
                            <div
                              style={{
                                background: isMine ? "#0F172A" : "#F8FAFC",
                                color: isMine ? "rgba(255,255,255,0.92)" : "#0F172A",
                                borderRadius: 18,
                                borderBottomRightRadius: isMine ? 4 : 18,
                                borderBottomLeftRadius: isMine ? 18 : 4,
                                padding: msg.imageUrl ? 4 : "10px 16px",
                                fontSize: 14,
                                lineHeight: 1.5,
                                overflow: "hidden",
                              }}
                            >
                              {msg.imageUrl && (
                                
                                <img
                                  src={msg.imageUrl}
                                  alt="photo"
                                  style={{
                                    display: "block",
                                    maxWidth: 260,
                                    maxHeight: 320,
                                    width: "100%",
                                    objectFit: "cover",
                                    borderRadius: 14,
                                  }}
                                />
                              )}
                              {msg.contenu && (
                                <span style={{ display: "block", padding: msg.imageUrl ? "8px 12px 8px" : 0 }}>
                                  {msg.contenu}
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                marginTop: 4,
                                flexDirection: isMine ? "row-reverse" : "row",
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "inherit",
                                  fontSize: 9,
                                  letterSpacing: "0.04em",
                                  color: "#94A3B8",
                                }}
                              >
                                {new Date(msg.createdAt).toLocaleTimeString("fr-MA", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {isMine &&
                                (msg.lu ? (
                                  <CheckCheck size={11} style={{ color: "#F97316" }} />
                                ) : (
                                  <Check size={11} style={{ color: "#94A3B8" }} />
                                ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            
            <div
              style={{
                borderTop: "1px solid #E2E8F0",
                background: "#FFFFFF",
                padding: "16px 24px",
                flexShrink: 0,
              }}
            >
              
              {inputError && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                    padding: "9px 14px",
                    borderRadius: 12,
                    background: "rgba(255,77,0,0.07)",
                    border: "1px solid rgba(255,77,0,0.18)",
                  }}
                >
                  <AlertCircle size={14} style={{ color: "#F97316", flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, color: "#F97316", fontWeight: 500, flex: 1 }}>
                    {inputError}
                  </span>
                  <button
                    type="button"
                    onClick={() => setInputError(null)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#F97316", fontSize: 16, lineHeight: 1, padding: 2 }}
                  >
                    ×
                  </button>
                </div>
              )}

              <form
                onSubmit={sendMessage}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />

                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage || !activeConv}
                  title="Envoyer une photo"
                  style={{
                    flexShrink: 0,
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "#F1F5F9",
                    border: "none",
                    cursor: uploadingImage ? "wait" : "pointer",
                    display: "grid",
                    placeItems: "center",
                    transition: "background 150ms",
                  }}
                >
                  {uploadingImage ? (
                    <Loader2 size={16} style={{ color: "#F97316", animation: "spin 0.8s linear infinite" }} />
                  ) : (
                    <Camera size={16} style={{ color: "#64748B" }} />
                  )}
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (inputError) setInputError(null);
                  }}
                  placeholder="Écrivez votre message…"
                  style={{
                    flex: 1,
                    background: "#F1F5F9",
                    border: "none",
                    borderRadius: 99,
                    padding: "12px 20px",
                    fontSize: 14,
                    color: "#0F172A",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  style={{
                    flexShrink: 0,
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: input.trim() ? "#F97316" : "#E2E8F0",
                    border: "none",
                    cursor: input.trim() ? "pointer" : "not-allowed",
                    display: "grid",
                    placeItems: "center",
                    transition: "background 200ms",
                  }}
                >
                  <Send size={16} style={{ color: input.trim() ? "#FFFFFF" : "#94A3B8" }} />
                </button>
              </form>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
