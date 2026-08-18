import React, { useState, useEffect, useMemo, useContext, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UserContext } from "../../pages/UserContext";
import {
  getMyBusiness, getBusinessById, updateBusiness, createBusiness,
  uploadProfileImage, uploadCoverImage,
  createPost, getPostsByCommerce, deletePost, updatePostText,
  addImagesToPost, deleteImagesFromPost,
  replaceCommerceSchedules, scheduleFromBackend,
  getCategories, setCommerceCategory,
  getSubcategoryTags, getDescriptiveTags,
  addCommerceSubcategories, addCommerceTags, removeCommerceTagIds,
  createEvent, updateEvent, deleteEvent,
  addImagesToEvent, deleteImagesFromEvent,
  toLocalDateTime, getEventsByCommerce,
  getMisPromociones, getPromotionTags,
  createPromotion, updatePromotion, uploadPromotionImage,
} from "../../Api/Api";
import styles from "./ProfileHeader.module.css";
import { Loader, AlertCircle, Check, Edit2, Star, ArrowRight, Plus,
         Phone, Mail, Link2, Clock, Pencil, Trash2, Share2,
         FileText, CalendarDays, Sparkles, Megaphone } from "lucide-react";
import { FaWhatsapp, FaInstagram, FaFacebook } from "react-icons/fa";
import CreatePostModal from "./CreatePostModal";
import PostGallery from "./PostGallery";
import ScheduleEditor from "./components/ScheduleEditor";
import ScheduleDisplay from "./components/ScheduleDisplay";
import LocationPicker from "../LocationPicker/LocationPicker";
import LocationDisplay from "./components/LocationDisplay";
import { CoverEditor, AvatarEditor } from "./InlineImageEditor";
import PromotionModal from "./PromotionModal";
import PromotionCard from "./PromotionCard";
import PlanRestrictedModal from "./PlanRestrictedModal";
import OnboardingQuestionnaire from "../OnboardingQuestionnaire/OnboardingQuestionnaire";

const MOCK_BUSINESS = {
  idCommerce: 0,
  name: "La Cantina del Sur",
  description: "Cocina casera y regional en el corazón de la ciudad.",
  email: "lacantina@example.com",
  phone: "(362) 456-7890",
  link: "https://instagram.com/lacantina",
  location: { lat: -26.7909, lng: -60.4437, address: "Av. San Martín 123" },
  profileImage: { url: "https://i.pravatar.cc/150?img=12" },
  coverImage: { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&q=80" },
  categories: [],
};

const MOCK_POSTS = [
  {
    idPost: 1,
    description: "¡Mirá qué rico quedó el locro de hoy! 🫕",
    images: [{ url: "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=600&q=80", imageOrder: 1, idImage: 1 }],
    type: "post",
    postedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
];

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v) => v.replace(/\D/g, "").length >= 8;
const isValidUrl = (v) => { try { new URL(v); return true; } catch { return false; } };

// wa.me para Argentina necesita: 54 9 <código de área> <número>, sin el 0 inicial.
// El teléfono del negocio ya se guarda como (área) número — mismo criterio que
// se usa en Contacto.jsx para el WhatsApp de soporte.
const toWhatsappNumber = (phone) => {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  return `549${digits}`;
};

const normalizeBusiness = (d) => {
  // location puede venir del shape crudo del backend (d.address, con lat/lng
  // sueltos) o de un businessData ya normalizado anteriormente (d.location,
  // objeto plano {lat,lng,address}). Si solo miráramos d.address, cada vez
  // que se vuelve a normalizar un dato ya normalizado (ej. handleEdit /
  // handleCancel, que llaman normalizeBusiness(businessData)) la ubicación
  // se perdía, porque businessData ya no tiene .address, tiene .location.
  const addr = d?.address || d?.location;
  const location = addr?.lat && addr?.lng
    ? {
        idAddress: addr.idAddress || null,
        lat:       parseFloat(addr.lat),
        lng:       parseFloat(addr.lng),
        address:   addr.address || addr.street || "",
      }
    : null;

  return {
    name:         d?.name        || "",
    email:        d?.email       || "",
    phone:        d?.phone       || "",
    link:         d?.link ? String(d.link) : "",
    instagram:    d?.instagram   || "",
    facebook:     d?.facebook    || "",
    description:  d?.description || "",
    profileImage: d?.profileImage?.url || d?.profileImage || null,
    coverImage:   d?.coverImage?.url   || d?.coverImage   || null,
    schedules:    d?.schedules || [],
    category:     d?.category || null,
    tags:         d?.tags || [],
    location,
  };
};

const normalizePost = (p) => {
  if (p.text && Array.isArray(p.images) && typeof p.images[0] === "string") {
    return { id: p.id, text: p.text, images: p.images, imageDetails: [], type: "post",
             businessName: p.businessName, createdAt: p.createdAt };
  }
  const sorted = (p.images || []).sort((a, b) => a.imageOrder - b.imageOrder);
  return {
    id:           p.idPost,
    text:         p.description,
    images:       sorted.map((i) => i.url),
    imageDetails: sorted.map((i) => ({ id: i.idImage, url: i.url, order: i.imageOrder })),
    type:         "post",
    businessName: p.nameCommerce,
    createdAt:    p.postedAt,
  };
};

// Convierte el EventResponseDto crudo del backend (idEvent, description,
// startDate/endDate ISO, address, images) a la forma que espera el form de
// edición de CreatePostModal (id, text, title, date/time, endDate/endTime,
// location, imageDetails). Sin esto, "Editar" abría el modal vacío porque
// los nombres de campo no coincidían con lo que el form necesita.
const normalizeEvent = (ev) => {
  const [startDatePart, startTimePart] = (ev.startDate || "").split("T");
  const [endDatePart,   endTimePart]   = (ev.endDate   || "").split("T");
  const sortedImages = (ev.images || []).slice().sort((a, b) => (a.imageOrder ?? 0) - (b.imageOrder ?? 0));
  return {
    id:           ev.idEvent,
    text:         ev.description || "",
    title:        ev.title || "",
    date:         startDatePart || "",
    time:         startTimePart ? startTimePart.slice(0, 5) : "",
    endDate:      endDatePart || "",
    endTime:      endTimePart ? endTimePart.slice(0, 5) : "",
    location:     ev.address?.address || ev.address?.street || "",
    imageDetails: sortedImages.map((i) => ({ id: i.idImage, url: i.url, order: i.imageOrder })),
  };
};

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)  return "hace unos segundos";
  const m = Math.floor(s / 60);
  if (m < 60)  return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
};

const DEFAULT_SCHEDULE = {
  Lun: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
  Mar: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
  Mie: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
  Jue: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
  Vie: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
  Sab: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
  Dom: { cerrado: true,  deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "22:00" } },
};

const DAY_LABELS = { Lun: "Lunes", Mar: "Martes", Mie: "Miércoles", Jue: "Jueves", Vie: "Viernes", Sab: "Sábado", Dom: "Domingo" };

// Misma lógica que en ScheduleEditor.jsx (duplicada a propósito: mantener
// ese archivo exportando solo el componente evita romper el fast-refresh).
const toMinutes = (t) => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const isInvalidRange = (open, close) => {
  const o = toMinutes(open);
  const c = toMinutes(close);
  if (o == null || c == null) return false;
  return c <= o;
};

// Recorre los 7 días y devuelve el primer día con un horario que no tiene
// sentido (cierre antes o igual que la apertura), para bloquear el guardado.
const findInvalidScheduleDay = (schedule) => {
  for (const day of Object.keys(schedule || {})) {
    const hoy = schedule[day];
    if (!hoy || hoy.cerrado) continue;
    if (hoy.deCorrido) {
      if (isInvalidRange(hoy.open, hoy.close)) return day;
    } else {
      if (isInvalidRange(hoy.manana?.open, hoy.manana?.close)) return day;
      if (isInvalidRange(hoy.tarde?.open, hoy.tarde?.close)) return day;
    }
  }
  return null;
};

