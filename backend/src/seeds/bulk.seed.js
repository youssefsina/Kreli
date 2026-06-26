const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("../config/db");
const {
  User,
  Categorie,
  Materiel,
  Location,
  Paiement,
  CommissionConfig,
  Litige,
  Conversation,
  Message,
  Notification,
} = require("../models");

// ── Helpers ───────────────────────────────────────────────────────────────────
const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];
const pickN = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const chance = (p) => Math.random() < p;
const between = (min, max) => min + rand(max - min + 1);
const round = (n) => Math.round(n);

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// ── Data pools ────────────────────────────────────────────────────────────────
const PRENOMS = [
  "Karim", "Sara", "Aya", "Yassine", "Mehdi", "Salma", "Omar", "Imane", "Hamza", "Nada",
  "Youssef", "Fatima", "Anas", "Khadija", "Reda", "Hajar", "Ayoub", "Meryem", "Bilal", "Sanae",
  "Soufiane", "Ghita", "Zakaria", "Asmae", "Othmane", "Houda", "Ismail", "Nawal", "Adil", "Loubna",
  "Walid", "Rim", "Tarik", "Salwa", "Marouane", "Yasmine", "Achraf", "Dounia", "Nabil", "Chaimae",
];
const NOMS = [
  "Alaoui", "Moussaoui", "Benani", "El Idrissi", "Bennani", "Chraibi", "Tazi", "Berrada", "Fassi", "Lahlou",
  "Sebti", "Bennis", "El Amrani", "Kabbaj", "Cherkaoui", "Bouazza", "Naciri", "Saidi", "Mansouri", "El Khattabi",
  "Belghiti", "Lamrani", "Sqalli", "Filali", "Daoudi", "Hakkou", "Bouzoubaa", "Ouazzani", "Skalli", "Zniber",
];

const VILLES = {
  Casablanca: [-7.5898, 33.5731],
  Rabat: [-6.8498, 34.0209],
  Marrakech: [-7.9811, 31.6295],
  Tanger: [-5.8328, 35.7595],
  "Meknès": [-5.5471, 33.8974],
  "Fès": [-5.0078, 34.0181],
  Agadir: [-9.5981, 30.4278],
  Oujda: [-1.9086, 34.6814],
  Kénitra: [-6.5802, 34.2610],
  "Tétouan": [-5.3626, 35.5785],
};
const VILLE_KEYS = Object.keys(VILLES);

const PHOTOS = [
  "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1504222490345-c075b6008014?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
];

// nom de matériel par catégorie
const MATERIELS_PAR_CAT = {
  "BTP & Chantier": ["Mini pelle hydraulique", "Bétonnière électrique 300L", "Échafaudage modulaire 8m", "Nacelle télescopique 16m", "Marteau-piqueur thermique", "Plaque vibrante 90kg", "Brouette à moteur", "Coffrage métallique"],
  "Outillage Pro": ["Perforateur SDS Max 1250W", "Compresseur d'air 200L", "Meuleuse d'angle 2200W", "Scie circulaire 1800W", "Poste à souder MIG", "Visseuse à choc 18V", "Découpeuse thermique", "Ponceuse à bande"],
  "Evenementiel": ["Sono complète 2000W", "Pack lumières DJ", "Tente de réception 6x12", "Machine à fumée", "Écran LED géant", "Mobilier lounge", "Chauffage parasol", "Praticable scène"],
  "Electronique": ["Kit streaming 4K", "Groupe électrogène 10 kVA", "PC workstation rendu 3D", "Vidéoprojecteur 4K", "Drone professionnel", "Imprimante grand format", "Onduleur 3000VA", "Caméra cinéma"],
  "Agriculture": ["Tracteur agricole 80 CV", "Motoculteur thermique", "Pulvérisateur 600L", "Broyeur de branches", "Remorque agricole", "Pompe à eau diesel", "Débroussailleuse pro", "Semoir de précision"],
  "Industrie": ["Chariot élévateur 3T", "Transpalette électrique", "Gerbeur 1,5T", "Pont roulant", "Compresseur industriel", "Diable monte-escalier", "Table élévatrice", "Nettoyeur haute pression"],
};

