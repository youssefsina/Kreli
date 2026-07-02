const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");

const PHONE_RE = /(\+?[\d][\s\-.]{0,2}){7,}\d/;
const URL_RE = /\b(https?:\/\/|www\.)\S|\b\S+\.(com|net|org|io|ma|fr|info|co)\b/i;

function detectRestrictedContent(text) {
  if (!text) return null;
  if (URL_RE.test(text)) return "link";
  if (PHONE_RE.test(text)) return "phone";
  return null;
}

function isParticipant(conversation, userId) {
  return (
    conversation.locataireId.toString() === userId.toString() ||
    conversation.proprietaireId.toString() === userId.toString()
  );
}

function getOtherParticipant(conversation, userId) {
  return conversation.locataireId.toString() === userId.toString()
    ? conversation.proprietaireId.toString()
    : conversation.locataireId.toString();
}

// Creates a message on a conversation, updates dernierMsgAt, and — when an
// `io` instance is passed — pushes it to both participants in real time plus
// a notification to the recipient. Shared by the socket "send_message"
// handler and the REST POST /conversations/:id/messages endpoint so the two
// entry points can never drift out of sync with each other.
async function createMessageAndNotify({ io, conversation, senderId, contenu, imageUrl }) {
  const receiverId = getOtherParticipant(conversation, senderId);
  const isLocataireSender = conversation.locataireId.toString() === senderId.toString();

  const message = await Message.create({
    conversationId: conversation._id,
    expediteurId: senderId,
    receiverId,
    contenu: contenu?.trim() ?? "",
    ...(imageUrl && { imageUrl }),
  });

  await Conversation.findByIdAndUpdate(conversation._id, { dernierMsgAt: new Date() });

  const populated = await message.populate("expediteurId", "nom photo");

  if (io) {
    io.to(receiverId).emit("receive_message", { conversationId: conversation._id.toString(), message: populated });
    io.to(senderId.toString()).emit("receive_message", { conversationId: conversation._id.toString(), message: populated });

    const messagesBase = isLocataireSender
      ? "/dashboard/proprietaire/messages"
      : "/dashboard/locataire/messages";

    const notification = await Notification.create({
      destinataireId: receiverId,
      type: "message",
      titre: `Nouveau message de ${populated.expediteurId.nom}`,
      contenu: contenu?.trim() ? contenu.trim().slice(0, 100) : "📷 Photo",
      lienRedirection: `${messagesBase}?conv=${conversation._id}`,
    });

    io.to(receiverId).emit("new_notification", { notification });
  }

  return populated;
}

module.exports = { detectRestrictedContent, isParticipant, getOtherParticipant, createMessageAndNotify };
