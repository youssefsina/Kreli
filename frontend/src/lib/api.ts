export type Category = {
  _id: string;
  nom: string;
  description?: string;
  image?: string;
};

export type Materiel = {
  _id: string;
  nom: string;
  description?: string;
  photos?: { url: string; ordre?: number }[];
  prixParJour: number;
  caution?: number;
  localisation?: string;
  etat?: "neuf" | "bon_etat" | "usage";
  disponible?: boolean;
  featured?: boolean;
  categorieId?: { _id: string; nom: string } | string;
  proprietaireId?: { _id: string; nom: string; photo?: string; telephone?: string } | string;
  createdAt?: string;
};

export type MaterielListResult = {
  data: Materiel[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type AuthUser = {
  _id: string;
  nom: string;
  email: string;
  role: "locataire" | "proprietaire" | "both" | "admin";
  statut: string;
  photo?: string;
  telephone?: string;
  adresse?: string;
  createdAt?: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

const DEFAULT_API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://kreli-production.up.railway.app/api/v1"
    : "http://localhost:5000/api/v1";

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_BASE_URL;
}

const API_BASE_URL = getApiBaseUrl();

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `API error ${response.status}`);
  }

  return response.json() as Promise<T>;
}


export async function getCategories(): Promise<Category[]> {
  const result = await fetchJson<{ data: Category[] }>("/categories");
  return result.data;
}

export async function createCategory(data: { nom: string; description?: string; image?: string }): Promise<Category> {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(data),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}

export async function updateCategory(id: string, data: { nom?: string; description?: string; image?: string }): Promise<Category> {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(data),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.message ?? "Erreur");
  }
}


export async function getFeaturedMateriels(limit = 4): Promise<Materiel[]> {
  const result = await fetchJson<{ data: Materiel[] }>(
    `/materiels/featured?limit=${limit}`
  );
  return result.data;
}

export type MaterielFilters = {
  q?: string;
  categorie?: string;
  ville?: string;
  rayon?: number;
  lat?: number;
  lng?: number;
  prixMin?: number;
  prixMax?: number;
  disponibilite?: "disponible" | "reservation";
  page?: number;
  limit?: number;
  sort?: "recent" | "price_asc" | "price_desc";
};

export async function getMateriels(filters: MaterielFilters = {}): Promise<MaterielListResult> {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.categorie) params.set("categorie", filters.categorie);
  if (filters.ville) params.set("ville", filters.ville);
  if (filters.rayon !== undefined) params.set("rayon", String(filters.rayon));
  if (filters.lat !== undefined) params.set("lat", String(filters.lat));
  if (filters.lng !== undefined) params.set("lng", String(filters.lng));
  if (filters.prixMin !== undefined) params.set("prixMin", String(filters.prixMin));
  if (filters.prixMax !== undefined) params.set("prixMax", String(filters.prixMax));
  if (filters.disponibilite) params.set("disponibilite", filters.disponibilite);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.sort) params.set("sort", filters.sort);

  const qs = params.toString();
  return fetchJson<MaterielListResult>(`/materiels${qs ? `?${qs}` : ""}`);
}

export async function getMateriel(id: string): Promise<Materiel> {
  const result = await fetchJson<{ data: Materiel }>(`/materiels/${id}`);
  return result.data;
}

export async function getSimilarMateriels(id: string): Promise<Materiel[]> {
  const result = await fetchJson<{ data: Materiel[] }>(`/materiels/${id}/similar`);
  return result.data;
}


export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur de connexion");
  return body as AuthResponse;
}

