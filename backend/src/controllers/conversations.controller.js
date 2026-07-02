const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Materiel = require("../models/Materiel");
const { validationResult } = require("express-validator");
const { detectRestrictedContent, isParticipant, createMessageAndNotify } = require("../services/messages.service");


async function getOrCreateConversation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const { materielId } = req.body;
    const locataireId = req.user.id;

    const materiel = await Materiel.findById(materielId).select("proprietaireId nom");
    if (!materiel) {
      return res.status(404).json({ success: false, message: "Matériel introuvable" });
    }

    const proprietaireId = materiel.proprietaireId.toString();

    if (proprietaireId === locataireId) {
      return res.status(400).json({ success: false, message: "Vous ne pouvez pas vous envoyer un message" });
    }

    let conversation = await Conversation.findOne({ materielId, locataireId, proprietaireId });

    if (!conversation) {
      conversation = await Conversation.create({ materielId, locataireId, proprietaireId });
    }

    await conversation.populate([
      { path: "materielId", select: "nom photos" },
      { path: "locataireId", select: "nom photo" },
      { path: "proprietaireId", select: "nom photo" },
    ]);

    return res.json({ success: true, data: conversation });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}


async function getMyConversations(req, res) {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      $or: [{ locataireId: userId }, { proprietaireId: userId }],
    })
      .populate("materielId", "nom photos")
      .populate("locataireId", "nom photo")
      .populate("proprietaireId", "nom photo")
      .sort({ dernierMsgAt: -1 });

    const results = await Promise.all(
      conversations.map(async (conv) => {
        const [unreadCount, lastMessage] = await Promise.all([
          Message.countDocuments({
            conversationId: conv._id,
            expediteurId: { $ne: userId },
            lu: false,
          }),
          Message.findOne({ conversationId: conv._id })
            .sort({ createdAt: -1 })
            .select("contenu createdAt expediteurId"),
        ]);
        return { ...conv.toObject(), unreadCount, lastMessage };
      })
    );

    return res.json({ success: true, data: results });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}


async function getMessages(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation introuvable" });
    }

    if (!isParticipant(conversation, userId)) {
      return res.status(403).json({ success: false, message: "Accès refusé" });
    }

    const messages = await Message.find({ conversationId: id })
      .populate("expediteurId", "nom photo")
      .sort({ createdAt: 1 });

    const updated = await Message.updateMany(
      { conversationId: id, expediteurId: { $ne: userId }, lu: false },
      { $set: { lu: true } }
    );

    
    if (updated.modifiedCount > 0) {
      const senderId =
        conversation.locataireId.toString() === userId
          ? conversation.proprietaireId.toString()
          : conversation.locataireId.toString();

      const io = req.app.get("io");
      if (io) io.to(senderId).emit("messages_read", { conversationId: id });
    }

    return res.json({ success: true, data: messages });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}


async function sendMessage(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const { id } = req.params;
    const { contenu, imageUrl } = req.body;
    const userId = req.user.id;

    if (!contenu?.trim() && !imageUrl) {
      return res.status(400).json({ success: false, message: "Le message est vide" });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation introuvable" });
    }

    if (!isParticipant(conversation, userId)) {
      return res.status(403).json({ success: false, message: "Accès refusé" });
    }

    if (contenu?.trim()) {
      const restricted = detectRestrictedContent(contenu);
      if (restricted) {
        return res.status(400).json({
          success: false,
          message:
            restricted === "phone"
              ? "Les numéros de téléphone ne sont pas autorisés dans le chat."
              : "Les liens externes ne sont pas autorisés dans le chat.",
        });
      }
    }

    const io = req.app.get("io");
    const message = await createMessageAndNotify({ io, conversation, senderId: userId, contenu, imageUrl });

    return res.status(201).json({ success: true, data: message });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { getOrCreateConversation, getMyConversations, getMessages, sendMessage };
