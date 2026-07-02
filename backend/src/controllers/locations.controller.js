const Location = require("../models/Location");
const Materiel = require("../models/Materiel");
const Notification = require("../models/Notification");
const { getCurrentCommissionTaux } = require("../models/CommissionConfig");
const Paiement = require("../models/Paiement");
const { body } = require("express-validator");
const validate = require("../utils/validate");

const findPopulated = (id, locataireSelect = "nom email") =>
  Location.findById(id)
    .populate({ path: "materielId", select: "nom photos localisation prixParJour" })
    .populate("locataireId", locataireSelect);

const emitStatut = (req, room, location, statut) => {
  req.app.get("io").to(room).emit("location_update", { locationId: location._id, statut });
};

const notifyUser = async (req, { destinataireId, type, titre, contenu, lienRedirection }) => {
  const notification = await Notification.create({
    destinataireId,
    type,
    titre,
    contenu,
    lienRedirection,
  });
  req.app.get("io").to(destinataireId.toString()).emit("new_notification", { notification });
};

exports.createLocation = [
  body("materielId").isMongoId().withMessage("ID matériel invalide"),
  body("dateDebut").isISO8601().withMessage("Date début invalide"),
  body("dateFinPrevue").isISO8601().withMessage("Date fin prévue invalide"),
  validate,
  async (req, res) => {
    try {
      const { materielId, dateDebut, dateFinPrevue } = req.body;
      const locId = req.user._id;

      const materiel = await Materiel.findById(materielId).populate("categorieId");
      if (!materiel) return res.status(404).json({ message: "Matériel non trouvé" });
      if (!materiel.disponible) return res.status(400).json({ message: "Matériel non disponible" });
      if (materiel.proprietaireId.toString() === locId.toString()) {
        return res.status(400).json({ message: "Vous ne pouvez pas louer votre propre matériel" });
      }

      const debut = new Date(dateDebut);
      const fin = new Date(dateFinPrevue);
      if (fin <= debut) return res.status(400).json({ message: "La date de fin doit être après la date de début" });

      const nbJours = Math.ceil((fin - debut) / (1000 * 60 * 60 * 24));
      const commissionTaux = await getCurrentCommissionTaux();
      const montantLocation = materiel.prixParJour * nbJours;
      const commissionMontant = montantLocation * (commissionTaux / 100);
      const montantNetProprio = montantLocation - commissionMontant;

      const location = new Location({
        materielId,
        locataireId: locId,
        dateDebut: debut,
        dateFinPrevue: fin,
        nbJours,
        prixParJour: materiel.prixParJour,
        montantLocation,
        cautionMontant: materiel.caution ?? 0,
        commissionTaux,
        commissionMontant,
        montantNetProprio,
        statut: "en_attente",
      });

      await location.save();

      const paiements = [{ locationId: location._id, type: "location", montant: montantLocation, statut: "en_attente" }];
      if ((materiel.caution ?? 0) > 0) {
        paiements.push({ locationId: location._id, type: "caution", montant: materiel.caution, statut: "en_attente" });
      }
      await Paiement.insertMany(paiements);

      await Materiel.findByIdAndUpdate(materielId, { disponible: false });

      const populated = await Location.findById(location._id)
        .populate("materielId", "nom photos")
        .populate("locataireId", "nom email");

      await notifyUser(req, {
        destinataireId: materiel.proprietaireId,
        type: "reservation",
        titre: "Nouvelle demande de location",
        contenu: `${populated.locataireId.nom} souhaite louer "${materiel.nom}".`,
        lienRedirection: "/dashboard/proprietaire/locations?statut=en_attente",
      });

      res.status(201).json({ data: populated });
    } catch (err) {
      console.error("createLocation error:", err);
      res.status(500).json({ message: "Erreur serveur" });
    }
  },
];