export async function registerUser(data: {
  nom: string;
  email: string;
  password: string;
  role: "locataire" | "proprietaire" | "both";
  telephone?: string;
  adresse?: string;
  photo?: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur d'inscription");
  return body as AuthResponse;
}


export function formatPrice(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getMaterielImage(materiel: Materiel): string | null {
  if (materiel.photos && materiel.photos.length > 0) {
    const sorted = [...materiel.photos].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
    const url = sorted[0].url;
    if (url.startsWith("http")) return url;
    return `${getApiBaseUrl().replace("/api/v1", "")}/${url}`;
  }
  return null;
}

export function getEtatLabel(etat?: string) {
  switch (etat) {
    case "neuf": return "Neuf";
    case "bon_etat": return "Bon état";
    case "usage": return "Usagé";
    default: return "";
  }
}


export type LocationMateriel = {
  _id: string;
  nom: string;
  photos?: { url: string; ordre?: number }[];
  localisation?: string;
  prixParJour: number;
};

export type Location = {
  _id: string;
  materielId: LocationMateriel;
  locataireId: { _id: string; nom: string; email?: string };
  dateDebut: string;
  dateFinPrevue: string;
  dateRetourReelle?: string;
  statut: "en_attente" | "acceptee" | "en_cours" | "terminee" | "en_retard" | "en_litige" | "refusee" | "annulee";
  nbJours: number;
  prixParJour: number;
  montantLocation: number;
  cautionMontant: number;
  montantNetProprio?: number;
  commissionTaux?: number;
  commissionMontant?: number;
  createdAt: string;
};

export type LocationListResult = {
  data: Location[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export async function createLocation(data: {
  materielId: string;
  dateDebut: string;
  dateFinPrevue: string;
}): Promise<Location> {
  const response = await fetch(`${API_BASE_URL}/locations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}

export async function getMyLocations(filters?: {
  statut?: string;
  page?: number;
  limit?: number;
}): Promise<LocationListResult> {
  const params = new URLSearchParams();
  if (filters?.statut) params.set("statut", filters.statut);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit));

  const response = await fetch(`${API_BASE_URL}/locations?${params}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body;
}

export async function getLocation(id: string): Promise<Location> {
  const response = await fetch(`${API_BASE_URL}/locations/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}

export async function getOwnerLocations(filters?: {
  statut?: string;
  page?: number;
  limit?: number;
}): Promise<LocationListResult> {
  const params = new URLSearchParams();
  if (filters?.statut) params.set("statut", filters.statut);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit));

  const response = await fetch(`${API_BASE_URL}/locations/owner?${params}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body;
}

export async function acceptLocation(id: string): Promise<Location> {
  const response = await fetch(`${API_BASE_URL}/locations/${id}/accept`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}

export async function rejectLocation(id: string): Promise<Location> {
  const response = await fetch(`${API_BASE_URL}/locations/${id}/reject`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}

export async function startLocation(id: string): Promise<Location> {
  const response = await fetch(`${API_BASE_URL}/locations/${id}/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}

export async function returnMateriel(id: string): Promise<Location> {
  const response = await fetch(`${API_BASE_URL}/locations/${id}/return`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}

export async function cancelLocation(id: string): Promise<Location> {
  const response = await fetch(`${API_BASE_URL}/locations/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}

export async function getLocationStats(): Promise<{
  totalLocationsLocataire: number;
  totalLocationsProprio: number;
  locationsActivesLocataire: number;
  locationsActivesProprio: number;
  totalDepenses: number;
  totalRevenus: number;
}> {
  const response = await fetch(`${API_BASE_URL}/locations/stats`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}


export async function getMyProfile(): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}

export async function updateMyProfile(data: {
  nom?: string;
  telephone?: string;
  adresse?: string;
  photo?: string;
}): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/users/me/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
}

export async function forgotPassword(email: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
}

export async function getOwnerStats(): Promise<{
  totalMateriels: number;
  disponibiles: number;
  locations: { enAttente: number; acceptees: number; enCours: number; terminees: number; total: number };
  revenus: number;
}> {
  const response = await fetch(`${API_BASE_URL}/users/stats/owner`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}

export async function getLocataireStats(): Promise<{
  locations: { enAttente: number; enCours: number; terminees: number; total: number };
  totalDepenses: number;
}> {
  const response = await fetch(`${API_BASE_URL}/users/stats/locataire`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}


export async function uploadMaterielImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("photo", file);
  const response = await fetch(`${API_BASE_URL}/upload/materiel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur upload");
  return body.url as string;
}


export async function createMateriel(data: {
  nom: string;
  description?: string;
  photos?: { url: string }[];
  prixParJour: number;
  caution?: number;
  localisation?: string;
  etat?: "neuf" | "bon_etat" | "usage";
  categorieId: string;
}): Promise<Materiel> {
  const response = await fetch(`${API_BASE_URL}/materiels`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}

export async function getMyMateriels(filters?: {
  page?: number;
  limit?: number;
}): Promise<MaterielListResult> {
  const params = new URLSearchParams();
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit));

  const response = await fetch(`${API_BASE_URL}/materiels/mine?${params}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body;
}

export async function updateMateriel(id: string, data: Partial<Materiel>): Promise<Materiel> {
  const response = await fetch(`${API_BASE_URL}/materiels/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}

export async function deleteMateriel(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/materiels/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.message ?? "Erreur");
  }
}


export type ConvUser = { _id: string; nom: string; photo?: string };
export type ConvMateriel = { _id: string; nom: string; photos?: { url: string }[] };

export type ChatMessage = {
  _id: string;
  conversationId: string;
  expediteurId: ConvUser;
  contenu: string;
  imageUrl?: string | null;
  lu: boolean;
  createdAt: string;
};

export type Conversation = {
  _id: string;
  materielId: ConvMateriel;
  locataireId: ConvUser;
  proprietaireId: ConvUser;
  dernierMsgAt: string;
  unreadCount: number;
  lastMessage?: ChatMessage;
};

export async function getOrCreateConversation(materielId: string): Promise<Conversation> {
  const response = await fetch(`${API_BASE_URL}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ materielId }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}

export async function getMyConversations(): Promise<Conversation[]> {
  const response = await fetch(`${API_BASE_URL}/conversations`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}

export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}


function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("Kreli_token") ?? "";
}


export type AppNotification = {
  _id: string;
  type: "reservation" | "paiement" | "message" | "litige" | "retard" | "compte" | "materiel";
  titre: string;
  contenu: string;
  lu: boolean;
  lienRedirection: string;
  createdAt: string;
};

export type NotificationListResult = {
  data: AppNotification[];
  unreadCount: number;
};

export async function getNotifications(page = 1): Promise<NotificationListResult> {
  const response = await fetch(`${API_BASE_URL}/notifications?page=${page}&limit=20`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body;
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}

export async function updateUserStatus(id: string, statut: "actif" | "suspendu" | "bloque"): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/users/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify({ statut }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}

export async function getAdminStats(): Promise<{
  totalUsers: number;
  totalMateriels: number;
  totalLocations: number;
  locationsActives: number;
  totalRevenus: number;
}> {
  const response = await fetch(`${API_BASE_URL}/users/stats/admin`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}

export async function getAdminAllLocations(filters?: {
  statut?: string;
  page?: number;
  limit?: number;
}): Promise<LocationListResult> {
  const params = new URLSearchParams();
  if (filters?.statut) params.set("statut", filters.statut);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit ?? 20));

  const response = await fetch(`${API_BASE_URL}/locations/admin/all?${params}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body;
}

export async function markAllNotificationsRead(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.message ?? "Erreur");
  }
}

export function getStatutLabel(statut: string) {
  const labels: Record<string, string> = {
    en_attente: "En attente",
    acceptee: "Acceptée",
    en_cours: "En cours",
    terminee: "Terminée",
    en_retard: "En retard",
    en_litige: "En litige",
    refusee: "Refusée",
    annulee: "Annulée",
  };
  return labels[statut] ?? statut;
}


export type Paiement = {
  _id: string;
  locationId: {
    _id: string;
    materielId: { _id: string; nom: string };
    locataireId: { _id: string; nom: string; email: string };
    montantLocation: number;
    statut: string;
    dateDebut: string;
    dateFinPrevue: string;
  };
  type: "location" | "caution" | "remboursement" | "remboursement_partiel" | "penalite" | "annulation";
  montant: number;
  statut: "en_attente" | "paye" | "rembourse" | "partiellement_rembourse" | "retenu" | "annule";
  note: string;
  createdAt: string;
};

export type PaiementListResult = {
  data: Paiement[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export async function getAdminAllPaiements(filters?: {
  statut?: string;
  type?: string;
  page?: number;
  limit?: number;
}): Promise<PaiementListResult> {
  const params = new URLSearchParams();
  if (filters?.statut) params.set("statut", filters.statut);
  if (filters?.type) params.set("type", filters.type);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit ?? 20));
  const response = await fetch(`${API_BASE_URL}/paiements?${params}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body;
}

export async function updateAdminPaiement(id: string, data: { statut?: string; note?: string }): Promise<Paiement> {
  const response = await fetch(`${API_BASE_URL}/paiements/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(data),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}

export async function getAdminPaiementsStats(): Promise<{
  total: number;
  enAttente: number;
  payes: number;
  rembourses: number;
  totalRevenus: number;
}> {
  const response = await fetch(`${API_BASE_URL}/paiements/stats`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}


export type Litige = {
  _id: string;
  locationId: {
    _id: string;
    materielId: { _id: string; nom: string };
    locataireId: { _id: string; nom: string; email: string };
    montantLocation: number;
    statut: string;
    dateDebut: string;
    dateFinPrevue: string;
  };
  ouvertPar: { _id: string; nom: string; email: string; photo?: string };
  adminId?: { _id: string; nom: string } | null;
  description: string;
  statut: "ouvert" | "en_cours" | "cloture";
  preuves: { soumisParId: string; type: "photo" | "texte"; contenu: string; createdAt: string }[];
  decisionAdmin: string;
  openedAt: string;
  closedAt?: string | null;
};

export type LitigeListResult = {
  data: Litige[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export async function getAdminAllLitiges(filters?: {
  statut?: string;
  page?: number;
  limit?: number;
}): Promise<LitigeListResult> {
  const params = new URLSearchParams();
  if (filters?.statut) params.set("statut", filters.statut);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit ?? 20));
  const response = await fetch(`${API_BASE_URL}/litiges?${params}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body;
}

export async function updateAdminLitige(id: string, data: { statut?: string; decisionAdmin?: string }): Promise<Litige> {
  const response = await fetch(`${API_BASE_URL}/litiges/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(data),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}

export async function getAdminLitigesStats(): Promise<{
  total: number;
  ouverts: number;
  enCours: number;
  clotures: number;
}> {
  const response = await fetch(`${API_BASE_URL}/litiges/stats`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}


export async function getAdminAllUsers(filters?: {
  role?: string;
  statut?: string;
  q?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: AuthUser[]; total: number; page: number; pages: number }> {
  const params = new URLSearchParams();
  if (filters?.role) params.set("role", filters.role);
  if (filters?.statut) params.set("statut", filters.statut);
  if (filters?.q) params.set("q", filters.q);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit ?? 20));
  const response = await fetch(`${API_BASE_URL}/users?${params}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body;
}


export async function adminToggleFeatured(id: string, featured: boolean): Promise<Materiel> {
  const response = await fetch(`${API_BASE_URL}/materiels/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify({ featured }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}


export async function getMyFavoris(): Promise<Materiel[]> {
  const response = await fetch(`${API_BASE_URL}/users/me/favoris`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}

export async function toggleFavori(materielId: string): Promise<{ added: boolean; data: string[] }> {
  const response = await fetch(`${API_BASE_URL}/users/me/favoris/${materielId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body;
}


export type UserLitige = {
  _id: string;
  locationId: {
    _id: string;
    materielId: { _id: string; nom: string; photos: { url: string }[] };
    dateDebut: string;
    statut: string;
    montantLocation: number;
  };
  description: string;
  statut: "ouvert" | "en_cours" | "cloture";
  decisionAdmin: string;
  openedAt: string;
  closedAt: string | null;
};

export async function getMyLitiges(page = 1): Promise<{ data: UserLitige[]; total: number; pages: number }> {
  const response = await fetch(`${API_BASE_URL}/litiges/my?page=${page}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body;
}

export async function createLitige(locationId: string, description: string): Promise<UserLitige> {
  const response = await fetch(`${API_BASE_URL}/litiges`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify({ locationId, description }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Erreur");
  return body.data;
}

export function getStatutColor(statut: string) {
  const colors: Record<string, string> = {
    en_attente: "bg-yellow-100 text-yellow-800",
    acceptee: "bg-green-100 text-green-800",
    en_cours: "bg-blue-100 text-blue-800",
    terminee: "bg-gray-100 text-gray-800",
    en_retard: "bg-red-100 text-red-800",
    en_litige: "bg-red-100 text-red-800",
    refusee: "bg-red-100 text-red-800",
    annulee: "bg-gray-100 text-gray-500",
  };
  return colors[statut] ?? "bg-gray-100 text-gray-800";
}
