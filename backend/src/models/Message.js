const { Schema, model } = require("mongoose");

const messageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    expediteurId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    contenu: { type: String, default: "", trim: true },
    imageUrl: { type: String, default: null },
    lu: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "messages" }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ conversationId: 1, lu: 1 });
messageSchema.index({ expediteurId: 1 });
messageSchema.index({ receiverId: 1 });

module.exports = model("Message", messageSchema);
