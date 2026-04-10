import React, { useState, useEffect, useMemo, useContext, useCallback } from "react";
import { UserContext } from "../../pages/UserContext";
import LoginModal from "../LoginForm/LoginModal";
import {
  getMyBusiness, getBusinessById, updateBusiness, createBusiness,
  uploadProfileImage, uploadCoverImage,
  createPost, getPostsByCommerce, deletePost, updatePostText,
  addImagesToPost, deleteImagesFromPost,
  replaceCommerceSchedules, scheduleFromBackend,
  getCategories, addCommerceCategories, removeCommerceCategories,
  createEvent, updateEvent, deleteEvent,
  addImagesToEvent, deleteImagesFromEvent,
  toLocalDateTime,
} from "../../Api/Api";
import styles from "./ProfileHeader.module.css";
import { Loader, AlertCircle, Check, Edit2, Star, ArrowRight, Plus, 
         Phone, Mail, Link2, Clock, Pencil, Trash2 } from "lucide-react";
import CreatePostModal from "./CreatePostModal";
import PostGallery from "./PostGallery";
import ScheduleEditor from "./components/ScheduleEditor";
import ScheduleDisplay from "./components/ScheduleDisplay";
import LocationPicker from "../LocationPicker/LocationPicker";
import { CoverEditor, AvatarEditor } from "./InlineImageEditor";

const isDevelopment = import.meta.env.MODE === 'development';

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

const normalizeBusiness = (d) => ({
  name:         d?.name        || "",
  email:        d?.email       || "",
  phone:        d?.phone       || "",
  link:         d?.link ? String(d.link) : "",
  description:  d?.description || "",
  profileImage: d?.profileImage?.url || d?.profileImage || null,
  coverImage:   d?.coverImage?.url   || d?.coverImage   || null,
  schedules:    d?.schedules || [],
  categories:   Array.isArray(d?.categories) ? d.categories : [], // ← faltaba


  // ── Convertir AddressDto del back → formato LocationPicker ──────────
  location: d?.address?.lat && d?.address?.lng
    ? {
        idAddress: d.address.idAddress || null,
        lat:       parseFloat(d.address.lat),
        lng:       parseFloat(d.address.lng),
        address:   d.address.address || d.address.street || "",
      }
    : null,
});

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