const useFormValidation = () => {
  const [errors, setErrors] = useState({});
  const validate = useCallback((field, value, rules) => {
    let error = "";
    if (rules.required && !value?.trim()) error = `${field} es obligatorio`;
    else if (rules.maxLength && value?.length > rules.maxLength) error = `Máximo ${rules.maxLength} caracteres`;
    else if (rules.email && value && !isValidEmail(value)) error = "Correo inválido";
    else if (rules.phone && value && !isValidPhone(value)) error = "Número inválido (mín. 8 dígitos)";
    else if (rules.url && value && !isValidUrl(value)) error = "URL inválida (ej: https://...)";
    setErrors((p) => ({ ...p, [field]: error }));
    return !error;
  }, []);
  const clearErrors = useCallback(() => setErrors({}), []);
  return { errors, validate, clearErrors };
};

const useBusinessStatus = (schedule) => {
  const [status, setStatus] = useState({ label: "", type: "neutral" });
  useEffect(() => {
    const dayMap = { lun:"Lun", mar:"Mar", "mié":"Mie", jue:"Jue", vie:"Vie", "sáb":"Sab", dom:"Dom" };
    const now    = new Date();
    const dayKey = now.toLocaleDateString("es-ES", { weekday: "short" }).toLowerCase();
    const today  = dayMap[dayKey];
    const hoy    = today && schedule[today];
    if (!hoy || hoy.cerrado) { setStatus({ label: "Cerrado", type: "closed" }); return; }
    const ahora  = now.toTimeString().slice(0, 5);
    const inRange = (a, b) => ahora >= a && ahora <= b;
    const isOpen  = hoy.deCorrido
      ? inRange(hoy.open, hoy.close)
      : inRange(hoy.manana.open, hoy.manana.close) || inRange(hoy.tarde.open, hoy.tarde.close);
    if (isOpen) { setStatus({ label: "Abierto ahora", type: "open" }); return; }
    if (!hoy.deCorrido && ahora < hoy.manana.open) setStatus({ label: `Abre a las ${hoy.manana.open}`, type: "neutral" });
    else if (!hoy.deCorrido && ahora < hoy.tarde.open) setStatus({ label: `Abre a las ${hoy.tarde.open}`, type: "neutral" });
    else if (hoy.deCorrido) setStatus({ label: `Abre a las ${hoy.open}`, type: "neutral" });
    else setStatus({ label: "Cerrado", type: "closed" });
  }, [schedule]);
  return status;
};

// Promociones requieren una suscripción activa (regla del backend).
// OJO: /usuario/traer/mis/datos NO devuelve subscription/plan hoy (DTO recortado),
// así que no podemos leer el tier actual del usuario desde ahí para saber a qué
// plan exacto ofrecerle el upgrade. Por eso, si está bloqueado, el CTA "Mejorar
// plan" apunta siempre al plan de entrada ("basic"). Cuando el backend agregue
// esos campos a la respuesta, se puede volver a calcular el "próximo tier" real
// (ver nota en el chat: pedido pendiente al equipo de backend).
const DEFAULT_UPGRADE_TARGET = "basic";

