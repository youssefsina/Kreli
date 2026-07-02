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

async function ensureCollection(Model) {
  try {
    await Model.createCollection();
  } catch (error) {
    if (error.codeName !== "NamespaceExists") {
      throw error;
    }
  }
}

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

function makeLocation({ materielId, locataireId, dateDebut, nbJours, prixParJour, caution, statut, createdAt }) {
  const montantLocation = prixParJour * nbJours;
  const commissionTaux = 10;
  const commissionMontant = Math.round(montantLocation * 0.1);
  const montantNetProprio = montantLocation - commissionMontant;
  const dateFinPrevue = new Date(dateDebut);
  dateFinPrevue.setDate(dateFinPrevue.getDate() + nbJours);
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
    createdAt: createdAt || new Date(),
  };
}

async function seed() {
  try {
    await connectDB();

    const models = [
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
    ];

    await Promise.all(models.map(ensureCollection));
    await Promise.all(models.map((Model) => Model.syncIndexes()));

    await Promise.all([
      User.deleteMany({}),
      Categorie.deleteMany({}),
      Materiel.deleteMany({}),
      Location.deleteMany({}),
      Paiement.deleteMany({}),
      CommissionConfig.deleteMany({}),
      Litige.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    
    const admin = await User.create({
      nom: "Admin Kreli",
      email: "admin@Kreli.ma",
      password: bcrypt.hashSync("Admin@2024", 12),
      role: "admin",
      statut: "actif",
    });

    await CommissionConfig.create({ taux: 10, modifiePar: admin._id });

    
    const categories = await Categorie.insertMany([
      {
        nom: "BTP & Chantier",
        image: "https://images.unsplash.com/photo-1504222490345-c075b6008014?auto=format&fit=crop&w=800&q=80",
      },
      {
        nom: "Outillage Pro",
        image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80",
      },
      {
        nom: "Evenementiel",
        image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
      },
      {
        nom: "Electronique",
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
      },
      {
        nom: "Agriculture",
        image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80",
      },
      {
        nom: "Industrie",
        image: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=800&q=80",
      },
    ]);

    const [catBTP, catOutillage, catEvent, catElec, catAgri, catIndustrie] = categories;

    
    
    const locataire = await User.create({
      nom: "Karim Alaoui",
      email: "karim@demo.ma",
      password: bcrypt.hashSync("Karim@2024", 12),
      role: "locataire",
      statut: "actif",
      telephone: "0661234567",
      adresse: "Casablanca, Maarif",
    });

    
    const proprietaire = await User.create({
      nom: "Sara Moussaoui",
      email: "sara@demo.ma",
      password: bcrypt.hashSync("Sara@2024", 12),
      role: "proprietaire",
      statut: "actif",
      telephone: "0677654321",
      adresse: "Casablanca, Ain Diab",
    });

    
    const [proprioTwo, proprioThree] = await User.insertMany([
      {
        nom: "Aya Equipements",
        email: "aya@Kreli.ma",
        password: bcrypt.hashSync("Proprio@2024", 12),
        role: "proprietaire",
        statut: "actif",
        telephone: "0600000002",
        adresse: "Rabat",
      },
      {
        nom: "Yassine Chantier",
        email: "yassine@Kreli.ma",
        password: bcrypt.hashSync("Proprio@2024", 12),
        role: "proprietaire",
        statut: "actif",
        telephone: "0600000001",
        adresse: "Marrakech",
      },
    ]);

    
    const COORDS = {
      Casablanca: [-7.5898, 33.5731],
      Rabat:      [-6.8498, 34.0209],
      Marrakech:  [-7.9811, 31.6295],
      Tanger:     [-5.8328, 35.7595],
      Meknes:     [-5.5471, 33.8974],
    };

    function loc(city) {
      return { type: "Point", coordinates: COORDS[city] || COORDS.Casablanca };
    }

    
    const materiels = await Materiel.insertMany([
      
      {
        nom: "Mini pelle hydraulique 1.5T",
        description: "Mini pelle compacte idأ©ale pour tranchأ©es, fondations et dأ©molitions lأ©gأ¨res. Livraison possible sur Casablanca.",
        photos: [{ url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80", ordre: 0 }],
        prixParJour: 1200,
        caution: 5000,
        localisation: "Casablanca",
        location: loc("Casablanca"),
        etat: "bon_etat",
        disponible: false,
        featured: true,
        proprietaireId: proprietaire._id,
        categorieId: catBTP._id,
      },
      {
        nom: "Bأ©tonniأ¨re أ©lectrique 300L",
        description: "Bأ©tonniأ¨re professionnelle 300 litres, moteur 1500W. Parfaite pour les dalles et fondations.",
        photos: [{ url: "https://images.unsplash.com/photo-1504222490345-c075b6008014?auto=format&fit=crop&w=1200&q=80", ordre: 0 }],
        prixParJour: 380,
        caution: 1500,
        localisation: "Casablanca",
        location: loc("Casablanca"),
        etat: "bon_etat",
        disponible: true,
        featured: false,
        proprietaireId: proprietaire._id,
        categorieId: catBTP._id,
      },
      {
        nom: "أ‰chafaudage modulaire 8m",
        description: "أ‰chafaudage aluminium modulaire jusqu'أ  8m de hauteur. Montage rapide, idأ©al pour ravalement et peinture.",
        photos: [{ url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80", ordre: 0 }],
        prixParJour: 250,
        caution: 2000,
        localisation: "Casablanca",
        location: loc("Casablanca"),
        etat: "bon_etat",
        disponible: true,
        featured: false,
        proprietaireId: proprietaire._id,
        categorieId: catBTP._id,
      },
      
      {
        nom: "Perforateur SDS Max 1250W",
        description: "Perforateur professionnel SDS Max, 1250W, frappe 19J. Adaptأ© aux travaux intensifs bأ©ton et roche.",
        photos: [{ url: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80", ordre: 0 }],
        prixParJour: 180,
        caution: 900,
        localisation: "Casablanca",
        location: loc("Casablanca"),
        etat: "bon_etat",
        disponible: false,
        featured: true,
        proprietaireId: proprietaire._id,
        categorieId: catOutillage._id,
      },
      {
        nom: "Compresseur d'air 200L 3CV",
        description: "Compresseur أ  piston 200L, 3CV, 10 bars. Idأ©al pour cloueuses, pistolets أ  peinture et outils pneumatiques.",
        photos: [{ url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80", ordre: 0 }],
        prixParJour: 220,
        caution: 1200,
        localisation: "Casablanca",
        location: loc("Casablanca"),
        etat: "bon_etat",
        disponible: true,
        featured: false,
        proprietaireId: proprietaire._id,
        categorieId: catOutillage._id,
      },
      
      {
        nom: "Kit streaming 4K complet",
        description: "Camأ©ra Sony 4K, micro Rode, trأ©pied, أ©clairage LED bi-couleur. Idأ©al pour tournages, confأ©rences et webinaires.",
        photos: [{ url: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80", ordre: 0 }],
        prixParJour: 650,
        caution: 2500,
        localisation: "Casablanca",
        location: loc("Casablanca"),
        etat: "neuf",
        disponible: true,
        featured: true,
        proprietaireId: proprietaire._id,
        categorieId: catElec._id,
      },
      {
        nom: "Groupe أ©lectrogأ¨ne 10 kVA",
        description: "Groupe أ©lectrogأ¨ne diesel silencieux 10 kVA, dأ©marrage أ©lectrique. Idأ©al pour chantiers et أ©vأ©nements.",
        photos: [{ url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80", ordre: 0 }],
        prixParJour: 450,
        caution: 3000,
        localisation: "Casablanca",
        location: loc("Casablanca"),
        etat: "bon_etat",
        disponible: true,
        featured: true,
        proprietaireId: proprietaire._id,
        categorieId: catElec._id,
      },
      
      {
        nom: "Sono complأ¨te 2000W DJ",
        description: "Pack sono 2x1000W, table de mixage, 2 micros HF, cأ¢blage inclus. Parfait pour mariages et أ©vأ©nements.",
        photos: [{ url: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1200&q=80", ordre: 0 }],
        prixParJour: 800,
        caution: 3500,
        localisation: "Casablanca",
        location: loc("Casablanca"),
        etat: "bon_etat",
        disponible: false,
        featured: false,
        proprietaireId: proprietaire._id,
        categorieId: catEvent._id,
      },
    ]);

    const [matMinipelle, matBetoniere, matEchafaudage, matPerfo, matCompresseur, matStreaming, matGroupe, matSono] = materiels;

    
    await Materiel.insertMany([
      {
        nom: "PC workstation rendu 3D",
        description: "Station de travail puissante pour rendu, CAO et montage. 64GB RAM, RTX 4090.",
        photos: [{ url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80", ordre: 0 }],
        prixParJour: 900,
        caution: 4000,
        localisation: "Tanger",
        location: loc("Tanger"),
        etat: "bon_etat",
        disponible: true,
        featured: true,
        proprietaireId: proprioTwo._id,
        categorieId: catElec._id,
      },
      {
        nom: "Nacelle tأ©lescopique 16m",
        description: "Nacelle diesel tأ©lescopique 16 mأ¨tres de hauteur de travail. Idأ©ale pour faأ§ades et toitures.",
        photos: [{ url: "https://images.unsplash.com/photo-1504222490345-c075b6008014?auto=format&fit=crop&w=1200&q=80", ordre: 0 }],
        prixParJour: 1800,
        caution: 8000,
        localisation: "Rabat",
        location: loc("Rabat"),
        etat: "bon_etat",
        disponible: true,
        featured: true,
        proprietaireId: proprioTwo._id,
        categorieId: catBTP._id,
      },
      {
        nom: "Tracteur agricole 80 CV",
        description: "Tracteur 4x4 80 CV avec chargeur frontal. Idأ©al pour labour, transport et travaux agricoles.",
        photos: [{ url: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80", ordre: 0 }],
        prixParJour: 1100,
        caution: 5000,
        localisation: "Meknأ¨s",
        location: loc("Meknes"),
        etat: "bon_etat",
        disponible: true,
        featured: true,
        proprietaireId: proprioThree._id,
        categorieId: catAgri._id,
      },
      {
        nom: "Chariot أ©lأ©vateur 3T",
        description: "Chariot أ©lأ©vateur أ©lectrique 3 tonnes, hauteur 5m, parfait pour entrepأ´ts et usines.",
        photos: [{ url: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80", ordre: 0 }],
        prixParJour: 950,
        caution: 5000,
        localisation: "Casablanca",
        location: loc("Casablanca"),
        etat: "bon_etat",
        disponible: true,
        featured: true,
        proprietaireId: proprioThree._id,
        categorieId: catIndustrie._id,
      },
    ]);

    
    const locations = await Location.insertMany([
      
      makeLocation({
        materielId: matMinipelle._id,
        locataireId: locataire._id,
        dateDebut: daysAgo(4),
        nbJours: 7,
        prixParJour: 1200,
        caution: 5000,
        statut: "en_cours",
        createdAt: daysAgo(6),
      }),
      
      makeLocation({
        materielId: matPerfo._id,
        locataireId: locataire._id,
        dateDebut: daysAgo(12),
        nbJours: 3,
        prixParJour: 180,
        caution: 900,
        statut: "terminee",
        createdAt: daysAgo(14),
      }),
      
      makeLocation({
        materielId: matStreaming._id,
        locataireId: locataire._id,
        dateDebut: daysFromNow(2),
        nbJours: 2,
        prixParJour: 650,
        caution: 2500,
        statut: "en_attente",
        createdAt: daysAgo(1),
      }),
      
      makeLocation({
        materielId: matSono._id,
        locataireId: locataire._id,
        dateDebut: daysAgo(35),
        nbJours: 2,
        prixParJour: 800,
        caution: 3500,
        statut: "terminee",
        createdAt: daysAgo(37),
      }),
      
      makeLocation({
        materielId: matBetoniere._id,
        locataireId: locataire._id,
        dateDebut: daysFromNow(5),
        nbJours: 4,
        prixParJour: 380,
        caution: 1500,
        statut: "acceptee",
        createdAt: daysAgo(2),
      }),
    ]);

    const [locMinipelle, locPerfo, locStreaming, locSono, locBeton] = locations;

    
    await Paiement.insertMany([
      
      { locationId: locMinipelle._id, type: "location", montant: locMinipelle.montantLocation, statut: "paye" },
      { locationId: locMinipelle._id, type: "caution", montant: locMinipelle.cautionMontant, statut: "paye" },
      
      { locationId: locPerfo._id, type: "location", montant: locPerfo.montantLocation, statut: "paye" },
      { locationId: locPerfo._id, type: "caution", montant: locPerfo.cautionMontant, statut: "rembourse" },
      
      { locationId: locStreaming._id, type: "location", montant: locStreaming.montantLocation, statut: "en_attente" },
      { locationId: locStreaming._id, type: "caution", montant: locStreaming.cautionMontant, statut: "en_attente" },
      
      { locationId: locSono._id, type: "location", montant: locSono.montantLocation, statut: "paye" },
      { locationId: locSono._id, type: "caution", montant: locSono.cautionMontant, statut: "rembourse" },
      
      { locationId: locBeton._id, type: "location", montant: locBeton.montantLocation, statut: "en_attente" },
      { locationId: locBeton._id, type: "caution", montant: locBeton.cautionMontant, statut: "en_attente" },
    ]);

    
    const conv1 = await Conversation.create({
      materielId: matMinipelle._id,
      locataireId: locataire._id,
      proprietaireId: proprietaire._id,
      dernierMsgAt: daysAgo(1),
      createdAt: daysAgo(6),
    });

    const conv2 = await Conversation.create({
      materielId: matStreaming._id,
      locataireId: locataire._id,
      proprietaireId: proprietaire._id,
      dernierMsgAt: new Date(),
      createdAt: daysAgo(1),
    });

    await Message.insertMany([
      
      {
        conversationId: conv1._id,
        expediteurId: locataire._id,
        receiverId: proprietaire._id,
        contenu: "Bonjour Sara, est-ce que la mini pelle est disponible du 15 au 21 mai ? J'ai un chantier de fondations أ  Casablanca.",
        lu: true,
        createdAt: daysAgo(6),
      },
      {
        conversationId: conv1._id,
        expediteurId: proprietaire._id,
        receiverId: locataire._id,
        contenu: "Bonjour Karim ! Oui, elle est libre pour ces dates. La livraison est possible dans un rayon de 30 km. ًںکٹ",
        lu: true,
        createdAt: daysAgo(6),
      },
      {
        conversationId: conv1._id,
        expediteurId: locataire._id,
        receiverId: proprietaire._id,
        contenu: "Parfait ! Je vais faire la demande de rأ©servation tout de suite. Y a-t-il une caution أ  prأ©voir ?",
        lu: true,
        createdAt: daysAgo(5),
      },
      {
        conversationId: conv1._id,
        expediteurId: proprietaire._id,
        receiverId: locataire._id,
        contenu: "Oui, la caution est de 5 000 DH, remboursأ©e dans les 48h aprأ¨s restitution en bon أ©tat. J'ai acceptأ© votre demande !",
        lu: true,
        createdAt: daysAgo(5),
      },
      {
        conversationId: conv1._id,
        expediteurId: locataire._id,
        receiverId: proprietaire._id,
        contenu: "Super, merci beaucoup. أ€ quel endroit puis-je rأ©cupأ©rer l'engin ?",
        lu: true,
        createdAt: daysAgo(4),
      },
      {
        conversationId: conv1._id,
        expediteurId: proprietaire._id,
        receiverId: locataire._id,
        contenu: "Ain Diab, je vous enverrai l'adresse exacte par message le matin de la livraison. Bonne location !",
        lu: false,
        createdAt: daysAgo(1),
      },

      
      {
        conversationId: conv2._id,
        expediteurId: locataire._id,
        receiverId: proprietaire._id,
        contenu: "Bonjour, je suis intأ©ressأ© par le kit streaming 4K pour un أ©vأ©nement d'entreprise le weekend prochain.",
        lu: true,
        createdAt: daysAgo(1),
      },
      {
        conversationId: conv2._id,
        expediteurId: proprietaire._id,
        receiverId: locataire._id,
        contenu: "Bonjour ! Le kit est disponible. Pour quel type d'أ©vأ©nement ? Je peux inclure un technicien si besoin.",
        lu: true,
        createdAt: daysAgo(1),
      },
      {
        conversationId: conv2._id,
        expediteurId: locataire._id,
        receiverId: proprietaire._id,
        contenu: "C'est pour une confأ©rence de 200 personnes. 2 jours suffiront. J'envoie la demande maintenant.",
        lu: false,
        createdAt: new Date(),
      },
    ]);

    
    await Notification.insertMany([
      
      {
        destinataireId: locataire._id,
        type: "reservation",
        titre: "Demande acceptأ©e !",
        contenu: "Sara Moussaoui a acceptأ© votre demande de location pour la Mini pelle hydraulique 1.5T.",
        lu: true,
        lienRedirection: `/dashboard/locataire/locations/${locMinipelle._id}`,
        createdAt: daysAgo(5),
      },
      {
        destinataireId: locataire._id,
        type: "message",
        titre: "Nouveau message",
        contenu: "Sara Moussaoui vous a envoyأ© un message concernant la Mini pelle hydraulique 1.5T.",
        lu: false,
        lienRedirection: `/dashboard/locataire/messages`,
        createdAt: daysAgo(1),
      },
      {
        destinataireId: locataire._id,
        type: "paiement",
        titre: "Caution remboursأ©e",
        contenu: "Votre caution de 900 DH pour le Perforateur SDS Max a أ©tأ© remboursأ©e.",
        lu: false,
        lienRedirection: `/dashboard/locataire/paiements`,
        createdAt: daysAgo(8),
      },
      {
        destinataireId: locataire._id,
        type: "reservation",
        titre: "Rأ©servation confirmأ©e",
        contenu: "Sara Moussaoui a acceptأ© votre demande pour la Bأ©tonniأ¨re أ©lectrique 300L.",
        lu: false,
        lienRedirection: `/dashboard/locataire/locations/${locBeton._id}`,
        createdAt: daysAgo(2),
      },

      
      {
        destinataireId: proprietaire._id,
        type: "reservation",
        titre: "Nouvelle demande de location",
        contenu: "Karim Alaoui a demandأ© أ  louer votre Kit streaming 4K complet pour 2 jours.",
        lu: false,
        lienRedirection: `/dashboard/proprietaire/locations`,
        createdAt: daysAgo(1),
      },
      {
        destinataireId: proprietaire._id,
        type: "message",
        titre: "Nouveau message",
        contenu: "Karim Alaoui vous a envoyأ© un message concernant le Kit streaming 4K complet.",
        lu: false,
        lienRedirection: `/dashboard/proprietaire/messages`,
        createdAt: new Date(),
      },
      {
        destinataireId: proprietaire._id,
        type: "paiement",
        titre: "Paiement reأ§u",
        contenu: "Vous avez reأ§u 1 080 DH (net aprأ¨s commission) pour la location de la Mini pelle hydraulique 1.5T.",
        lu: true,
        lienRedirection: `/dashboard/proprietaire/revenus`,
        createdAt: daysAgo(4),
      },
    ]);

    console.log("\nâœ…  Seed Kreli terminأ© !\n");
    console.log("  ًں”‘  Comptes demo :");
    console.log("      Locataire  â†’ karim@demo.ma    / Karim@2024");
    console.log("      Propriأ©taire â†’ sara@demo.ma   / Sara@2024");
    console.log("      Admin        â†’ admin@Kreli.ma / Admin@2024\n");
    process.exit(0);
  } catch (error) {
    console.error("Erreur seed Kreli:", error);
    process.exit(1);
  }
}

seed();
