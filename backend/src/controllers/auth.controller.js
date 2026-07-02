const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { body } = require("express-validator");

const { User } = require("../models");
const { sendMail, buildResetPasswordEmail } = require("../utils/mailer");
const validate = require("../utils/validate");

const registerValidation = [
  body("nom").trim().notEmpty().withMessage("Le nom est requis").isLength({ max: 100 }).withMessage("Nom trop long"),
  body("email").isEmail().withMessage("Email invalide").normalizeEmail(),
  body("password").isLength({ min: 8 }).withMessage("Le mot de passe doit contenir au moins 8 caractأ¨res").matches(/[A-Z]/).withMessage("Doit contenir au moins une majuscule").matches(/[0-9]/).withMessage("Doit contenir au moins un chiffre"),
  body("telephone").optional().isMobilePhone("any").withMessage("Tأ©lأ©phone invalide"),
  body("role").isIn(["locataire", "proprietaire", "both"]).withMessage("Role invalide"),
  validate,
];

const loginValidation = [
  body("email").isEmail().withMessage("Email invalide").normalizeEmail(),
  body("password").notEmpty().withMessage("Le mot de passe est requis"),
  validate,
];

function signToken(user, expiresIn) {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
    statut: user.statut,
  };

  const options = expiresIn ? { expiresIn } : undefined;
  return jwt.sign(payload, process.env.JWT_SECRET, options);
}

async function register(req, res) {
  try {
    const { nom, email, password, role, telephone, adresse, photo } = req.body;

    if (!nom || !email || !password || !role) {
      return res.status(400).json({ message: "nom, email, password et role sont requis" });
    }

    if (!["locataire", "proprietaire", "both"].includes(role)) {
      return res.status(400).json({ message: "Role invalide" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "Email deja utilise" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      nom: nom.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      telephone: telephone?.trim() || "",
      adresse: adresse?.trim() || "",
      photo: photo || "",
      statut: "actif",
    });

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: {
        _id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        statut: user.statut,
        photo: user.photo,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de l'inscription",
      error: error.message,
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email et password sont requis" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    if (user.statut === "suspendu") {
      return res.status(403).json({ message: "Compte suspendu" });
    }

    if (user.statut === "bloque") {
      return res.status(403).json({ message: "Compte bloqu\u00e9" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    const token = signToken(user, "7d");

    return res.json({
      token,
      user: {
        _id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        statut: user.statut,
        photo: user.photo,
        telephone: user.telephone,
        adresse: user.adresse,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la connexion",
      error: error.message,
    });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la recuperation du profil",
      error: error.message,
    });
  }
}

async function updateProfile(req, res) {
  try {
    const allowedFields = ["nom", "telephone", "adresse", "photo"];
    const updates = {};

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Aucune mise a jour valide fournie" });
    }

    if (typeof updates.nom === "string") {
      updates.nom = updates.nom.trim();
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
      select: "-password",
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la mise a jour du profil",
      error: error.message,
    });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requis" });

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Privacy: never reveal whether the account exists — this is the only
    // case where a generic "success" response is sent without actually
    // emailing anyone.
    if (!user) return res.json({ message: "Si cet email existe, un lien a été envoyé." });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });

    const frontendUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

    const { html, text } = buildResetPasswordEmail({ name: user.nom, resetUrl });

    let result;
    try {
      result = await sendMail({
        to: user.email,
        subject: "Réinitialisation de votre mot de passe Kreli",
        html,
        text,
      });
    } catch (mailError) {
      console.error(`[ForgotPassword] mail send failed for ${email}:`, mailError.message);
      console.error(`[ForgotPassword] reset URL (email not delivered): ${resetUrl}`);
      return res.status(502).json({
        message: "Impossible d'envoyer l'email de réinitialisation pour le moment. Veuillez réessayer plus tard.",
      });
    }

    if (result?.skipped) {
      console.error(`[ForgotPassword] SMTP is not configured — email NOT sent for ${email}.`);
      console.error(`[ForgotPassword] reset URL (email not delivered): ${resetUrl}`);
      return res.status(502).json({
        message: "Impossible d'envoyer l'email de réinitialisation pour le moment. Veuillez réessayer plus tard.",
      });
    }

    return res.json({ message: "Si cet email existe, un lien a été envoyé." });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur" });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: "Token et mot de passe requis" });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ message: "Token invalide ou expirأ©" });

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: "Mot de passe rأ©initialisأ© avec succأ¨s" });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur" });
  }
}

module.exports = {
  registerValidation,
  loginValidation,
  register,
  login,
  me,
  updateProfile,
  forgotPassword,
  resetPassword,
};