const DESCRIPTIONS = [
  "Matériel professionnel entretenu, idéal pour vos chantiers et travaux intensifs. Livraison possible.",
  "Équipement récent en excellent état. Notice et accessoires fournis. Caution remboursée sous 48h.",
  "Parfait pour particuliers et professionnels. Prise en main rapide, fiable et performant.",
  "Disponible à la location courte ou longue durée. Tarifs dégressifs selon la durée.",
  "Engin robuste et polyvalent, adapté à de nombreux usages. Entretien régulier garanti.",
];

const ETATS = ["neuf", "bon_etat", "usage"];
const LOC_STATUTS = ["en_attente", "acceptee", "en_cours", "terminee", "en_retard", "en_litige", "refusee", "annulee"];
const NOTIF_TYPES = ["reservation", "message", "paiement", "litige", "compte"];

function loc(city) {
  return { type: "Point", coordinates: VILLES[city] || VILLES.Casablanca };
}

function makeLocation({ materielId, locataireId, prixParJour, caution, statut, commissionTaux }) {
  const nbJours = between(1, 14);
  const startOffset = chance(0.6) ? -between(1, 60) : between(1, 30);
  const dateDebut = startOffset < 0 ? daysAgo(-startOffset) : daysFromNow(startOffset);
  const dateFinPrevue = new Date(dateDebut);
  dateFinPrevue.setDate(dateFinPrevue.getDate() + nbJours);
  const montantLocation = prixParJour * nbJours;
  const commissionMontant = round(montantLocation * (commissionTaux / 100));
  const montantNetProprio = montantLocation - commissionMontant;
  return {
    materielId,
    locataireId,
    dateDebut,
    dateFinPrevue,
    statut,
    nbJours,
    prixParJour,
    montantLocation,
    cautionMontant: caution,
    commissionTaux,
    commissionMontant,
    montantNetProprio,
    createdAt: daysAgo(between(0, 90)),
  };
}