const useFormValidation = () => {
  const [errors, setErrors] = useState({});
  const validate = useCallback((field, value, rules) => {
    let error = "";
    if (rules.required && !value?.trim()) error = `${field} es obligatorio`;
    else if (rules.maxLength && value?.length > rules.maxLength) error = `Máximo ${rules.maxLength} caracteres`;
    else if (rules.email && value && !isValidEmail(value)) error = "Correo inválido";
    else if (rules.phone && value && !isValidPhone(value)) error = "Número inválido (mín. 8 dígitos)";
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

const ProfileHeader = ({
  isOwner        = false,
  businessData: externalData = null,
  useMock        = false,
}) => {
  const { user, favoriteCommerceIds, toggleFavoriteCommerce } = useContext(UserContext);

  const [loading, setLoading] = useState({
    business: true, posts: false, profileImage: false,
    coverImage: false, savingBusiness: false, creatingPost: false, deletingPost: false,
  });
  const [errorMsg,   setErrorMsg]   = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [infoMsg,    setInfoMsg]    = useState("");

  const [isEditing,   setIsEditing]  = useState(false);
  const [showModal,   setShowModal]  = useState(false);
  const [modalType,   setModalType]  = useState("post");
  const [editingPost, setEditingPost]= useState(null);
  const [showLogin,   setShowLogin]  = useState(false);

  const [posts,      setPosts]     = useState([]);
  const [activeTab,  setActiveTab] = useState("posts");
  const [businessId, setBusinessId]= useState(null);

  const [businessData, setBusinessData] = useState({
    name:"", email:"", phone:"", link:"", description:"",
    profileImage:null, coverImage:null, location:null, categories:[],
  });
  const [schedule,      setSchedule]      = useState(DEFAULT_SCHEDULE);
  const [draft,         setDraft]         = useState(businessData);
  const [draftSchedule, setDraftSchedule] = useState(schedule);

  // Categorías
  const [allCategories,    setAllCategories]    = useState([]);
  const [draftCategories,  setDraftCategories]  = useState([]);

  const [pendingCover,  setPendingCover]  = useState(null);
  const [pendingAvatar, setPendingAvatar] = useState(null);
  const [, setCoverPos]  = useState({ posY: 50, zoom: 1 });
  const [, setAvatarPos] = useState({ x: 50, y: 50, zoom: 1 });

  const { errors, validate, clearErrors } = useFormValidation();
  const statusInfo = useBusinessStatus(schedule);

  const isFav = businessId ? (favoriteCommerceIds?.has(businessId) ?? false) : false;

  const handleToggleFav = useCallback(async () => {
    if (!user) { setShowLogin(true); return; }
    if (!businessId) return;
    const commerce = {
      idCommerce:   businessId,
      id:           businessId,
      name:         businessData.name,
      profileImage: businessData.profileImage,
    };
    await toggleFavoriteCommerce(commerce);
  }, [user, businessId, businessData, toggleFavoriteCommerce]);

  useEffect(() => () => {
    if (pendingCover?.previewUrl)  URL.revokeObjectURL(pendingCover.previewUrl);
    if (pendingAvatar?.previewUrl) URL.revokeObjectURL(pendingAvatar.previewUrl);
  }, []);

  // Cargar todas las categorías disponibles
  useEffect(() => {
    getCategories()
      .then(cats => setAllCategories(Array.isArray(cats) ? cats : []))
      .catch(() => setAllCategories([]));
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
      setDraftCategories(d.categories);
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

  const flash = (setter, msg, ms = 3500) => { setter(msg); setTimeout(() => setter(""), ms); };
  const flashError   = (m) => flash(setErrorMsg,   m, 5000);
  const flashSuccess = (m) => flash(setSuccessMsg, m);
  const flashInfo    = (m) => flash(setInfoMsg,    m);
  const setLoad = (key, val) => setLoading((p) => ({ ...p, [key]: val }));

  const loadBusinessData = async () => {
    setLoad("business", true);
    try {
      const biz = await getMyBusiness();
      if (biz) {
        setBusinessId(biz.id_business);
        const d = normalizeBusiness(biz);
        setBusinessData(d); setDraft(d);
        setDraftCategories(d.categories);
        if (d.schedules && d.schedules.length > 0) {
          const loaded = scheduleFromBackend(d.schedules);
          setSchedule(loaded); setDraftSchedule(loaded);
        }
        await loadPosts(biz.id_business);
      } else {
        const d = normalizeBusiness({ name: user.name ? `${user.name} ${user.lastname || ""}`.trim() : "" });
        setBusinessData(d); setDraft(d);
        setDraftCategories([]);
      }
    } catch (err) { flashError(err.message || "Error al cargar el negocio"); }
    finally { setLoad("business", false); }
  };

  const loadPosts = async (id) => {
    if (!id) return;
    setLoad("posts", true);
    try {
      const raw = await getPostsByCommerce(id);
      setPosts(Array.isArray(raw) ? raw.map(normalizePost) : []);
    } catch { setPosts([]); }
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
    setDraftCategories(businessData.categories);
    setIsEditing(true);
    setErrorMsg(""); setSuccessMsg("");
    setPendingCover(null); setPendingAvatar(null);
    clearErrors();
  };

  const handleCancel = () => {
    setDraft(normalizeBusiness(businessData));
    setDraftSchedule(schedule);
    setDraftCategories(businessData.categories);
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

  const toggleDraftCategory = useCallback((cat) => {
    setDraftCategories(prev => {
      const exists = prev.some(c => c.idCategory === cat.idCategory);
      return exists
        ? prev.filter(c => c.idCategory !== cat.idCategory)
        : [...prev, cat];
    });
  }, []);

  const isDraftCategorySelected = useCallback((cat) =>
    draftCategories.some(c => c.idCategory === cat.idCategory), [draftCategories]);

  const handleSave = async () => {
    if (!isOwner) { flashError("No tenés permisos para editar este negocio"); return; }
    const t = (v) => (v || "").trim();
    const name  = t(draft.name);
    const desc  = t(draft.description);
    const email = t(draft.email);
    const phone = t(draft.phone);
    let valid = true;
    if (!validate("name", name, { required: true, maxLength: 100 })) valid = false;
    if (!validate("description", desc, { required: true, maxLength: 500 })) valid = false;
    if (email && !validate("email", email, { email: true })) valid = false;
    if (phone && !validate("phone", phone, { phone: true })) valid = false;
    if (!valid) { flashError("Revisá los campos marcados"); return; }

    setLoad("savingBusiness", true);
    try {
      const cleanPhone = draft.phone.replace(/\D/g, "");
      const payload = {
        name, description: desc, email, phone: cleanPhone,
        link: t(draft.link), location: draft.location || null,
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

      // Guardar horarios
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

      // Sincronizar categorías
      if (idToUse) {
        const currentIds = businessData.categories.map(c => c.idCategory);
        const draftIds   = draftCategories.map(c => c.idCategory);

        const toAdd    = draftIds.filter(id => !currentIds.includes(id));
        const toRemove = currentIds.filter(id => !draftIds.includes(id));

        try {
          if (toAdd.length > 0)    await addCommerceCategories(idToUse, toAdd);
          if (toRemove.length > 0) await removeCommerceCategories(idToUse, toRemove);
        } catch (catError) {
          console.warn("⚠️ Error sincronizando categorías:", catError.message);
          flashInfo("Datos guardados. Hubo un problema con las categorías, intentá de nuevo.");
        }
      }

      // Recargar datos del negocio
      if (externalData) {
        const biz = await getBusinessById(currentBusinessId);
        if (biz) {
          const d = normalizeBusiness(biz);
          setBusinessData(d); setDraft(d);
          setDraftCategories(d.categories);
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
  const sortedEvents = useMemo(() => posts.filter(p => p.type === "event"), [posts]);

  const handleSubmitPost = async (data) => {
    if (!isOwner) { flashError("No tenés permisos"); return; }
    if (!businessId) { flashError("Creá el negocio primero"); return; }
    const id = typeof businessId === "string" ? parseInt(businessId, 10) : businessId;
    if (isNaN(id)) { flashError("ID de comercio inválido"); return; }

    setLoad("creatingPost", true);
    try {
      if (modalType === "event") {
        // ── EVENTO ──
        const eventDto = {
          title:           data.title || data.text,
          description:     data.text,
          startDate:       toLocalDateTime(data.date, data.time),
          endDate:         toLocalDateTime(data.endDate || data.date, data.endTime || data.time),
          idCommerceOwner: id,
          address:         null,
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
        // ── POST (lógica existente sin cambios) ──
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
    } catch (err) { flashError(err.message || "Error al guardar"); }
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

          {isOwner && (
            <div className={styles.topActions}>
              {!isEditing ? (
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
              )}
            </div>
          )}
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

              {/* Chips de categorías en modo vista */}
              {businessData.categories.length > 0 && (
                <div className={styles.categoryChipsView}>
                  {businessData.categories.map(cat => (
                    <span key={cat.idCategory} className={styles.categoryChipView}>
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}

              <div className={styles.statusRow}>
                <span className={`${styles.statusDot} ${statusDotClass[statusInfo.type]}`}/>
                <span className={`${styles.statusText} ${statusTextClass[statusInfo.type]}`}>{statusInfo.label}</span>
              </div>
            </>
          )}
        </div>

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

                {/* Editor de categorías en modo edición */}
                <div className={styles.categoryEditorSection}>
                  <p className={styles.infoSectionTitle} style={{ marginTop: 16 }}>Categorías</p>
                  <div className={styles.categoryChipsEdit}>
                    {allCategories.map(cat => (
                      <button
                        key={cat.idCategory}
                        type="button"
                        className={`${styles.categoryChipEdit} ${isDraftCategorySelected(cat) ? styles.categoryChipEditSelected : ""}`}
                        onClick={() => toggleDraftCategory(cat)}
                      >
                        {isDraftCategorySelected(cat) && <span>✓ </span>}
                        {cat.name}
                      </button>
                    ))}
                  </div>
                  {draftCategories.length > 0 && (
                    <p className={styles.categoryCount}>
                      {draftCategories.length} categoría{draftCategories.length !== 1 ? "s" : ""} seleccionada{draftCategories.length !== 1 ? "s" : ""}
                    </p>
                  )}
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
                <input className={styles.editInput} type="url" value={String(draft.link || "")}
                  onChange={handleInputChange("link")} placeholder="https://tusitio.com" maxLength={200}/>
              ) : (
                <span className={businessData.link ? styles.contactText : styles.contactEmpty}>
                  {businessData.link || "Sin link"}
                </span>
              )}
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
                <p className={styles.infoSectionTitle} style={{ marginBottom: 8 }}>Ubicación</p>
                <LocationPicker label="" value={businessData.location} onChange={() => {}} />
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
      </div>

      <div className={styles.feedWrapper}>
        {activeTab === "posts" && (
          loading.posts ? (
            <div className={styles.emptyState}><Loader size={32} className={styles.spinnerIcon}/></div>
          ) : sortedPosts.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📝</div>
              <p className={styles.emptyTitle}>Sin publicaciones aún</p>
              <p className={styles.emptyDesc}>{isOwner ? "¡Creá la primera publicación!" : "Este negocio no ha publicado nada todavía."}</p>
            </div>
          ) : sortedPosts.map((post) => (
            <div key={post.id} className={styles.postCard}>
              {post.images?.length > 0 && <PostGallery images={post.images} showThumbnails={true}/>}
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
              <div className={styles.emptyIcon}>📅</div>
              <p className={styles.emptyTitle}>Sin eventos aún</p>
              <p className={styles.emptyDesc}>{isOwner ? "¡Creá el primer evento!" : "Este negocio no tiene eventos todavía."}</p>
            </div>
          ) : sortedEvents.map((ev) => (
            <div key={ev.id} className={styles.eventCard}>
              {ev.images?.length > 0 && <PostGallery images={ev.images} showThumbnails={true}/>}
              <div className={styles.eventHeader}>
                <h3 className={styles.eventTitle}>{ev.text}</h3>
                <div className={styles.eventMeta}>
                  {ev.date     && <span className={styles.eventMetaItem}><Clock size={13}/>{ev.date}</span>}
                  {ev.time     && <span className={styles.eventMetaItem}><Clock size={13}/>{ev.time}</span>}
                  {ev.location && <span className={styles.eventMetaItem}><ArrowRight size={13}/>{ev.location}</span>}
                </div>
              </div>
              {isOwner && (
                <div className={styles.eventBody}>
                  <div className={styles.postActions}>
                    <button className={styles.btnPostEdit} onClick={() => openModal("event", ev)} disabled={loading.deletingPost}><Pencil size={12}/> Editar</button>
                    <button className={styles.btnPostDelete} onClick={() => handleDeletePost(ev.id, "event")} disabled={loading.deletingPost}><Trash2 size={12}/> Eliminar</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <CreatePostModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingPost(null); }}
        onSubmit={handleSubmitPost}
        type={modalType}
        initialData={editingPost}
      />

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
};

export default ProfileHeader;