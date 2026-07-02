const jwt = require("jsonwebtoken");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { detectRestrictedContent, isParticipant, createMessageAndNotify } = require("../services/messages.service");

function initSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("Authentication error"));
    }
  });

  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    const uid = socket.userId;

    socket.join(uid);

    const prevCount = onlineUsers.get(uid) ?? 0;
    onlineUsers.set(uid, prevCount + 1);

    if (prevCount === 0) {
      socket.broadcast.emit("user_online", { userId: uid });
    }

    socket.emit("online_users", { userIds: [...onlineUsers.keys()] });

    socket.on("send_message", async ({ conversationId, contenu, imageUrl }) => {
      if (!conversationId || (!contenu?.trim() && !imageUrl)) return;

      const restricted = detectRestrictedContent(contenu);
      if (restricted) {
        socket.emit("message_error", {
          message:
            restricted === "phone"
              ? "Les numéros de téléphone ne sont pas autorisés dans le chat."
              : "Les liens externes ne sont pas autorisés dans le chat.",
        });
        return;
      }

      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;
        if (!isParticipant(conversation, uid)) return;

        await createMessageAndNotify({ io, conversation, senderId: uid, contenu, imageUrl });
      } catch (err) {
        socket.emit("message_error", { message: err.message });
      }
    });

    socket.on("mark_read", async ({ conversationId }) => {
      if (!conversationId) return;

      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;
        if (!isParticipant(conversation, uid)) return;

        const result = await Message.updateMany(
          { conversationId, expediteurId: { $ne: uid }, lu: false },
          { lu: true }
        );

        if (result.modifiedCount > 0) {
          const senderId =
            conversation.locataireId.toString() === uid
              ? conversation.proprietaireId.toString()
              : conversation.locataireId.toString();

          io.to(senderId).emit("messages_read", { conversationId });
        }
      } catch (err) {
        console.error("[Socket] mark_read error:", err.message);
      }
    });

    socket.on("disconnect", () => {
      const count = (onlineUsers.get(uid) ?? 1) - 1;
      if (count <= 0) {
        onlineUsers.delete(uid);
        socket.broadcast.emit("user_offline", { userId: uid });
      } else {
        onlineUsers.set(uid, count);
      }
    });
  });

  return onlineUsers;
}

module.exports = { initSocket };
