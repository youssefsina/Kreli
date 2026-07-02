const Litige = require("../models/Litige");
const Location = require("../models/Location");
const Materiel = require("../models/Materiel");
const Notification = require("../models/Notification");
const { body } = require("express-validator");
const validate = require("../utils/validate");


exports.getAllLitiges = async (req, res) => {
  try {
    const { statut, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (statut) filter.statut = statut;

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Litige.find(filter)
        .populate("ouvertPar", "nom email photo")
        .populate("adminId", "nom")
        .populate({
          path: "locationId",
          select: "materielId locataireId dateDebut dateFinPrevue statut montantLocation",
          populate: [
            { path: "materielId", select: "nom photos" },
            { path: "locataireId", select: "nom email" },
          ],
        })
        .sort({ openedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Litige.countDocuments(filter),
    ]);

    res.json({
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};


exports.getLitige = async (req, res) => {
  try {
    const litige = await Litige.findById(req.params.id)
      .populate("ouvertPar", "nom email photo telephone")
      .populate("adminId", "nom")
      .populate({
        path: "locationId",
        populate: [
          { path: "materielId", select: "nom photos prixParJour" },
          { path: "locataireId", select: "nom email telephone" },
        ],
      });
    if (!litige) return res.status(404).json({ message: "Litige non trouvé" });
    res.json({ data: litige });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};


exports.updateLitigeStatus = async (req, res) => {
  try {
    const { statut, decisionAdmin } = req.body;
    const validStatuts = ["ouvert", "en_cours", "cloture"];
    if (statut && !validStatuts.includes(statut)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    const update = { adminId: req.user._id };
    if (statut) update.statut = statut;
    if (decisionAdmin !== undefined) update.decisionAdmin = decisionAdmin;
    if (statut === "cloture") update.closedAt = new Date();

    const litige = await Litige.findByIdAndUpdate(req.params.id, { $set: update }, { new: true })
      .populate("ouvertPar", "nom email")
      .populate({
        path: "locationId",
        populate: [
          { path: "materielId", select: "nom" },
          { path: "locataireId", select: "nom email" },
        ],
      });

    if (!litige) return res.status(404).json({ message: "Litige non trouvé" });


    if (statut === "cloture" && decisionAdmin) {
      const location = litige.locationId;
      const isLocataire = location?.locataireId?._id?.toString() === litige.ouvertPar._id.toString();
      const dashboardPrefix = isLocataire ? "/dashboard/locataire" : "/dashboard/proprietaire";
      const lienRedirection = location
        ? `${dashboardPrefix}/locations?statut=${location.statut}`
        : null;

      const notification = await Notification.create({
        destinataireId: litige.ouvertPar._id,
        type: "litige",
        titre: "Décision sur votre litige",
        contenu: decisionAdmin.slice(0, 120),
        lienRedirection,
      });

      req.app.get("io").to(litige.ouvertPar._id.toString()).emit("new_notification", { notification });
    }

    res.json({ message: "Litige mis à jour", data: litige });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};


exports.getLitigesStats = async (req, res) => {
  try {
    const [total, ouverts, enCours, clotures] = await Promise.all([
      Litige.countDocuments(),
      Litige.countDocuments({ statut: "ouvert" }),
      Litige.countDocuments({ statut: "en_cours" }),
      Litige.countDocuments({ statut: "cloture" }),
    ]);
    res.json({ data: { total, ouverts, enCours, clotures } });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};


exports.createLitige = [
  body("locationId").isMongoId().withMessage("ID location invalide"),
  body("description").trim().isLength({ min: 10 }).withMessage("Description requise (10 caractères min)"),
  validate,
  async (req, res) => {
    try {
      const { locationId, description } = req.body;
      const userId = req.user._id;

      const location = await Location.findById(locationId);
      if (!location) return res.status(404).json({ message: "Location non trouvée" });

      const materiel = await Materiel.findById(location.materielId).select("proprietaireId");
      const isLocataire = location.locataireId.toString() === userId.toString();
      const isProprietaire = materiel?.proprietaireId.toString() === userId.toString();
      if (!isLocataire && !isProprietaire) return res.status(403).json({ message: "Accès refusé" });

      if (!["acceptee", "en_cours", "terminee", "en_retard"].includes(location.statut)) {
        return res.status(400).json({ message: "Impossible d'ouvrir un litige pour cette location" });
      }

      const existing = await Litige.findOne({ locationId, statut: { $ne: "cloture" } });
      if (existing) return res.status(400).json({ message: "Un litige est déjà ouvert pour cette location" });

      const litige = await Litige.create({ locationId, ouvertPar: userId, description });

      res.status(201).json({ message: "Litige ouvert", data: litige });
    } catch (err) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  },
];


exports.getMyLitiges = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      Litige.find({ ouvertPar: req.user._id })
        .populate({
          path: "locationId",
          select: "materielId dateDebut statut montantLocation",
          populate: { path: "materielId", select: "nom photos" },
        })
        .sort({ openedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Litige.countDocuments({ ouvertPar: req.user._id }),
    ]);

    res.json({ data, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};
