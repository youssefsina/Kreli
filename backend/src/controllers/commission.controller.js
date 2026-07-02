const { CommissionConfig, getCurrentCommissionTaux } = require("../models/CommissionConfig");

exports.getCommission = async (req, res) => {
  try {
    const taux = await getCurrentCommissionTaux();
    res.json({ data: { taux } });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.updateCommission = async (req, res) => {
  try {
    const { taux } = req.body;
    if (typeof taux !== "number" || Number.isNaN(taux) || taux < 0 || taux > 100) {
      return res.status(400).json({ message: "Le taux de commission doit être un nombre entre 0 et 100" });
    }

    const config = await CommissionConfig.create({ taux, modifiePar: req.user._id });
    res.status(201).json({
      message: "Commission mise à jour",
      data: { taux: config.taux, createdAt: config.createdAt },
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};
