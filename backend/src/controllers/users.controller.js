const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Location = require("../models/Location");
const Materiel = require("../models/Materiel");
const { body } = require("express-validator");
const validate = require("../utils/validate");

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.json({ data: user });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.updateProfile = [
  body("nom").optional().trim().notEmpty().withMessage("Le nom ne peut pas être vide"),
  body("telephone").optional().trim(),
  body("adresse").optional().trim(),
  body("photo").optional().trim(),
  validate,
  async (req, res) => {
    try {
      const updates = {};
      const allowed = ["nom", "telephone", "adresse", "photo"];
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true }
      ).select("-password");

      res.json({ message: "Profil mis à jour", data: user });
    } catch (err) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  },
];

const ACTIVE_LOCATION_STATUTS = ["en_attente", "acceptee", "en_cours", "en_retard", "en_litige"];

exports.deleteAccount = [
  body("password").notEmpty().withMessage("Mot de passe requis pour confirmer la suppression"),
  validate,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

      const valid = await bcrypt.compare(req.body.password, user.password);
      if (!valid) return res.status(400).json({ message: "Mot de passe incorrect" });

      // Bloquer la suppression si des locations sont encore actives (en tant que locataire)
      const asRenter = await Location.countDocuments({
        locataireId: user._id,
        statut: { $in: ACTIVE_LOCATION_STATUTS },
      });
      if (asRenter > 0) {
        return res.status(400).json({
          message: "Impossible de supprimer le compte : vous avez des locations en cours.",
        });
      }

      // Bloquer si du matériel possédé a des locations actives (en tant que propriétaire)
      const ownedMateriels = await Materiel.find({ proprietaireId: user._id }).select("_id");
      const ownedIds = ownedMateriels.map((m) => m._id);
      if (ownedIds.length > 0) {
        const asOwner = await Location.countDocuments({
          materielId: { $in: ownedIds },
          statut: { $in: ACTIVE_LOCATION_STATUTS },
        });
        if (asOwner > 0) {
          return res.status(400).json({
            message: "Impossible de supprimer le compte : votre matériel a des locations en cours.",
          });
        }
        // Retirer le matériel possédé qui n'est plus engagé
        await Materiel.deleteMany({ _id: { $in: ownedIds } });
      }

      await User.findByIdAndDelete(user._id);

      res.json({ message: "Compte supprimé avec succès" });
    } catch (err) {
      console.error("deleteAccount error:", err);
      res.status(500).json({ message: "Erreur serveur" });
    }
  },
];

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("nom photo telephone role");
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.json({ data: user });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { statut } = req.body;
    if (!["actif", "suspendu", "bloque"].includes(statut)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { statut },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    res.json({ message: "Statut mis à jour", data: user });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { role, statut, q, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (statut) query.statut = statut;
    if (q) query.$or = [{ nom: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }];

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      data: users,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getOwnerStats = async (req, res) => {
  try {
    const ownerId = req.user._id;

    const materiels = await Materiel.find({ proprietaireId: ownerId });
    const materielIds = materiels.map((m) => m._id);

    const locations = await Location.find({ materielId: { $in: materielIds } });

    const enAttente = locations.filter((l) => l.statut === "en_attente").length;
    const acceptees = locations.filter((l) => l.statut === "acceptee").length;
    const enCours = locations.filter((l) => l.statut === "en_cours").length;
    const terminees = locations.filter((l) => l.statut === "terminee").length;

    const revenus = locations
      .filter((l) => l.statut === "terminee")
      .reduce((sum, l) => sum + (l.montantNetProprio || 0), 0);

    res.json({
      data: {
        totalMateriels: materiels.length,
        disponibiles: materiels.filter((m) => m.disponible).length,
        locations: {
          enAttente,
          acceptees,
          enCours,
          terminees,
          total: locations.length,
        },
        revenus,
      },
    });
  } catch (err) {
    console.error("getOwnerStats error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMateriels = await Materiel.countDocuments();
    const totalLocations = await Location.countDocuments();
    const locationsActives = await Location.countDocuments({ statut: { $in: ["acceptee", "en_cours"] } });

    const revenusAgg = await Location.aggregate([
      { $match: { statut: "terminee" } },
      { $group: { _id: null, total: { $sum: "$montantLocation" } } },
    ]);

    res.json({
      data: {
        totalUsers,
        totalMateriels,
        totalLocations,
        locationsActives,
        totalRevenus: revenusAgg[0]?.total || 0,
      },
    });
  } catch (err) {
    console.error("getAdminStats error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.changePassword = [
  body("currentPassword").notEmpty().withMessage("Mot de passe actuel requis"),
  body("newPassword")
    .isLength({ min: 8 }).withMessage("Au moins 8 caractères")
    .matches(/[A-Z]/).withMessage("Doit contenir au moins une majuscule")
    .matches(/[0-9]/).withMessage("Doit contenir au moins un chiffre"),
  validate,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

      const valid = await bcrypt.compare(req.body.currentPassword, user.password);
      if (!valid) return res.status(400).json({ message: "Mot de passe actuel incorrect" });

      user.password = await bcrypt.hash(req.body.newPassword, 12);
      await user.save();

      res.json({ message: "Mot de passe mis à jour" });
    } catch (err) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  },
];

exports.getLocataireStats = async (req, res) => {
  try {
    const locataireId = req.user._id;

    const locations = await Location.find({ locataireId });

    const enAttente = locations.filter((l) => l.statut === "en_attente").length;
    const enCours = locations.filter((l) => ["acceptee", "en_cours"].includes(l.statut)).length;
    const terminees = locations.filter((l) => l.statut === "terminee").length;

    const totalDepenses = locations
      .filter((l) => !["annulee", "refusee"].includes(l.statut))
      .reduce((sum, l) => sum + (l.montantLocation || 0), 0);

    res.json({
      data: {
        locations: {
          enAttente,
          enCours,
          terminees,
          total: locations.length,
        },
        totalDepenses,
      },
    });
  } catch (err) {
    console.error("getLocataireStats error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};


exports.getFavoris = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("favoris")
      .populate({ path: "favoris", select: "nom photos prixParJour localisation disponible categorieId", populate: { path: "categorieId", select: "nom" } });
    res.json({ data: user.favoris });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};


exports.toggleFavori = async (req, res) => {
  try {
    const { materielId } = req.params;
    const user = await User.findById(req.user._id).select("favoris");

    const idx = user.favoris.findIndex((id) => id.toString() === materielId);
    if (idx === -1) {
      user.favoris.push(materielId);
    } else {
      user.favoris.splice(idx, 1);
    }
    await user.save();

    res.json({ added: idx === -1, data: user.favoris });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};