const ProfileHeader = ({
  isOwner        = false,
  businessData: externalData = null,
  useMock        = false,
}) => {
  const { user, favoriteCommerceIds, toggleFavoriteCommerce, openLoginModal } = useContext(UserContext);

  const [loading, setLoading] = useState({
    business: true, posts: false, profileImage: false,
    coverImage: false, savingBusiness: false, creatingPost: false, deletingPost: false,
    creatingPromotion: false, deletingPromotion: false,
  });
  const [errorMsg,   setErrorMsg]   = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [infoMsg,    setInfoMsg]    = useState("");

  const [isEditing,   setIsEditing]  = useState(false);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const DESCRIPTIVE_TAGS_COLLAPSE_AT = 5;
  const [showModal,   setShowModal]  = useState(false);
  const [modalType,   setModalType]  = useState("post");
  const [editingPost, setEditingPost]= useState(null);

  const [posts,      setPosts]     = useState([]);
  const [activeTab,  setActiveTab] = useState("posts");
  const [expandedEventIds, setExpandedEventIds] = useState(() => new Set());
  const EVENT_DESC_LIMIT = 220;
  const toggleEventExpanded = (idEvent) => {
    setExpandedEventIds(prev => {
      const next = new Set(prev);
      if (next.has(idEvent)) next.delete(idEvent); else next.add(idEvent);
      return next;
    });
  };
  const [businessId, setBusinessId]= useState(null);
  const [events, setEvents] = useState([]);

  // Promociones
  const [promotions,         setPromotions]         = useState([]);
  const [promotionTags,      setPromotionTags]       = useState([]);
  const [showPromotionModal, setShowPromotionModal]  = useState(false);
  const [editingPromotion,   setEditingPromotion]    = useState(null);
  const [promotionFormError, setPromotionFormError]  = useState("");

  // Acceso a promociones según la suscripción real del usuario.
  // null = todavía no lo sabemos (no mostrar nada restrictivo mientras carga)
  const [planAccess, setPlanAccess] = useState(null);
  const [showPlanRestrictedModal, setShowPlanRestrictedModal] = useState(false);
  const navigate = useNavigate();

  // Deep-link desde las cajas del Home: /negocios/:id?tab=posts&item=123
  const [searchParams] = useSearchParams();
  const [highlightKey, setHighlightKey] = useState(null);

  const [businessData, setBusinessData] = useState({
    name:"", email:"", phone:"", link:"", instagram:"", facebook:"", description:"",
    profileImage:null, coverImage:null, location:null, category:null,
  });
  const [schedule,      setSchedule]      = useState(DEFAULT_SCHEDULE);
  const [draft,         setDraft]         = useState(businessData);
  const [draftSchedule, setDraftSchedule] = useState(schedule);

  const [allCategories,    setAllCategories]    = useState([]);
  const [draftCategory,    setDraftCategory]    = useState(null);

  // Tags de subcategoría: selección múltiple (a diferencia de la categoría,
  // que es única). allSubcategoryTags = catálogo completo del backend;
  // draftSubcategoryTags = lo que el dueño va eligiendo mientras edita.
  const [allSubcategoryTags, setAllSubcategoryTags] = useState([]);
  const [draftSubcategoryTags, setDraftSubcategoryTags] = useState([]);

  // Tags descriptivos: también múltiples, pero además el dueño puede
  // escribir uno nuevo que no esté en el catálogo (ej: "brunch") y se crea
  // en el momento. allDescriptiveTags = catálogo para autocompletar.
  const [allDescriptiveTags, setAllDescriptiveTags] = useState([]);
  const [draftDescriptiveTags, setDraftDescriptiveTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [tagSaveError, setTagSaveError] = useState("");

  const [pendingCover,  setPendingCover]  = useState(null);
  const [pendingAvatar, setPendingAvatar] = useState(null);
  const [, setCoverPos]  = useState({ posY: 50, zoom: 1 });
  const [, setAvatarPos] = useState({ x: 50, y: 50, zoom: 1 });

  const { errors, validate, clearErrors } = useFormValidation();
  const statusInfo = useBusinessStatus(schedule);

  // businessData.tags viene mezclado (subcategoría + descriptivo + lo que
  // sea), lo separamos acá para mostrar/editar cada tipo por su lado.
  const currentSubcategoryTags = useMemo(
    () => (businessData.tags || []).filter(t => t.type === "SUBCATEGORY"),
    [businessData.tags]);
  const currentDescriptiveTags = useMemo(
    () => (businessData.tags || []).filter(t => t.type === "DESCRIPTIVE"),
    [businessData.tags]);

  const isFav = businessId ? (favoriteCommerceIds?.has(businessId) ?? false) : false;

  const handleToggleFav = useCallback(async () => {
    if (!user) { openLoginModal(); return; }
    if (!businessId) return;
    const commerce = {
      idCommerce:   businessId,
      id:           businessId,
      name:         businessData.name,
      profileImage: businessData.profileImage,
    };
    await toggleFavoriteCommerce(commerce);
  }, [user, businessId, businessData, toggleFavoriteCommerce, openLoginModal]);

  useEffect(() => () => {
    if (pendingCover?.previewUrl)  URL.revokeObjectURL(pendingCover.previewUrl);
    if (pendingAvatar?.previewUrl) URL.revokeObjectURL(pendingAvatar.previewUrl);
  }, []);

  useEffect(() => {
    getCategories()
      .then(cats => setAllCategories(Array.isArray(cats) ? cats : []))
      .catch(() => setAllCategories([]));
  }, []);

  useEffect(() => {
    getSubcategoryTags()
      .then(tags => setAllSubcategoryTags(Array.isArray(tags) ? tags : []))
      .catch(() => setAllSubcategoryTags([]));
    getDescriptiveTags()
      .then(tags => setAllDescriptiveTags(Array.isArray(tags) ? tags : []))
      .catch(() => setAllDescriptiveTags([]));
  }, []);

  useEffect(() => {
    if (useMock) {
      const d = normalizeBusiness(MOCK_BUSINESS);
      setBusinessData(d); setDraft(d);
      setBusinessId(MOCK_BUSINESS.idCommerce);
      setPosts(MOCK_POSTS.map(normalizePost));
      setLoading((p) => ({ ...p, business: false }));
      return;
    }
    if (externalData) {
      const d = normalizeBusiness(externalData);
      setBusinessData(d); setDraft(d);
      setDraftCategory(d.category);
      if (d.schedules && d.schedules.length > 0) {
        const loaded = scheduleFromBackend(d.schedules);
        setSchedule(loaded); setDraftSchedule(loaded);
      }
      const id = externalData.idCommerce || externalData.id_business;
      setBusinessId(id);
      setLoading((p) => ({ ...p, business: false }));
      if (id) loadPosts(id);
      return;
    }
    if (user?.id_user) loadBusinessData();
    else setLoading((p) => ({ ...p, business: false }));
  }, [user?.id_user, externalData, useMock]);

  // ── Deep-link desde las cajas del Home (?tab=posts|events&item=ID) ─────
  // Espera a que posts/eventos terminen de cargar para que el elemento ya esté en el DOM.
  useEffect(() => {
    if (loading.posts) return;
    const tabParam  = searchParams.get("tab");
    const itemParam = searchParams.get("item");
    if (tabParam !== "posts" && tabParam !== "events") return;

    setActiveTab(tabParam);
    const key = `${tabParam}-${itemParam}`;
    setHighlightKey(key);

    const scrollTimer = setTimeout(() => {
      document.getElementById(key)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    const clearTimer = setTimeout(() => setHighlightKey(null), 3000);

    return () => { clearTimeout(scrollTimer); clearTimeout(clearTimer); };
  }, [loading.posts, searchParams]);

  const flash = (setter, msg, ms = 3500) => { setter(msg); setTimeout(() => setter(""), ms); };
  const flashError   = (m) => flash(setErrorMsg,   m, 5000);
  const flashSuccess = (m) => flash(setSuccessMsg, m);
  const flashInfo    = (m) => flash(setInfoMsg,    m);
  const setLoad = (key, val) => setLoading((p) => ({ ...p, [key]: val }));

  // idCommerce: comercio actualmente mostrado. Se lo pasamos a getMisPromociones
  // para filtrar client-side y que no se mezclen promos de otros comercios del
  // mismo dueño (el endpoint del back solo filtra por usuario, no por comercio).
  const loadPromotions = useCallback(async (idCommerce) => {
    if (!isOwner || !idCommerce) return;
    try {
      const [promos, tags] = await Promise.all([
        getMisPromociones(idCommerce),
        getPromotionTags(),
      ]);
      setPromotions(Array.isArray(promos) ? promos : []);
      setPromotionTags(Array.isArray(tags) ? tags : []);
      setPlanAccess({ allowed: true, targetPlanId: null });
    } catch (err) {
      if (err.isPlanError) {
        setPlanAccess({ allowed: false, targetPlanId: DEFAULT_UPGRADE_TARGET });
      } else {
        flashError(err.message || "Error al cargar promociones");
      }
    }
  }, [isOwner]);

  const loadBusinessData = async () => {
    setLoad("business", true);
    try {
      const biz = await getMyBusiness();
      if (biz) {
        setBusinessId(biz.id_business);
        const d = normalizeBusiness(biz);
        setBusinessData(d); setDraft(d);
        setDraftCategory(d.category);
        if (d.schedules && d.schedules.length > 0) {
          const loaded = scheduleFromBackend(d.schedules);
          setSchedule(loaded); setDraftSchedule(loaded);
        }
        await loadPosts(biz.id_business);
      } else {
        const d = normalizeBusiness({ name: user.name ? `${user.name} ${user.lastname || ""}`.trim() : "" });
        setBusinessData(d); setDraft(d);
        setDraftCategory(null);
      }
    } catch (err) { flashError(err.message || "Error al cargar el negocio"); }
    finally { setLoad("business", false); }
  };

  const loadPosts = async (id) => {
    if (!id) return;
    setLoad("posts", true);
    try {
      const [rawPosts, rawEvents] = await Promise.all([
        getPostsByCommerce(id),
        getEventsByCommerce(id),
      ]);
      setPosts(Array.isArray(rawPosts) ? rawPosts.map(normalizePost) : []);
      setEvents(Array.isArray(rawEvents) ? rawEvents : []);
      if (isOwner) await loadPromotions(id);
    } catch { setPosts([]); setEvents([]); }
    finally { setLoad("posts", false); }
  };

  const uploadImage = async (type, file) => {
    if (!businessId) return;
    setLoad(type, true);
    try {
      const fn  = type === "profileImage" ? uploadProfileImage : uploadCoverImage;
      const res = await fn(businessId, file);
      const url = res.profileImage || res.coverImage;
      if (!url) throw new Error("No se recibió la URL");
      setBusinessData((p) => ({ ...p, [type]: url }));
      setDraft((p) => ({ ...p, [type]: url }));
      flashSuccess("✅ Imagen actualizada");
    } catch (err) { flashError(err.message); }
    finally { setLoad(type, false); }
  };

  const handleEdit = () => {
    setDraft(normalizeBusiness(businessData));
    setDraftSchedule(schedule);
    setDraftCategory(businessData.category);
    setDraftSubcategoryTags(currentSubcategoryTags);
    setDraftDescriptiveTags(currentDescriptiveTags);
    setNewTagInput(""); setTagSaveError("");
    setIsEditing(true);
    setErrorMsg(""); setSuccessMsg("");
    setPendingCover(null); setPendingAvatar(null);
    clearErrors();
  };

  const handleCancel = () => {
    setDraft(normalizeBusiness(businessData));
    setDraftSchedule(schedule);
    setDraftCategory(businessData.category);
    setDraftSubcategoryTags(currentSubcategoryTags);
    setDraftDescriptiveTags(currentDescriptiveTags);
    setNewTagInput(""); setTagSaveError("");
    setIsEditing(false);
    setErrorMsg(""); setSuccessMsg("");
    if (pendingCover?.previewUrl)  URL.revokeObjectURL(pendingCover.previewUrl);
    if (pendingAvatar?.previewUrl) URL.revokeObjectURL(pendingAvatar.previewUrl);
    setPendingCover(null); setPendingAvatar(null);
    clearErrors();
  };

  const handleInputChange = useCallback((field) => (e) =>
    setDraft((p) => ({ ...p, [field]: e.target.value })), []);

  const handlePhoneChange = useCallback((e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    const fmt = raw.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
    setDraft((p) => ({ ...p, phone: fmt }));
  }, []);

  // Selección única: si tocás la categoría ya elegida, la deseleccionás;
  // si tocás otra, la reemplaza (nunca queda más de una activa).
  const selectDraftCategory = useCallback((cat) => {
    setDraftCategory(prev =>
      prev && String(prev.idCategory) === String(cat.idCategory) ? null : cat
    );
  }, []);

  // Comparación con String() porque el id puede venir como number del backend
  // y como string desde otros puntos del form; sin esto la categoría guardada
  // nunca aparecía marcada al editar.
  const isDraftCategorySelected = useCallback((cat) =>
    !!draftCategory && String(draftCategory.idCategory) === String(cat.idCategory), [draftCategory]);

  // Subcategorías: selección múltiple (a diferencia de la categoría)
  const toggleDraftSubcategory = useCallback((tag) => {
    setDraftSubcategoryTags(prev => {
      const already = prev.some(t => t.nameTag === tag.nameTag);
      return already ? prev.filter(t => t.nameTag !== tag.nameTag) : [...prev, tag];
    });
  }, []);
  const isDraftSubcategorySelected = useCallback((tag) =>
    draftSubcategoryTags.some(t => t.nameTag === tag.nameTag), [draftSubcategoryTags]);

  // Tags descriptivos: se pueden sacar con la X del chip, o agregar
  // escribiendo texto libre (si ya existe en el catálogo lo reusa, si no,
  // lo crea recién al guardar — ver handleSave).
  const removeDraftDescriptiveTag = useCallback((tag) => {
    setDraftDescriptiveTags(prev => prev.filter(t => t.nameTag !== tag.nameTag));
  }, []);

  const addDraftDescriptiveTagFromInput = useCallback(() => {
    const name = newTagInput.trim();
    if (!name) return;
    if (name.length > 40) { setTagSaveError("Máximo 40 caracteres por etiqueta."); return; }
    const alreadyAdded = draftDescriptiveTags.some(t => t.nameTag.toLowerCase() === name.toLowerCase());
    if (alreadyAdded) { setNewTagInput(""); return; }
    // Si ya existe en el catálogo con ese nombre exacto, lo reusamos tal cual
    // (mismo type/objeto) en vez de tratarlo como uno nuevo a crear.
    const existing = allDescriptiveTags.find(t => t.nameTag.toLowerCase() === name.toLowerCase());
    setDraftDescriptiveTags(prev => [...prev, existing || { nameTag: name, type: "DESCRIPTIVE" }]);
    setNewTagInput("");
    setTagSaveError("");
  }, [newTagInput, draftDescriptiveTags, allDescriptiveTags]);

  // Fallback para contextos NO seguros (HTTP en red local, sin HTTPS/localhost),
  // donde navigator.clipboard directamente no existe. Usa el método viejo
  // (deprecado pero soportado) con un textarea oculto.
  const legacyCopy = (text) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    let succeeded = false;
    try {
      succeeded = document.execCommand("copy");
    } catch {
      succeeded = false;
    }
    document.body.removeChild(textarea);
    return succeeded;
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: businessData.name || "Dónde Queda?",
      text: `Mirá ${businessData.name || "este negocio"} en Dónde Queda`,
      url,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* el usuario canceló, no hacemos nada */ }
      return;
    }

    // Clipboard API moderna (requiere HTTPS o localhost)
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        flashSuccess("🔗 Link copiado al portapapeles");
        return;
      } catch {
        // seguimos al fallback
      }
    }

    // Fallback para HTTP/red local
    if (legacyCopy(url)) {
      flashSuccess("🔗 Link copiado al portapapeles");
    } else {
      flashError("No se pudo copiar el link");
    }
  };

  const handleSave = async () => {
    if (!isOwner) { flashError("No tenés permisos para editar este negocio"); return; }
    const t = (v) => (v || "").trim();
    const name  = t(draft.name);
    const desc  = t(draft.description);
    const email = t(draft.email);
    const phone = t(draft.phone);
    const link       = t(draft.link);
    const instagram  = t(draft.instagram);
    const facebook   = t(draft.facebook);
    let valid = true;
    if (!validate("name", name, { required: true, maxLength: 100 })) valid = false;
    if (!validate("description", desc, { required: true, maxLength: 500 })) valid = false;
    if (email && !validate("email", email, { email: true })) valid = false;
    if (phone && !validate("phone", phone, { phone: true })) valid = false;
    if (link      && !validate("link",      link,      { url: true })) valid = false;
    if (instagram && !validate("instagram", instagram, { url: true })) valid = false;
    if (facebook  && !validate("facebook",  facebook,  { url: true })) valid = false;
    if (!valid) { flashError("Revisá los campos marcados"); return; }

    const invalidDay = findInvalidScheduleDay(draftSchedule);
    if (invalidDay) {
      flashError(`El horario del ${DAY_LABELS[invalidDay]} no es válido: el cierre debe ser después de la apertura`);
      return;
    }

    setLoad("savingBusiness", true);
    try {
      const cleanPhone = draft.phone.replace(/\D/g, "");
      const payload = {
        name, description: desc, email, phone: cleanPhone,
        link, instagram, facebook, location: draft.location || null,
      };

      let currentBusinessId = businessId;
      if (businessId) {
        await updateBusiness(businessId, payload);
      } else {
        const res = await createBusiness(payload);
        currentBusinessId = res.id_business;
        setBusinessId(currentBusinessId);
      }

      if (pendingCover?.file)  await uploadImage("coverImage",   pendingCover.file);
      if (pendingAvatar?.file) await uploadImage("profileImage", pendingAvatar.file);

      const idToUse = businessId || currentBusinessId;
      if (idToUse) {
        try {
          await replaceCommerceSchedules(idToUse, draftSchedule);
          setSchedule(draftSchedule);
        } catch (scheduleError) {
          console.warn("⚠️ Error guardando horarios:", scheduleError.message);
          flashInfo("Datos guardados. Hubo un problema con los horarios, intentá de nuevo.");
        }
      }

      if (idToUse && draftCategory && String(draftCategory.idCategory) !== String(businessData.category?.idCategory)) {
        try {
          await setCommerceCategory(idToUse, draftCategory.idCategory);
        } catch (catError) {
          console.warn("⚠️ Error guardando la categoría:", catError.message);
          flashInfo("Datos guardados. Hubo un problema con la categoría, intentá de nuevo.");
        }
      }

      if (idToUse) {
        // ⚠️ Asunción: los tags que vienen en businessData.tags traen idTag
        // (schema "Tag" del swagger), aunque CommerceResponseDto.tags está
        // tipado como TagDto (que solo tiene nameTag+type, sin id). Si en la
        // práctica no viene idTag, remove no va a poder identificar cuál
        // borrar — confirmar con el back si hace falta.
        const tagId = (t) => t.idTag ?? t.id ?? null;

        // Subcategorías (selección múltiple)
        const currentSubNames = new Set(currentSubcategoryTags.map(t => t.nameTag));
        const draftSubNames   = new Set(draftSubcategoryTags.map(t => t.nameTag));
        const subsToAdd    = draftSubcategoryTags.filter(t => !currentSubNames.has(t.nameTag));
        const subsToRemove = currentSubcategoryTags.filter(t => !draftSubNames.has(t.nameTag) && tagId(t) != null);
        try {
          if (subsToAdd.length > 0) await addCommerceSubcategories(idToUse, subsToAdd.map(t => t.nameTag));
          if (subsToRemove.length > 0) await removeCommerceTagIds(idToUse, subsToRemove.map(tagId));
        } catch (tagError) {
          console.warn("⚠️ Error guardando subcategorías:", tagError.message);
          flashInfo("Datos guardados. Hubo un problema con las subcategorías, intentá de nuevo.");
        }

        // Tags descriptivos (selección múltiple + creación libre)
        const currentDescNames = new Set(currentDescriptiveTags.map(t => t.nameTag));
        const draftDescNames   = new Set(draftDescriptiveTags.map(t => t.nameTag));
        const descToAdd    = draftDescriptiveTags.filter(t => !currentDescNames.has(t.nameTag));
        const descToRemove = currentDescriptiveTags.filter(t => !draftDescNames.has(t.nameTag) && tagId(t) != null);
        try {
          // addCommerceTags hace upsert por nombre (crea la etiqueta si no
          // existe todavía), así que no hace falta llamar a createTag aparte.
          if (descToAdd.length > 0) await addCommerceTags(idToUse, descToAdd.map(t => t.nameTag));
          if (descToRemove.length > 0) await removeCommerceTagIds(idToUse, descToRemove.map(tagId));
        } catch (tagError) {
          console.warn("⚠️ Error guardando etiquetas:", tagError.message);
          flashInfo("Datos guardados. Hubo un problema con las etiquetas, intentá de nuevo.");
        }
      }

      if (externalData) {
        const biz = await getBusinessById(currentBusinessId);
        if (biz) {
          const d = normalizeBusiness(biz);
          setBusinessData(d); setDraft(d);
          setDraftCategory(d.category);
          setDraftSubcategoryTags((d.tags || []).filter(t => t.type === "SUBCATEGORY"));
          setDraftDescriptiveTags((d.tags || []).filter(t => t.type === "DESCRIPTIVE"));
          if (d.schedules && d.schedules.length > 0) {
            const loaded = scheduleFromBackend(d.schedules);
            setSchedule(loaded); setDraftSchedule(loaded);
          }
        }
      } else {
        await loadBusinessData();
      }

      setPendingCover(null); setPendingAvatar(null);
      setIsEditing(false);
      flashSuccess("✅ Datos guardados correctamente");
    } catch (err) { flashError(err.message || "Error al guardar"); }
    finally { setLoad("savingBusiness", false); }
  };

  const handleCoverFileSelect = useCallback((file, previewUrl) => {
    if (pendingCover?.previewUrl) URL.revokeObjectURL(pendingCover.previewUrl);
    const url = previewUrl || URL.createObjectURL(file);
    setPendingCover({ file, previewUrl: url });
  }, [pendingCover]);

  const handleCoverConfirm = useCallback((posY, zoom) => {
    setCoverPos({ posY, zoom });
    setDraft(p => ({ ...p, coverImage: pendingCover?.previewUrl || p.coverImage }));
  }, [pendingCover]);

  const handleCoverDiscard = useCallback(() => {
    if (pendingCover?.previewUrl) URL.revokeObjectURL(pendingCover.previewUrl);
    setPendingCover(null);
  }, [pendingCover]);

  const handleAvatarFileSelect = useCallback((file, previewUrl) => {
    if (pendingAvatar?.previewUrl) URL.revokeObjectURL(pendingAvatar.previewUrl);
    const url = previewUrl || URL.createObjectURL(file);
    setPendingAvatar({ file, previewUrl: url });
  }, [pendingAvatar]);

  const handleAvatarConfirm = useCallback((x, y, zoom) => {
    setAvatarPos({ x, y, zoom });
    setDraft(p => ({ ...p, profileImage: pendingAvatar?.previewUrl || p.profileImage }));
  }, [pendingAvatar]);

  const handleAvatarDiscard = useCallback(() => {
    if (pendingAvatar?.previewUrl) URL.revokeObjectURL(pendingAvatar.previewUrl);
    setPendingAvatar(null);
  }, [pendingAvatar]);

  const sortedPosts  = useMemo(() =>
    posts.filter(p => p.type !== "event").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [posts]);
  const sortedEvents = useMemo(() =>
    [...events].sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0)),
    [events]);

  const handleSubmitPost = async (data) => {
    if (!isOwner) { flashError("No tenés permisos"); return; }
    if (!businessId) { flashError("Creá el negocio primero"); return; }
    const id = typeof businessId === "string" ? parseInt(businessId, 10) : businessId;
    if (isNaN(id)) { flashError("ID de comercio inválido"); return; }

    setLoad("creatingPost", true);
    try {
      if (modalType === "event") {
        const eventDto = {
          title:           data.title || data.text,
          description:     data.text,
          startDate:       toLocalDateTime(data.date, data.time),
          endDate:         toLocalDateTime(data.endDate || data.date, data.endTime || data.time),
          idCommerceOwner: id,
          address:         data.location ? { address: data.location } : null,
        };

        if (editingPost) {
          await updateEvent(editingPost.id, eventDto);
          if (data.imagesToDelete?.length) await deleteImagesFromEvent(editingPost.id, data.imagesToDelete);
          if (data.imageFiles?.length) await addImagesToEvent(editingPost.id, data.imageFiles);
          flashSuccess("✅ Evento actualizado");
        } else {
          if (!data.imageFiles?.length) { flashError("Subí al menos una imagen"); return; }
          await createEvent(eventDto, data.imageFiles);
          flashSuccess("✅ Evento creado");
        }
      } else {
        if (editingPost) {
          await updatePostText(editingPost.id, data.text, id);
          if (data.imagesToDelete?.length) await deleteImagesFromPost(editingPost.id, data.imagesToDelete);
          if (data.imageFiles?.length) await addImagesToPost(editingPost.id, data.imageFiles);
          flashSuccess("✅ Publicación actualizada");
        } else {
          if (!data.imageFiles?.length) { flashError("Subí al menos una imagen"); return; }
          await createPost(data.text, id, data.imageFiles);
          flashSuccess("✅ Publicación creada");
        }
      }
      await loadPosts(id);
      setShowModal(false);
    } catch (err) {
      if (err.isPlanError) {
        setPlanAccess({ allowed: false, targetPlanId: DEFAULT_UPGRADE_TARGET });
        setShowPlanRestrictedModal(true);
      } else {
        flashError(err.message || "Error al guardar");
      }
    }
    finally { setLoad("creatingPost", false); setEditingPost(null); }
  };

  const handleDeletePost = async (postId, type = "post") => {
    if (!isOwner) { flashError("No tenés permisos"); return; }
    if (!window.confirm("¿Eliminar? Esta acción no se puede deshacer.")) return;
    setLoad("deletingPost", true);
    try {
      if (type === "event") {
        await deleteEvent(postId);
      } else {
        await deletePost(postId);
      }
      setPosts((p) => p.filter((x) => x.id !== postId));
      flashSuccess("✅ Eliminado");
    } catch (err) { flashError(err.message || "Error al eliminar"); }
    finally { setLoad("deletingPost", false); }
  };

  const handleSubmitPromotion = async (dto, imageFile) => {
    if (!isOwner || !businessId) return;
    setLoad("creatingPromotion", true);
    setPromotionFormError("");
    try {
      let result;
      if (editingPromotion) {
        result = await updatePromotion(editingPromotion.idPromotion, dto);
        if (imageFile) await uploadPromotionImage(editingPromotion.idPromotion, imageFile);
        flashSuccess("✅ Promoción actualizada");
      } else {
        result = await createPromotion(businessId, dto);
        if (imageFile) await uploadPromotionImage(result.idPromotion, imageFile);
        flashSuccess("✅ Promoción creada");
      }
      await loadPromotions(businessId);
      setShowPromotionModal(false);
      setEditingPromotion(null);
    } catch (err) {
      // El error queda DENTRO del modal (no solo como toast de página), porque
      // acá es donde va a aparecer el 400 real de "necesitás plan activo" una
      // vez que el back confirme el mensaje — y el usuario tiene que verlo sin
      // que el modal se lo tape.
      setPromotionFormError(err.message || "Error al guardar la promoción");
    } finally {
      setLoad("creatingPromotion", false);
    }
  };

  const handleOpenPromotionModal = () => {
    if (planAccess && !planAccess.allowed) { setShowPlanRestrictedModal(true); return; }
    setPromotionFormError("");
    setEditingPromotion(null);
    setShowPromotionModal(true);
  };

  const handleClosePromotionModal = () => {
    setShowPromotionModal(false);
    setEditingPromotion(null);
    setPromotionFormError("");
  };

  const handleUpgradePlan = () => {
    setShowPlanRestrictedModal(false);
    navigate(`/checkout/${planAccess?.targetPlanId || "basic"}`);
  };

  const openModal = (type, post = null) => {
    setModalType(type); setEditingPost(post); setShowModal(true);
  };

  const statusDotClass  = { open: styles.statusDotOpen, closed: styles.statusDotClosed, neutral: styles.statusDotNeutral };
  const statusTextClass = { open: styles.statusTextOpen, closed: styles.statusTextClosed, neutral: styles.statusTextNeutral };

  if (loading.business) return (
    <div className={styles.profilePage}>
      <div className={styles.loadingScreen}>
        <Loader size={40} className={styles.spinnerIcon} />
        <span>Cargando negocio...</span>
      </div>
    </div>
  );

  const isBusy = loading.savingBusiness || loading.profileImage || loading.coverImage;

  return (
    <div className={styles.profilePage}>

      <div className={styles.bannerStack}>
        {errorMsg   && <div className={`${styles.banner} ${styles.bannerError}`}><AlertCircle size={16}/>{errorMsg}</div>}
        {successMsg && <div className={`${styles.banner} ${styles.bannerSuccess}`}><Check size={16}/>{successMsg}</div>}
        {infoMsg    && <div className={`${styles.banner} ${styles.bannerInfo}`}><Loader size={16} className={styles.spinnerIcon}/>{infoMsg}</div>}
        {(loading.profileImage || loading.coverImage) &&
          <div className={`${styles.banner} ${styles.bannerInfo}`}><Loader size={16} className={styles.spinnerIcon}/>Subiendo imagen...</div>}
      </div>

      <div className={styles.profileBlock}>

        <CoverEditor
          currentImage={isEditing ? draft.coverImage : businessData.coverImage}
          isEditing={isEditing}
          onFileSelect={handleCoverFileSelect}
          pendingFile={pendingCover}
          onConfirm={handleCoverConfirm}
          onDiscard={handleCoverDiscard}
        />

        <div className={styles.profileTop}>
          <AvatarEditor
            currentImage={isEditing ? draft.profileImage : businessData.profileImage}
            isEditing={isEditing}
            onFileSelect={handleAvatarFileSelect}
            pendingFile={pendingAvatar}
            onConfirm={handleAvatarConfirm}
            onDiscard={handleAvatarDiscard}
          />

          <div className={styles.topActions}>
            {!isEditing && (
              <button className={styles.btnShare} onClick={handleShare} title="Compartir">
                <Share2 size={14}/> Compartir
              </button>
            )}
            {isOwner && (
              !isEditing ? (
                <button className={styles.btnEdit} onClick={handleEdit}><Edit2 size={14}/> Editar perfil</button>
              ) : (
                <>
                  <button className={styles.btnCancel} onClick={handleCancel} disabled={isBusy}>Cancelar</button>
                  <button className={styles.btnSave}   onClick={handleSave}   disabled={isBusy}>
                    {loading.savingBusiness
                      ? <><Loader size={14} className={styles.spinnerIcon}/> Guardando...</>
                      : <><Check size={14}/> Guardar</>}
                  </button>
                </>
              )
            )}
          </div>
        </div>

        <div className={styles.profileMeta}>
          {isEditing ? (
            <>
              <input className={styles.editNameInput} value={draft.name}
                onChange={(e) => { handleInputChange("name")(e); validate("name", e.target.value, { required: true, maxLength: 100 }); }}
                placeholder="Nombre del negocio *" maxLength={100} />
              {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
              <span className={styles.charCount}>{draft.name.length}/100</span>
            </>
          ) : (
            <>
              <h1 className={styles.businessName}>{businessData.name || "Sin nombre"}</h1>

              {(businessData.category || currentSubcategoryTags.length > 0) && (
                <p className={styles.categoryLine}>
                  {[businessData.category?.name, ...currentSubcategoryTags.map(t => t.nameTag)]
                    .filter(Boolean).join(" · ")}
                </p>
              )}

              {currentDescriptiveTags.length > 0 && (
                <div className={styles.descriptiveTagsView}>
                  {(tagsExpanded ? currentDescriptiveTags : currentDescriptiveTags.slice(0, DESCRIPTIVE_TAGS_COLLAPSE_AT))
                    .map(t => (
                      <span key={t.nameTag} className={styles.descriptiveChipView}>{t.nameTag}</span>
                    ))}
                  {!tagsExpanded && currentDescriptiveTags.length > DESCRIPTIVE_TAGS_COLLAPSE_AT && (
                    <button type="button" className={styles.tagsMoreBtn} onClick={() => setTagsExpanded(true)}>
                      +{currentDescriptiveTags.length - DESCRIPTIVE_TAGS_COLLAPSE_AT} más
                    </button>
                  )}
                </div>
              )}

              <div className={styles.statusRow}>
                <span className={`${styles.statusDot} ${statusDotClass[statusInfo.type]}`}/>
                <span className={`${styles.statusText} ${statusTextClass[statusInfo.type]}`}>{statusInfo.label}</span>
              </div>
            </>
          )}
        </div>

        {isOwner && !isEditing && businessId && (
          <OnboardingQuestionnaire businessId={businessId} tags={businessData.tags} />
        )}

        <div className={styles.infoGrid}>
          <div className={styles.infoCol}>
            <p className={styles.infoSectionTitle}>Sobre el negocio</p>
            {isEditing ? (
              <>
                <textarea className={styles.editTextarea} value={draft.description}
                  onChange={(e) => { handleInputChange("description")(e); validate("description", e.target.value, { required: true, maxLength: 500 }); }}
                  placeholder="Descripción del negocio *" maxLength={500} />
                {errors.description && <span className={styles.fieldError}>{errors.description}</span>}
                <span className={styles.charCount}>{draft.description.length}/500</span>

                <div className={styles.categoryEditorSection}>
                  <p className={styles.infoSectionTitle} style={{ marginTop: 16 }}>Categoría</p>
                  <div className={styles.categoryChipsEdit} role="radiogroup" aria-label="Categoría del negocio">
                    {allCategories.map(cat => (
                      <button
                        key={cat.idCategory}
                        type="button"
                        role="radio"
                        aria-checked={isDraftCategorySelected(cat)}
                        className={`${styles.categoryChipEdit} ${isDraftCategorySelected(cat) ? styles.categoryChipEditSelected : ""}`}
                        onClick={() => selectDraftCategory(cat)}
                      >
                        {isDraftCategorySelected(cat) && <span>✓ </span>}
                        {cat.name}
                      </button>
                    ))}
                  </div>
                  <p className={styles.categoryCount}>
                    {draftCategory ? `Categoría: ${draftCategory.name}` : "Elegí una categoría"}
                  </p>
                </div>

                {allSubcategoryTags.length > 0 && (
                  <div className={styles.categoryEditorSection}>
                    <p className={styles.infoSectionTitle}>Subcategorías <span className={styles.optionalHint}>(podés elegir varias)</span></p>
                    <div className={styles.categoryChipsEdit}>
                      {allSubcategoryTags.map(tag => (
                        <button
                          key={tag.nameTag}
                          type="button"
                          className={`${styles.categoryChipEdit} ${isDraftSubcategorySelected(tag) ? styles.categoryChipEditSelected : ""}`}
                          onClick={() => toggleDraftSubcategory(tag)}
                        >
                          {isDraftSubcategorySelected(tag) && <span>✓ </span>}
                          {tag.nameTag}
                        </button>
                      ))}
                    </div>
                    {draftSubcategoryTags.length > 0 && (
                      <p className={styles.categoryCount}>
                        {draftSubcategoryTags.length} subcategoría{draftSubcategoryTags.length !== 1 ? "s" : ""} seleccionada{draftSubcategoryTags.length !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                )}

                <div className={styles.categoryEditorSection}>
                  <p className={styles.infoSectionTitle}>Etiquetas descriptivas <span className={styles.optionalHint}>(ej: café, pizza, delivery)</span></p>
                  {draftDescriptiveTags.length > 0 && (
                    <div className={styles.tagsChipsEdit}>
                      {draftDescriptiveTags.map(tag => (
                        <span key={tag.nameTag} className={styles.tagChipRemovable}>
                          #{tag.nameTag}
                          <button
                            type="button"
                            className={styles.tagChipRemoveBtn}
                            onClick={() => removeDraftDescriptiveTag(tag)}
                            aria-label={`Quitar ${tag.nameTag}`}
                          >×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className={styles.tagInputRow}>
                    <input
                      type="text"
                      className={styles.tagInput}
                      value={newTagInput}
                      onChange={(e) => { setNewTagInput(e.target.value); if (tagSaveError) setTagSaveError(""); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addDraftDescriptiveTagFromInput();
                        }
                      }}
                      placeholder="Escribí una etiqueta y presioná Enter"
                      maxLength={40}
                      list="descriptive-tags-suggestions"
                    />
                    <datalist id="descriptive-tags-suggestions">
                      {allDescriptiveTags.map(t => <option key={t.nameTag} value={t.nameTag} />)}
                    </datalist>
                    <button type="button" className={styles.tagAddBtn} onClick={addDraftDescriptiveTagFromInput}>
                      Agregar
                    </button>
                  </div>
                  {tagSaveError && <span className={styles.fieldError}>{tagSaveError}</span>}
                </div>
              </>
            ) : (
              <p className={styles.descriptionText}>{businessData.description || "Sin descripción"}</p>
            )}

            {!isEditing && <ScheduleDisplay schedule={schedule} />}
            {isEditing && (
              <ScheduleEditor schedule={draftSchedule} onChange={(day, field, val) => {
                setDraftSchedule((prev) => {
                  const next = { ...prev };
                  if (field === "cerrado" || field === "deCorrido") {
                    next[day] = { ...next[day], [field]: val };
                  } else if (field.includes(".")) {
                    const [sec, sub] = field.split(".");
                    next[day] = { ...next[day], [sec]: { ...next[day][sec], [sub]: val } };
                  } else {
                    next[day] = { ...next[day], [field]: val };
                  }
                  return next;
                });
              }} />
            )}
          </div>

          <div className={styles.infoCol}>
            <p className={styles.infoSectionTitle}>Contacto</p>

            <div className={styles.contactRow}>
              <Phone size={16} className={styles.contactIcon}/>
              {isEditing ? (
                <div style={{ flex: 1 }}>
                  <input className={`${styles.editInput} ${errors.phone ? styles.inputError : ""}`}
                    type="tel" value={draft.phone}
                    onChange={(e) => { handlePhoneChange(e); validate("phone", e.target.value, { phone: true }); }}
                    placeholder="Teléfono" />
                  {errors.phone && <span className={styles.fieldError}>{errors.phone}</span>}
                </div>
              ) : (
                <span className={businessData.phone ? styles.contactText : styles.contactEmpty}>
                  {businessData.phone || "Sin teléfono"}
                </span>
              )}
              {!isEditing && businessData.phone && (
                <a
                  className={styles.whatsappBtn}
                  href={`https://wa.me/${toWhatsappNumber(businessData.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Escribir por WhatsApp"
                >
                  <FaWhatsapp size={15} />
                </a>
              )}
            </div>

            <div className={styles.contactRow}>
              <Mail size={16} className={styles.contactIcon}/>
              {isEditing ? (
                <div style={{ flex: 1 }}>
                  <input className={`${styles.editInput} ${errors.email ? styles.inputError : ""}`}
                    type="email" value={draft.email}
                    onChange={(e) => { handleInputChange("email")(e); validate("email", e.target.value, { email: true }); }}
                    placeholder="Email" maxLength={60}/>
                  {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
                </div>
              ) : (
                <span className={businessData.email ? styles.contactText : styles.contactEmpty}>
                  {businessData.email || "Sin email"}
                </span>
              )}
            </div>

            <div className={styles.contactRow}>
              <Link2 size={16} className={styles.contactIcon}/>
              {isEditing ? (
                <input className={`${styles.editInput} ${errors.link ? styles.inputError : ""}`}
                  type="url" value={String(draft.link || "")}
                  onChange={(e) => { handleInputChange("link")(e); validate("link", e.target.value, { url: true }); }}
                  placeholder="https://tusitio.com" maxLength={200}/>
              ) : businessData.link ? (
                <a className={styles.contactText}
                   href={String(businessData.link).startsWith("http") ? businessData.link : `https://${businessData.link}`}
                   target="_blank" rel="noopener noreferrer">
                  {businessData.link}
                </a>
              ) : (
                <span className={styles.contactEmpty}>Sin link</span>
              )}
              {errors.link && <span className={styles.fieldError}>{errors.link}</span>}
            </div>

            <div className={styles.contactRow}>
              <FaInstagram size={16} className={styles.contactIcon}/>
              {isEditing ? (
                <input className={`${styles.editInput} ${errors.instagram ? styles.inputError : ""}`}
                  type="url" value={String(draft.instagram || "")}
                  onChange={(e) => { handleInputChange("instagram")(e); validate("instagram", e.target.value, { url: true }); }}
                  placeholder="https://instagram.com/tunegocio" maxLength={200}/>
              ) : businessData.instagram ? (
                <a className={styles.contactText} href={businessData.instagram} target="_blank" rel="noopener noreferrer">
                  {businessData.instagram}
                </a>
              ) : (
                <span className={styles.contactEmpty}>Sin Instagram</span>
              )}
              {errors.instagram && <span className={styles.fieldError}>{errors.instagram}</span>}
            </div>

            <div className={styles.contactRow}>
              <FaFacebook size={16} className={styles.contactIcon}/>
              {isEditing ? (
                <input className={`${styles.editInput} ${errors.facebook ? styles.inputError : ""}`}
                  type="url" value={String(draft.facebook || "")}
                  onChange={(e) => { handleInputChange("facebook")(e); validate("facebook", e.target.value, { url: true }); }}
                  placeholder="https://facebook.com/tunegocio" maxLength={200}/>
              ) : businessData.facebook ? (
                <a className={styles.contactText} href={businessData.facebook} target="_blank" rel="noopener noreferrer">
                  {businessData.facebook}
                </a>
              ) : (
                <span className={styles.contactEmpty}>Sin Facebook</span>
              )}
              {errors.facebook && <span className={styles.fieldError}>{errors.facebook}</span>}
            </div>

            {isEditing ? (
              <div style={{ marginTop: 14 }}>
                <LocationPicker
                  label="Ubicación del negocio"
                  value={draft.location}
                  onChange={(loc) => setDraft((p) => ({ ...p, location: loc }))}
                />
              </div>
            ) : businessData.location?.lat ? (
              <div style={{ marginTop: 14 }}>
                <LocationDisplay location={businessData.location} label="Ubicación" />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={styles.actionsBar}>
        <div className={styles.actionsLeft}>
          {!isEditing && (
            <button
              className={`${styles.btnFav} ${isFav ? styles.btnFavActive : ""}`}
              onClick={handleToggleFav}
              title={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
            >
              <Star size={16} strokeWidth={2} fill={isFav ? "currentColor" : "none"} />
              {isFav ? "Guardado" : "Favorito"}
            </button>
          )}
          {!isEditing && businessData.link && (
            <a href={String(businessData.link).startsWith("http") ? businessData.link : `https://${businessData.link}`}
               target="_blank" rel="noopener noreferrer" className={styles.btnSocialLink}>
              {businessData.link} <ArrowRight size={14}/>
            </a>
          )}
        </div>
        {isOwner && !isEditing && (
          <div className={styles.actionsRight}>
            {!businessId ? (
              <div className={styles.infoBannerSmall}>
                <AlertCircle size={15}/> Completá los datos del negocio para empezar a publicar
              </div>
            ) : (
              <>
                <button className={styles.btnCreate} onClick={() => openModal("post")} disabled={loading.creatingPost}>
                  <Plus size={15}/> Publicación
                </button>
                <button className={styles.btnCreateSecondary} onClick={() => openModal("event")} disabled={loading.creatingPost}>
                  <Plus size={15}/> Evento
                </button>
                {activeTab === "promotions" && (
                  <button
                    className={styles.btnCreateSecondary}
                    onClick={handleOpenPromotionModal}
                    disabled={loading.creatingPromotion}
                  >
                    <Plus size={15}/> Promoción
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className={styles.tabsBar}>
        <button className={`${styles.tabBtn} ${activeTab === "posts" ? styles.tabBtnActive : ""}`} onClick={() => setActiveTab("posts")}>
          Publicaciones ({sortedPosts.length})
        </button>
        <button className={`${styles.tabBtn} ${activeTab === "events" ? styles.tabBtnActive : ""}`} onClick={() => setActiveTab("events")}>
          Eventos ({sortedEvents.length})
        </button>
        {isOwner && (
          <button className={`${styles.tabBtn} ${activeTab === "promotions" ? styles.tabBtnActive : ""}`} onClick={() => setActiveTab("promotions")}>
            Promociones ({promotions.length})
          </button>
        )}
      </div>

      <div className={styles.feedWrapper}>
        {activeTab === "posts" && (
          loading.posts ? (
            <div className={styles.emptyState}><Loader size={32} className={styles.spinnerIcon}/></div>
          ) : sortedPosts.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrap}><FileText size={24} /></div>
              <p className={styles.emptyTitle}>Sin publicaciones aún</p>
              <p className={styles.emptyDesc}>{isOwner ? "¡Creá la primera publicación!" : "Este negocio no ha publicado nada todavía."}</p>
            </div>
          ) : sortedPosts.map((post) => (
            <div
              key={post.id}
              id={`posts-${post.id}`}
              className={`${styles.postCard} ${highlightKey === `posts-${post.id}` ? styles.cardHighlighted : ""}`}
            >
              {post.images?.length > 0 && <PostGallery images={post.images} />}
              <div className={styles.postBody}>
                <p className={styles.postText}>{post.text}</p>
                <div className={styles.postFooter}>
                  <span className={styles.postDate}>{timeAgo(post.createdAt)}</span>
                  {isOwner && (
                    <div className={styles.postActions}>
                      <button className={styles.btnPostEdit} onClick={() => openModal("post", post)} disabled={loading.deletingPost}><Pencil size={12}/> Editar</button>
                      <button className={styles.btnPostDelete} onClick={() => handleDeletePost(post.id)} disabled={loading.deletingPost}><Trash2 size={12}/> Eliminar</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {activeTab === "events" && (
          sortedEvents.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrap}><CalendarDays size={24} /></div>
              <p className={styles.emptyTitle}>Sin eventos aún</p>
              <p className={styles.emptyDesc}>{isOwner ? "¡Creá el primer evento!" : "Este negocio no tiene eventos todavía."}</p>
            </div>
          ) : sortedEvents.map((ev) => (
            <div
              key={ev.idEvent}
              id={`events-${ev.idEvent}`}
              className={`${styles.eventCard} ${highlightKey === `events-${ev.idEvent}` ? styles.cardHighlighted : ""}`}
            >
              {ev.images?.length > 0 && <PostGallery images={ev.images.map(i => i.url || i)} />}
              <div className={styles.eventHeader}>
                <h3 className={styles.eventTitle}>{ev.title}</h3>
                <div className={styles.eventMeta}>
                  {ev.startDate && <span className={styles.eventMetaItem}><Clock size={13}/>{ev.startDate.split('T')[0]}</span>}
                  {ev.startDate && <span className={styles.eventMetaItem}><Clock size={13}/>{ev.startDate.split('T')[1]?.slice(0,5)}</span>}
                </div>
                {ev.description && (
                  <p className={styles.descriptionText} style={{padding: "0 18px 10px"}}>
                    {ev.description.length > EVENT_DESC_LIMIT && !expandedEventIds.has(ev.idEvent)
                      ? `${ev.description.slice(0, EVENT_DESC_LIMIT).trim()}…`
                      : ev.description}
                    {ev.description.length > EVENT_DESC_LIMIT && (
                      <button
                        type="button"
                        className={styles.verMasBtn}
                        onClick={() => toggleEventExpanded(ev.idEvent)}
                      >
                        {expandedEventIds.has(ev.idEvent) ? " Ver menos" : " Ver más"}
                      </button>
                    )}
                  </p>
                )}
              </div>
              {isOwner && (
                <div className={styles.eventBody}>
                  <div className={styles.postActions}>
                    <button className={styles.btnPostEdit} onClick={() => openModal("event", normalizeEvent(ev))} disabled={loading.deletingPost}><Pencil size={12}/> Editar</button>
                    <button className={styles.btnPostDelete} onClick={() => handleDeletePost(ev.idEvent, "event")} disabled={loading.deletingPost}><Trash2 size={12}/> Eliminar</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {activeTab === "promotions" && isOwner && (
          planAccess && !planAccess.allowed ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrap}><Sparkles size={24} /></div>
              <p className={styles.emptyTitle}>Necesitás un plan superior</p>
              <p className={styles.emptyDesc}>
                Para poder crear promociones necesitás tener un plan superior activo.
                Mejorá tu plan para destacar tu negocio en el carrusel principal.
              </p>
              <button
                className={styles.btnCreateSecondary}
                onClick={() => navigate(`/checkout/${planAccess.targetPlanId}`)}
                style={{ display: "inline-flex", marginTop: 12 }}
              >
                Mejorar plan
              </button>
            </div>
          ) : promotions.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrap}><Megaphone size={24} /></div>
              <p className={styles.emptyTitle}>Sin promociones</p>
              <p className={styles.emptyDesc}>Creá tu primera promoción para destacar tu negocio en el carrusel.</p>
            </div>
          ) : (
            <div className={styles.promotionsGrid}>
              {promotions.map(promo => (
                <PromotionCard
                  key={promo.idPromotion}
                  promotion={promo}
                  onEdit={(p) => { setPromotionFormError(""); setEditingPromotion(p); setShowPromotionModal(true); }}
                  onDeleted={() => loadPromotions(businessId)}
                  onStatusChanged={() => loadPromotions(businessId)}
                  onError={(msg) => flashError(msg)}
                />
              ))}
            </div>
          )
        )}
      </div>

      <CreatePostModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingPost(null); }}
        onSubmit={handleSubmitPost}
        type={modalType}
        initialData={editingPost}
        isSubmitting={loading.creatingPost}
      />

      <PromotionModal
        isOpen={showPromotionModal}
        onClose={handleClosePromotionModal}
        onSubmit={handleSubmitPromotion}
        initialData={editingPromotion}
        availableTags={promotionTags}
        posts={sortedPosts}
        events={sortedEvents}
        isSubmitting={loading.creatingPromotion}
        errorMessage={promotionFormError}
      />

      <PlanRestrictedModal
        isOpen={showPlanRestrictedModal}
        onClose={() => setShowPlanRestrictedModal(false)}
        onUpgrade={handleUpgradePlan}
      />
    </div>
  );
};

export default ProfileHeader; 