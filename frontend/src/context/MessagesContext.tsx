"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { getSocket } from "@/hooks/useSocket";
import { getMyConversations, type Conversation, type ChatMessage } from "@/lib/api";

type MessagesContextType = {
  conversations: Conversation[];
  loading: boolean;
  totalUnread: number;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  markConversationRead: (conversationId: string) => void;
  refresh: () => void;
};

const MessagesContext = createContext<MessagesContextType>({
  conversations: [],
  loading: false,
  totalUnread: 0,
  activeConversationId: null,
  setActiveConversationId: () => {},
  markConversationRead: () => {},
  refresh: () => {},
});

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  activeConversationIdRef.current = activeConversationId;

  const refresh = useCallback(() => {
    if (!user) return;
    setLoading(true);
    getMyConversations()
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (user) refresh();
    else setConversations([]);
  }, [user, refresh]);

  // Keeps the conversation list (last message + unread count) in sync in real time,
  // independently of whatever page is mounted — this is what feeds the sidebar badge.
  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);

    function onReceiveMessage({
      conversationId,
      message,
    }: {
      conversationId: string;
      message: ChatMessage;
    }) {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId
            ? {
                ...c,
                lastMessage: message,
                dernierMsgAt: message.createdAt,
                unreadCount:
                  activeConversationIdRef.current === conversationId
                    ? 0
                    : c.unreadCount + (message.expediteurId._id !== user?._id ? 1 : 0),
              }
            : c
        )
      );
    }

    socket.on("receive_message", onReceiveMessage);
    return () => {
      socket.off("receive_message", onReceiveMessage);
    };
  }, [token, user]);

  const markConversationRead = useCallback(
    (conversationId: string) => {
      setConversations((prev) =>
        prev.map((c) => (c._id === conversationId ? { ...c, unreadCount: 0 } : c))
      );
      if (token) getSocket(token).emit("mark_read", { conversationId });
    },
    [token]
  );

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <MessagesContext.Provider
      value={{
        conversations,
        loading,
        totalUnread,
        activeConversationId,
        setActiveConversationId,
        markConversationRead,
        refresh,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessagesContext(): MessagesContextType {
  return useContext(MessagesContext);
}