exports.getMyLocations = async (req, res) => {
  try {
    const { statut, page = 1, limit = 10 } = req.query;
    const query = { locataireId: req.user._id };
    if (statut) query.statut = statut;

    const locations = await Location.find(query)
      .populate({
        path: "materielId",
        select: "nom photos localisation prixParJour",
        populate: { path: "proprietaireId", select: "nom telephone" },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Location.countDocuments(query);

    res.json({
      data: locations,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("getMyLocations error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id)
      .populate("materielId")
      .populate("locataireId", "nom email telephone");

    if (!location) return res.status(404).json({ message: "Location non trouvée" });

    const canView =
      location.locataireId._id.toString() === req.user._id.toString() ||
      location.materielId.proprietaireId.toString() === req.user._id.toString() ||
      req.user.role === "admin";

    if (!canView) return res.status(403).json({ message: "Accès refusé" });

    res.json({ data: location });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.cancelLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) return res.status(404).json({ message: "Location non trouvée" });

    if (location.locataireId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    if (!["en_attente", "acceptee"].includes(location.statut)) {
      return res.status(400).json({ message: "Impossible d'annuler cette location" });
    }

    location.statut = "annulee";
    await location.save();

    await Materiel.findByIdAndUpdate(location.materielId, { disponible: true });

    const populated = await findPopulated(location._id);

    res.json({ message: "Location annulée", data: populated });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getOwnerLocations = async (req, res) => {
  try {
    const { statut, page = 1, limit = 10 } = req.query;

    const materiels = await Materiel.find({ proprietaireId: req.user._id }).select("_id");
    const materielIds = materiels.map((m) => m._id);

    const query = { materielId: { $in: materielIds } };
    if (statut) query.statut = statut;

    const locations = await Location.find(query)
      .populate({
        path: "materielId",
        select: "nom photos localisation",
      })
      .populate("locataireId", "nom email telephone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Location.countDocuments(query);

    res.json({
      data: locations,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("getOwnerLocations error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const ownerTransition = async (req, res, { from, to, invalidMsg, successMsg, releaseMateriel, notif }) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) return res.status(404).json({ message: "Location non trouvée" });

    const materiel = await Materiel.findById(location.materielId);
    if (materiel.proprietaireId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    if (location.statut !== from) {
      return res.status(400).json({ message: invalidMsg });
    }

    location.statut = to;
    await location.save();

    if (releaseMateriel) {
      await Materiel.findByIdAndUpdate(location.materielId, { disponible: true });
    }

    emitStatut(req, location.locataireId.toString(), location, to);

    if (notif) {
      await notifyUser(req, {
        destinataireId: location.locataireId,
        type: "reservation",
        titre: notif.titre,
        contenu: notif.contenu(materiel.nom),
        lienRedirection: `/dashboard/locataire/locations?statut=${to}`,
      });
    }

    const populated = await findPopulated(location._id, "nom email telephone");
    res.json({ message: successMsg, data: populated });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.acceptLocation = (req, res) =>
  ownerTransition(req, res, {
    from: "en_attente",
    to: "acceptee",
    invalidMsg: "Statut invalide",
    successMsg: "Location acceptée",
    releaseMateriel: false,
    notif: {
      titre: "Demande acceptée !",
      contenu: (materielNom) => `Votre demande de location pour "${materielNom}" a été acceptée.`,
    },
  });

exports.rejectLocation = (req, res) =>
  ownerTransition(req, res, {
    from: "en_attente",
    to: "refusee",
    invalidMsg: "Statut invalide",
    successMsg: "Location refusée",
    releaseMateriel: true,
    notif: {
      titre: "Demande refusée",
      contenu: (materielNom) => `Votre demande de location pour "${materielNom}" a été refusée.`,
    },
  });

exports.startLocation = (req, res) =>
  ownerTransition(req, res, {
    from: "acceptee",
    to: "en_cours",
    invalidMsg: "La location doit être acceptée avant de démarrer",
    successMsg: "Location démarrée",
    releaseMateriel: false,
  });

exports.returnMateriel = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) return res.status(404).json({ message: "Location non trouvée" });

    const materielForCheck = await Materiel.findById(location.materielId).select("proprietaireId");
    const isLocataire = location.locataireId.toString() === req.user._id.toString();
    const isProprietaire = materielForCheck && materielForCheck.proprietaireId.toString() === req.user._id.toString();
    if (!isLocataire && !isProprietaire) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    if (!["acceptee", "en_cours", "en_retard"].includes(location.statut)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    location.dateRetourReelle = new Date();
    location.statut = "terminee";
    await location.save();

    await Paiement.updateOne(
      { locationId: location._id, type: "location", statut: "en_attente" },
      { $set: { statut: "paye" } }
    );

    const materiel = await Materiel.findByIdAndUpdate(
      location.materielId,
      { disponible: true },
      { new: true }
    );

    emitStatut(req, materiel.proprietaireId.toString(), location, "terminee");

    const populated = await findPopulated(location._id);

    res.json({ message: "Matériel retourné", data: populated });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getAllLocations = async (req, res) => {
  try {
    const { statut, page = 1, limit = 20 } = req.query;
    const query = {};
    if (statut) query.statut = statut;

    const locations = await Location.find(query)
      .populate({
        path: "materielId",
        select: "nom photos localisation proprietaireId",
        populate: { path: "proprietaireId", select: "nom email" },
      })
      .populate("locataireId", "nom email telephone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Location.countDocuments(query);

    res.json({
      data: locations,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("getAllLocations error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const asLocataire = await Location.countDocuments({ locataireId: userId });
    const asProprioMateriels = await Materiel.find({ proprietaireId: userId }).select("_id");
    const asProprio = await Location.countDocuments({
      materielId: { $in: asProprioMateriels.map((m) => m._id) },
    });

    const actifLocataire = await Location.countDocuments({
      locataireId: userId,
      statut: { $in: ["acceptee", "en_cours"] },
    });
    const actifProprio = await Location.countDocuments({
      materielId: { $in: asProprioMateriels.map((m) => m._id) },
      statut: { $in: ["acceptee", "en_cours"] },
    });

    const totalDepenses = await Location.aggregate([
      { $match: { locataireId: userId, statut: { $nin: ["annulee", "refusee"] } } },
      { $group: { _id: null, total: { $sum: "$montantLocation" } } },
    ]);

    const totalRevenus = await Location.aggregate([
      { $match: { materielId: { $in: asProprioMateriels.map((m) => m._id) }, statut: "terminee" } },
      { $group: { _id: null, total: { $sum: "$montantNetProprio" } } },
    ]);

    res.json({
      data: {
        totalLocationsLocataire: asLocataire,
        totalLocationsProprio: asProprio,
        locationsActivesLocataire: actifLocataire,
        locationsActivesProprio: actifProprio,
        totalDepenses: totalDepenses[0]?.total || 0,
        totalRevenus: totalRevenus[0]?.total || 0,
      },
    });
  } catch (err) {
    console.error("getStats error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
