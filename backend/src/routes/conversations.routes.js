const router = require("express").Router();
const { body } = require("express-validator");
const { verifyToken } = require("../middleware/auth.middleware");
const {
  getOrCreateConversation,
  getMyConversations,
  getMessages,
  sendMessage,
} = require("../controllers/conversations.controller");

router.use(verifyToken);


router.get("/", getMyConversations);


router.post(
  "/",
  [body("materielId").isMongoId().withMessage("ID matériel invalide")],
  getOrCreateConversation
);


router.get("/:id/messages", getMessages);


router.post(
  "/:id/messages",
  [
    body("contenu").optional().isString().isLength({ max: 2000 }).withMessage("Message trop long"),
    body("imageUrl").optional().isString(),
  ],
  sendMessage
);

module.exports = router;