async function seed() {
  await connectDB();
  console.log("⏳  Génération des données en cours…");

  const models = [User, Categorie, Materiel, Location, Paiement, CommissionConfig, Litige, Conversation, Message, Notification];
  await Promise.all(
    models.map((M) => M.createCollection().catch((e) => { if (e.codeName !== "NamespaceExists") throw e; }))
  );
  await Promise.all(models.map((M) => M.deleteMany({})));

  const commissionTaux = 10;
  const commonHash = bcrypt.hashSync("Password@2024", 10);

  // ── Admin + commission ──────────────────────────────────────────────────────
  const admin = await User.create({
    nom: "Admin Kreli", email: "admin@kreli.ma", password: bcrypt.hashSync("Admin@2024", 10),
    role: "admin", statut: "actif",
  });
  await CommissionConfig.create({ taux: commissionTaux, modifiePar: admin._id });

  // ── Comptes démo (mots de passe connus) ─────────────────────────────────────
  const demoDefs = [
    { nom: "Karim Alaoui", email: "karim@demo.ma", pass: "Karim@2024", role: "locataire", ville: "Casablanca" },
    { nom: "Sara Moussaoui", email: "sara@demo.ma", pass: "Sara@2024", role: "proprietaire", ville: "Casablanca" },
    { nom: "Aya Equipements", email: "aya@kreli.ma", pass: "Proprio@2024", role: "proprietaire", ville: "Rabat" },
    { nom: "Yassine Chantier", email: "yassine@kreli.ma", pass: "Proprio@2024", role: "proprietaire", ville: "Marrakech" },
  ];
  const demoUsers = [];
  for (const d of demoDefs) {
    demoUsers.push(await User.create({
      nom: d.nom, email: d.email, password: bcrypt.hashSync(d.pass, 10),
      role: d.role, statut: "actif", telephone: `06${between(10000000, 99999999)}`, adresse: d.ville,
    }));
  }

  // ── ~96 utilisateurs aléatoires ─────────────────────────────────────────────
  const usedEmails = new Set([admin.email, ...demoDefs.map((d) => d.email)]);
  const randomUserDocs = [];
  let i = 0;
  while (randomUserDocs.length < 96) {
    const prenom = pick(PRENOMS);
    const nom = pick(NOMS);
    const email = `${prenom}.${nom}.${i}`.toLowerCase().replace(/\s+/g, "") + "@kreli-demo.ma";
    i++;
    if (usedEmails.has(email)) continue;
    usedEmails.add(email);
    const role = pick(["locataire", "locataire", "proprietaire", "proprietaire", "both"]);
    randomUserDocs.push({
      nom: `${prenom} ${nom}`,
      email,
      password: commonHash,
      role,
      statut: pick(["actif", "actif", "actif", "actif", "suspendu", "bloque"]),
      telephone: `06${between(10000000, 99999999)}`,
      adresse: pick(VILLE_KEYS),
      photo: chance(0.4) ? `https://i.pravatar.cc/150?img=${between(1, 70)}` : "",
      createdAt: daysAgo(between(1, 365)),
    });
  }
  const randomUsers = await User.insertMany(randomUserDocs);
  const allUsers = [...demoUsers, ...randomUsers];
  const owners = allUsers.filter((u) => u.role === "proprietaire" || u.role === "both");
  const renters = allUsers.filter((u) => u.role === "locataire" || u.role === "both");

  // ── Catégories ──────────────────────────────────────────────────────────────
  const categories = await Categorie.insertMany(
    Object.keys(MATERIELS_PAR_CAT).map((nom) => ({ nom, image: pick(PHOTOS) }))
  );

  // ── ~100 matériels ──────────────────────────────────────────────────────────
  const materielDocs = [];
  for (let m = 0; m < 100; m++) {
    const cat = pick(categories);
    const baseName = pick(MATERIELS_PAR_CAT[cat.nom]);
    const ville = pick(VILLE_KEYS);
    const owner = pick(owners);
    materielDocs.push({
      nom: `${baseName} ${pick(["Pro", "Plus", "MK2", "Premium", "Compact", ""])}`.trim() + ` #${m + 1}`,
      description: pick(DESCRIPTIONS),
      photos: [{ url: pick(PHOTOS), ordre: 0 }, ...(chance(0.5) ? [{ url: pick(PHOTOS), ordre: 1 }] : [])],
      prixParJour: between(8, 360) * 5,
      caution: between(2, 30) * 250,
      localisation: ville,
      location: loc(ville),
      etat: pick(ETATS),
      disponible: chance(0.7),
      featured: chance(0.2),
      proprietaireId: owner._id,
      categorieId: cat._id,
      createdAt: daysAgo(between(0, 300)),
    });
  }
  const materiels = await Materiel.insertMany(materielDocs);

  // ── ~120 locations ──────────────────────────────────────────────────────────
  const locationDocs = [];
  for (let l = 0; l < 120; l++) {
    const mat = pick(materiels);
    const eligibleRenters = renters.filter((r) => r._id.toString() !== mat.proprietaireId.toString());
    if (eligibleRenters.length === 0) continue;
    const renter = pick(eligibleRenters);
    locationDocs.push(
      makeLocation({
        materielId: mat._id,
        locataireId: renter._id,
        prixParJour: mat.prixParJour,
        caution: mat.caution,
        statut: pick(LOC_STATUTS),
        commissionTaux,
      })
    );
  }
  const locations = await Location.insertMany(locationDocs);

  // ── Paiements (location + caution par location) ─────────────────────────────
  const paiementDocs = [];
  for (const lc of locations) {
    const paid = ["acceptee", "en_cours", "terminee", "en_retard", "en_litige"].includes(lc.statut);
    paiementDocs.push({
      locationId: lc._id, type: "location", montant: lc.montantLocation,
      statut: paid ? "paye" : pick(["en_attente", "annule"]),
    });
    paiementDocs.push({
      locationId: lc._id, type: "caution", montant: lc.cautionMontant,
      statut: lc.statut === "terminee" ? "rembourse" : paid ? "paye" : "en_attente",
    });
    if (lc.statut === "terminee" && chance(0.3)) {
      paiementDocs.push({ locationId: lc._id, type: "penalite", montant: between(1, 8) * 100, statut: "retenu" });
    }
  }
  await Paiement.insertMany(paiementDocs);

  // ── Conversations + messages (~70 conversations) ────────────────────────────
  const sampleMsgs = [
    "Bonjour, est-ce que le matériel est toujours disponible ?",
    "Oui, il est disponible pour vos dates. La livraison est possible.",
    "Parfait, quelle est la caution à prévoir ?",
    "La caution est remboursée sous 48h après restitution en bon état.",
    "Très bien, je fais la demande de réservation maintenant.",
    "J'ai accepté votre demande, bonne location !",
    "À quelle adresse puis-je récupérer l'engin ?",
    "Je vous envoie l'adresse exacte le matin de la remise.",
  ];
  const convDocs = [];
  const usedPairs = new Set();
  for (let c = 0; c < 70; c++) {
    const mat = pick(materiels);
    const eligible = renters.filter((r) => r._id.toString() !== mat.proprietaireId.toString());
    if (!eligible.length) continue;
    const renter = pick(eligible);
    const key = `${mat._id}-${renter._id}`;
    if (usedPairs.has(key)) continue;
    usedPairs.add(key);
    convDocs.push({
      materielId: mat._id,
      locataireId: renter._id,
      proprietaireId: mat.proprietaireId,
      dernierMsgAt: daysAgo(between(0, 20)),
      createdAt: daysAgo(between(5, 40)),
      _renter: renter._id,
    });
  }
  const conversations = await Conversation.insertMany(convDocs.map(({ _renter, ...rest }) => rest));

  const messageDocs = [];
  conversations.forEach((conv, idx) => {
    const participants = [conv.locataireId, conv.proprietaireId];
    const count = between(2, 6);
    for (let m = 0; m < count; m++) {
      messageDocs.push({
        conversationId: conv._id,
        expediteurId: participants[m % 2],
        contenu: sampleMsgs[m % sampleMsgs.length],
        lu: chance(0.7),
        createdAt: daysAgo(between(0, 30)),
      });
    }
  });
  await Message.insertMany(messageDocs);

  // ── Notifications (~150) ────────────────────────────────────────────────────
  const notifTitles = {
    reservation: ["Nouvelle demande de location", "Demande acceptée !", "Réservation confirmée"],
    message: ["Nouveau message"],
    paiement: ["Paiement reçu", "Caution remboursée", "Paiement en attente"],
    litige: ["Litige ouvert", "Litige résolu"],
    compte: ["Bienvenue sur Kreli", "Mise à jour de votre compte"],
  };
  const notifDocs = [];
  for (let n = 0; n < 150; n++) {
    const dest = pick(allUsers);
    const type = pick(NOTIF_TYPES);
    notifDocs.push({
      destinataireId: dest._id,
      type,
      titre: pick(notifTitles[type]),
      contenu: "Vous avez une nouvelle activité sur votre compte Kreli.",
      lu: chance(0.5),
      lienRedirection: "/dashboard",
      createdAt: daysAgo(between(0, 29)),
    });
  }
  await Notification.insertMany(notifDocs);

  // ── Litiges (~25, sur locations en litige / terminées) ──────────────────────
  const litigeable = locations.filter((l) => ["en_litige", "terminee", "en_retard"].includes(l.statut));
  const litigeDocs = pickN(litigeable, Math.min(25, litigeable.length)).map((lc) => {
    const statut = pick(["ouvert", "en_cours", "cloture"]);
    return {
      locationId: lc._id,
      ouvertPar: lc.locataireId,
      description: pick([
        "Le matériel présentait un défaut au moment de la remise.",
        "Retard de restitution constaté.",
        "Caution non remboursée dans les délais.",
        "Désaccord sur l'état du matériel au retour.",
      ]),
      statut,
      decisionAdmin: statut === "cloture" ? "Litige résolu à l'amiable." : "",
      adminId: statut === "cloture" ? admin._id : null,
      openedAt: daysAgo(between(1, 40)),
      closedAt: statut === "cloture" ? daysAgo(between(0, 5)) : null,
    };
  });
  await Litige.insertMany(litigeDocs);

  // ── Récap ───────────────────────────────────────────────────────────────────
  const counts = {
    users: await User.countDocuments(),
    categories: await Categorie.countDocuments(),
    materiels: await Materiel.countDocuments(),
    locations: await Location.countDocuments(),
    paiements: await Paiement.countDocuments(),
    conversations: await Conversation.countDocuments(),
    messages: await Message.countDocuments(),
    notifications: await Notification.countDocuments(),
    litiges: await Litige.countDocuments(),
  };
  console.log("\n✅  Seed massif terminé !");
  console.table(counts);
  console.log("\n  🔑  Comptes démo :");
  console.log("      Locataire    → karim@demo.ma   / Karim@2024");
  console.log("      Propriétaire → sara@demo.ma    / Sara@2024");
  console.log("      Admin        → admin@kreli.ma  / Admin@2024");
  console.log("      Utilisateurs aléatoires → <email>@kreli-demo.ma / Password@2024\n");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Erreur seed massif:", err);
  process.exit(1);
});
