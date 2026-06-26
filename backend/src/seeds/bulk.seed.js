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

const COMMISSION = 10;

function loc(city) {
  return { type: "Point", coordinates: VILLES[city] || VILLES.Casablanca };
}

function makeMateriel(ownerId, categories, idx) {
  const cat = pick(categories);
  const baseName = pick(MATERIELS_PAR_CAT[cat.nom]);
  const ville = pick(VILLE_KEYS);
  return {
    nom: `${baseName} ${pick(["Pro", "Plus", "MK2", "Premium", "Compact", ""])}`.trim() + ` #${idx}`,
    description: pick(DESCRIPTIONS),
    photos: [{ url: pick(PHOTOS), ordre: 0 }, ...(chance(0.5) ? [{ url: pick(PHOTOS), ordre: 1 }] : [])],
    prixParJour: between(8, 360) * 5,
    caution: between(2, 30) * 250,
    localisation: ville,
    location: loc(ville),
    etat: pick(ETATS),
    disponible: chance(0.6),
    featured: chance(0.2),
    proprietaireId: ownerId,
    categorieId: cat._id,
    createdAt: daysAgo(between(30, 320)),
  };
}

// ageDays = il y a combien de jours la demande a été créée (pilote le graphique mensuel)
function makeLocation({ materiel, locataireId, statut, ageDays }) {
  const nbJours = between(1, 14);
  const created = ageDays != null ? ageDays : between(0, 150);
  const createdAt = daysAgo(created);

  let dateDebut;
  if (["en_attente", "acceptee"].includes(statut)) {
    dateDebut = daysFromNow(between(1, 20));
  } else if (statut === "en_cours") {
    dateDebut = daysAgo(between(1, Math.max(2, nbJours - 1)));
  } else {
    // terminee / en_retard / en_litige / refusee / annulee : démarrée dans le passé
    dateDebut = new Date(createdAt);
    dateDebut.setDate(dateDebut.getDate() + between(1, 3));
  }
  const dateFinPrevue = new Date(dateDebut);
  dateFinPrevue.setDate(dateFinPrevue.getDate() + nbJours);

  const montantLocation = materiel.prixParJour * nbJours;
  const commissionMontant = round(montantLocation * (COMMISSION / 100));
  const montantNetProprio = montantLocation - commissionMontant;
  return {
    materielId: materiel._id,
    locataireId,
    dateDebut,
    dateFinPrevue,
    statut,
    nbJours,
    prixParJour: materiel.prixParJour,
    montantLocation,
    cautionMontant: materiel.caution,
    commissionTaux: COMMISSION,
    commissionMontant,
    montantNetProprio,
    createdAt,
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

  const commonHash = bcrypt.hashSync("Password@2024", 10);

  // ── Admin + commission ──────────────────────────────────────────────────────
  const admin = await User.create({
    nom: "Admin Kreli", email: "admin@kreli.ma", password: bcrypt.hashSync("Admin@2024", 10),
    role: "admin", statut: "actif",
  });
  await CommissionConfig.create({ taux: COMMISSION, modifiePar: admin._id });

  // ── Comptes démo ────────────────────────────────────────────────────────────
  const demoDefs = [
    { key: "karim", nom: "Karim Alaoui", email: "karim@demo.ma", pass: "Karim@2024", role: "locataire", ville: "Casablanca" },
    { key: "sara", nom: "Sara Moussaoui", email: "sara@demo.ma", pass: "Sara@2024", role: "proprietaire", ville: "Casablanca" },
    { key: "aya", nom: "Aya Equipements", email: "aya@kreli.ma", pass: "Proprio@2024", role: "proprietaire", ville: "Rabat" },
    { key: "yassine", nom: "Yassine Chantier", email: "yassine@kreli.ma", pass: "Proprio@2024", role: "proprietaire", ville: "Marrakech" },
  ];
  const demo = {};
  for (const d of demoDefs) {
    demo[d.key] = await User.create({
      nom: d.nom, email: d.email, password: bcrypt.hashSync(d.pass, 10),
      role: d.role, statut: "actif", telephone: `06${between(10000000, 99999999)}`, adresse: d.ville,
    });
  }
  const demoUsers = Object.values(demo);

  // ── ~96 utilisateurs aléatoires ─────────────────────────────────────────────
  const usedEmails = new Set([admin.email, ...demoDefs.map((d) => d.email)]);
  const randomUserDocs = [];
  let ix = 0;
  while (randomUserDocs.length < 96) {
    const prenom = pick(PRENOMS);
    const nom = pick(NOMS);
    const email = `${prenom}.${nom}.${ix}`.toLowerCase().replace(/\s+/g, "") + "@kreli-demo.ma";
    ix++;
    if (usedEmails.has(email)) continue;
    usedEmails.add(email);
    randomUserDocs.push({
      nom: `${prenom} ${nom}`,
      email,
      password: commonHash,
      role: pick(["locataire", "locataire", "proprietaire", "proprietaire", "both"]),
      statut: pick(["actif", "actif", "actif", "actif", "suspendu", "bloque"]),
      telephone: `06${between(10000000, 99999999)}`,
      adresse: pick(VILLE_KEYS),
      photo: chance(0.4) ? `https://i.pravatar.cc/150?img=${between(1, 70)}` : "",
      createdAt: daysAgo(between(1, 365)),
    });
  }
  const randomUsers = await User.insertMany(randomUserDocs);
  const allUsers = [...demoUsers, ...randomUsers];
  const renters = allUsers.filter((u) => u.role === "locataire" || u.role === "both");
  const owners = allUsers.filter((u) => u.role === "proprietaire" || u.role === "both");

  // ── Catégories ──────────────────────────────────────────────────────────────
  const categories = await Categorie.insertMany(
    Object.keys(MATERIELS_PAR_CAT).map((nom) => ({ nom, image: pick(PHOTOS) }))
  );

  // ── Matériels : parc garanti pour les comptes démo + reste aléatoire ─────────
  const materielDocs = [];
  let mIdx = 1;
  const demoParc = [[demo.sara, 22], [demo.aya, 18], [demo.yassine, 18]];
  for (const [owner, n] of demoParc) {
    for (let k = 0; k < n; k++) materielDocs.push(makeMateriel(owner._id, categories, mIdx++));
  }
  while (materielDocs.length < 170) {
    materielDocs.push(makeMateriel(pick(owners)._id, categories, mIdx++));
  }
  const materiels = await Materiel.insertMany(materielDocs);
  const materielsByOwner = (ownerId) => materiels.filter((m) => m.proprietaireId.toString() === ownerId.toString());

  // ── Locations riches pour les comptes démo (étalées sur 6 mois) ──────────────
  const locationDocs = [];
  const rentersExcept = (ownerId) => renters.filter((r) => r._id.toString() !== ownerId.toString());

  for (const owner of [demo.sara, demo.aya, demo.yassine]) {
    const mats = materielsByOwner(owner._id);
    const pool = rentersExcept(owner._id);
    // Locations terminées réparties sur les 6 derniers mois (revenus + graphique)
    for (let monthAgo = 5; monthAgo >= 0; monthAgo--) {
      const count = between(2, 4);
      for (let c = 0; c < count; c++) {
        const renter = owner._id.equals(demo.sara._id) && chance(0.4) ? demo.karim : pick(pool);
        locationDocs.push(makeLocation({ materiel: pick(mats), locataireId: renter._id, statut: "terminee", ageDays: monthAgo * 30 + between(0, 26) }));
      }
    }
    // Activité en cours / à venir
    for (let c = 0; c < 4; c++) locationDocs.push(makeLocation({ materiel: pick(mats), locataireId: pick(pool)._id, statut: "en_cours", ageDays: between(0, 20) }));
    for (let c = 0; c < 3; c++) locationDocs.push(makeLocation({ materiel: pick(mats), locataireId: pick(pool)._id, statut: "acceptee", ageDays: between(0, 10) }));
    for (let c = 0; c < 4; c++) locationDocs.push(makeLocation({ materiel: pick(mats), locataireId: pick(pool)._id, statut: "en_attente", ageDays: between(0, 6) }));
    for (let c = 0; c < 2; c++) locationDocs.push(makeLocation({ materiel: pick(mats), locataireId: pick(pool)._id, statut: pick(["refusee", "annulee", "en_litige"]), ageDays: between(0, 60) }));
  }

  // Karim (locataire démo) : beaucoup de locations en tant que locataire
  const matsNotKarim = materiels.filter((m) => m.proprietaireId.toString() !== demo.karim._id.toString());
  for (let c = 0; c < 18; c++) {
    locationDocs.push(makeLocation({ materiel: pick(matsNotKarim), locataireId: demo.karim._id, statut: pick(["terminee", "terminee", "en_cours", "acceptee", "en_attente", "refusee"]), ageDays: between(0, 170) }));
  }

  // ── Locations aléatoires (volume global) ────────────────────────────────────
  for (let l = 0; l < 320; l++) {
    const mat = pick(materiels);
    const pool = rentersExcept(mat.proprietaireId);
    if (!pool.length) continue;
    locationDocs.push(makeLocation({ materiel: mat, locataireId: pick(pool)._id, statut: pick(LOC_STATUTS) }));
  }
  const locations = await Location.insertMany(locationDocs);

  // ── Paiements ───────────────────────────────────────────────────────────────
  const paiementDocs = [];
  for (const lc of locations) {
    const paid = ["acceptee", "en_cours", "terminee", "en_retard", "en_litige"].includes(lc.statut);
    paiementDocs.push({ locationId: lc._id, type: "location", montant: lc.montantLocation, statut: paid ? "paye" : pick(["en_attente", "annule"]) });
    paiementDocs.push({ locationId: lc._id, type: "caution", montant: lc.cautionMontant, statut: lc.statut === "terminee" ? "rembourse" : paid ? "paye" : "en_attente" });
    if (lc.statut === "terminee" && chance(0.25)) {
      paiementDocs.push({ locationId: lc._id, type: "penalite", montant: between(1, 8) * 100, statut: "retenu" });
    }
  }
  await Paiement.insertMany(paiementDocs);

  // ── Conversations + messages ────────────────────────────────────────────────
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
  // Conversations garanties impliquant les comptes démo (matériels distincts)
  for (const mat of pickN(materielsByOwner(demo.sara._id), 10)) {
    const key = `${mat._id}-${demo.karim._id}`;
    if (usedPairs.has(key)) continue;
    usedPairs.add(key);
    convDocs.push({ materielId: mat._id, locataireId: demo.karim._id, proprietaireId: demo.sara._id, dernierMsgAt: daysAgo(between(0, 8)), createdAt: daysAgo(between(2, 30)) });
  }
  for (let c = 0; c < 80; c++) {
    const mat = pick(materiels);
    const pool = rentersExcept(mat.proprietaireId);
    if (!pool.length) continue;
    const renter = pick(pool);
    const key = `${mat._id}-${renter._id}`;
    if (usedPairs.has(key)) continue;
    usedPairs.add(key);
    convDocs.push({ materielId: mat._id, locataireId: renter._id, proprietaireId: mat.proprietaireId, dernierMsgAt: daysAgo(between(0, 20)), createdAt: daysAgo(between(5, 40)) });
  }
  const conversations = await Conversation.insertMany(convDocs);

  const messageDocs = [];
  for (const conv of conversations) {
    const participants = [conv.locataireId, conv.proprietaireId];
    const count = between(2, 7);
    for (let m = 0; m < count; m++) {
      messageDocs.push({
        conversationId: conv._id,
        expediteurId: participants[m % 2],
        contenu: sampleMsgs[m % sampleMsgs.length],
        lu: chance(0.65),
        createdAt: daysAgo(between(0, 30)),
      });
    }
  }
  await Message.insertMany(messageDocs);

  // ── Notifications ───────────────────────────────────────────────────────────
  const notifTitles = {
    reservation: ["Nouvelle demande de location", "Demande acceptée !", "Réservation confirmée"],
    message: ["Nouveau message"],
    paiement: ["Paiement reçu", "Caution remboursée", "Paiement en attente"],
    litige: ["Litige ouvert", "Litige résolu"],
    compte: ["Bienvenue sur Kreli", "Mise à jour de votre compte"],
  };
  const notifDocs = [];
  // Notifications garanties pour les comptes démo
  for (const u of demoUsers) {
    for (let n = 0; n < 6; n++) {
      const type = pick(NOTIF_TYPES);
      notifDocs.push({ destinataireId: u._id, type, titre: pick(notifTitles[type]), contenu: "Vous avez une nouvelle activité sur votre compte Kreli.", lu: chance(0.4), lienRedirection: "/dashboard", createdAt: daysAgo(between(0, 25)) });
    }
  }
  for (let n = 0; n < 200; n++) {
    const type = pick(NOTIF_TYPES);
    notifDocs.push({ destinataireId: pick(allUsers)._id, type, titre: pick(notifTitles[type]), contenu: "Vous avez une nouvelle activité sur votre compte Kreli.", lu: chance(0.5), lienRedirection: "/dashboard", createdAt: daysAgo(between(0, 29)) });
  }
  await Notification.insertMany(notifDocs);

  // ── Litiges ─────────────────────────────────────────────────────────────────
  const litigeable = locations.filter((l) => ["en_litige", "terminee", "en_retard"].includes(l.statut));
  const litigeDocs = pickN(litigeable, Math.min(30, litigeable.length)).map((lc) => {
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
  const saraTerminees = await Location.countDocuments({ statut: "terminee" });
  console.log("\n✅  Seed massif terminé !");
  console.table(counts);
  console.log(`   Sara possède ${materielsByOwner(demo.sara._id).length} matériels · ${saraTerminees} locations terminées au total`);
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
