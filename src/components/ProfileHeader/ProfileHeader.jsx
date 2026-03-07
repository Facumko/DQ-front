import React, { useState, useEffect, useMemo, useContext, useCallback } from "react";
import { UserContext } from "../../pages/UserContext";
import {
  getBusinessByUserId, getBusinessById, updateBusiness, createBusiness,
  uploadProfileImage, uploadCoverImage,
  createPost, getPostsByCommerce, deletePost, updatePostText,
  addImagesToPost, deleteImagesFromPost,
} from "../../Api/Api";
import styles from "./ProfileHeader.module.css";
import { Loader, AlertCircle, Check, Edit2, Star, ArrowRight, Plus, User,
         Camera, Phone, Mail, Link2, Image, Clock, ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import CreatePostModal from "./CreatePostModal";
import PostGallery from "./PostGallery";
import ScheduleEditor from "./components/ScheduleEditor";
import ImageCropModal from "./ImageCropModal";
import LocationPicker from "../LocationPicker/LocationPicker";

// ─────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────
const MOCK_BUSINESS = {
  idCommerce: 0,
  name: "La Cantina del Sur",
  description: "Cocina casera y regional en el corazón de la ciudad. Menú del día, empanadas, locro y mucho más. ¡Te esperamos!",
  email: "lacantina@example.com",
  phone: "(362) 456-7890",
  link: "https://instagram.com/lacantina",
  location: { lat: -26.7909, lng: -60.4437, address: "Av. San Martín 123, Presidencia Roque Sáenz Peña, Chaco" },
  profileImage: { url: "https://i.pravatar.cc/150?img=12" },
  coverImage: { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&q=80" },
};

const MOCK_POSTS = [
  {
    idPost: 1,
    description: "¡Mirá qué rico quedó el locro de hoy! 🫕 Pasate a almorzar, te esperamos con el menú completo hasta las 15 hs.",
    images: [{ url: "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=600&q=80", imageOrder: 1, idImage: 1 }],
    type: "post",
    postedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    idPost: 2,
    description: "Nuevas empanadas de humita disponibles de jueves a domingo. ¡Docena a precio especial todo el mes! 🫔",
    images: [
      { url: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80", imageOrder: 1, idImage: 2 },
      { url: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&q=80", imageOrder: 2, idImage: 3 },
    ],
    type: "post",
    postedAt: new Date(Date.now() - 26 * 3600000).toISOString(),
  },
];

// ─────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────
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
  location:     d?.location || null,
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

// ─────────────────────────────────────────
// HOOK: validación
// ─────────────────────────────────────────
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

// ─────────────────────────────────────────
// HOOK: estado de horario
// ─────────────────────────────────────────
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

// ═════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═════════════════════════════════════════
const ProfileHeader = ({
  isOwner        = false,
  businessData: externalData = null,
  useMock        = false,
}) => {
  const { user } = useContext(UserContext);

  const [loading,     setLoading]    = useState({ business: true, posts: false, profileImage: false, coverImage: false, savingBusiness: false, creatingPost: false, deletingPost: false });
  const [errorMsg,    setErrorMsg]   = useState("");
  const [successMsg,  setSuccessMsg] = useState("");
  const [infoMsg,     setInfoMsg]    = useState("");

  const [isEditing,   setIsEditing]  = useState(false);
  const [showModal,   setShowModal]  = useState(false);
  const [modalType,   setModalType]  = useState("post");
  const [editingPost, setEditingPost]= useState(null);

  const [posts,       setPosts]      = useState([]);
  const [activeTab,   setActiveTab]  = useState("posts");
  const [businessId,  setBusinessId] = useState(null);
  const [showSchedule,setShowSchedule] = useState(false);

  const [businessData, setBusinessData] = useState({ name:"", email:"", phone:"", link:"", description:"", profileImage:null, coverImage:null, location:null });
  const [schedule,     setSchedule]     = useState(DEFAULT_SCHEDULE);
  const [draft,        setDraft]        = useState(businessData);
  const [draftSchedule,setDraftSchedule]= useState(schedule);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [coverImageFile,   setCoverImageFile]   = useState(null);

  // ── Estado del modal de recorte ──
  const [cropModal, setCropModal] = useState({ open: false, src: null, type: null });

  const { errors, validate, clearErrors } = useFormValidation();
  const statusInfo = useBusinessStatus(schedule);

  // ── Limpiar blob URLs ──
  useEffect(() => () => {
    if (draft.profileImage?.startsWith("blob:")) URL.revokeObjectURL(draft.profileImage);
    if (draft.coverImage?.startsWith("blob:"))   URL.revokeObjectURL(draft.coverImage);
  }, [draft.profileImage, draft.coverImage]);

  // ── Cargar datos ──
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
      const id = externalData.idCommerce || externalData.id_business;
      setBusinessId(id);
      setLoading((p) => ({ ...p, business: false }));
      if (id) loadPosts(id);
      return;
    }
    if (user?.id_user) loadBusinessData();
    else setLoading((p) => ({ ...p, business: false }));
  }, [user?.id_user, externalData, useMock]);

  // ── Mensajes ──
  const flash = (setter, msg, ms = 3500) => { setter(msg); setTimeout(() => setter(""), ms); };
  const flashError   = (m) => flash(setErrorMsg,   m, 5000);
  const flashSuccess = (m) => flash(setSuccessMsg, m);
  const flashInfo    = (m) => flash(setInfoMsg,    m);
  const setLoad = (key, val) => setLoading((p) => ({ ...p, [key]: val }));

  // ── API ──
  const loadBusinessData = async () => {
    setLoad("business", true);
    try {
      const biz = await getBusinessByUserId(user.id_user);
      if (biz) {
        setBusinessId(biz.id_business);
        const d = normalizeBusiness(biz);
        setBusinessData(d); setDraft(d);
        await loadPosts(biz.id_business);
      } else {
        const d = normalizeBusiness({ name: user.name ? `${user.name} ${user.lastname || ""}`.trim() : "" });
        setBusinessData(d); setDraft(d);
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
      if (type === "profileImage") setProfileImageFile(null);
      else setCoverImageFile(null);
      flashSuccess("✅ Imagen actualizada");
    } catch (err) { flashError(err.message); }
    finally { setLoad(type, false); }
  };

  // ── Edición ──
  const handleEdit = () => {
    setDraft(normalizeBusiness(businessData));
    setDraftSchedule(schedule);
    setIsEditing(true);
    setErrorMsg(""); setSuccessMsg("");
    setProfileImageFile(null); setCoverImageFile(null);
    clearErrors();
  };

  const handleCancel = () => {
    setDraft(normalizeBusiness(businessData));
    setDraftSchedule(schedule);
    setIsEditing(false);
    setErrorMsg(""); setSuccessMsg("");
    setProfileImageFile(null); setCoverImageFile(null);
    clearErrors();
  };

  const handleInputChange = useCallback((field) => (e) =>
    setDraft((p) => ({ ...p, [field]: e.target.value })), []);

  const handlePhoneChange = useCallback((e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    const fmt = raw.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
    setDraft((p) => ({ ...p, phone: fmt }));
  }, []);

  const handleSave = async () => {
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
      const payload = { name, description: desc, email, phone, link: t(draft.link), location: draft.location || null };
      if (businessId) await updateBusiness(businessId, payload);
      else {
        const res = await createBusiness({ ...payload, id_user: user.id_user });
        setBusinessId(res.id_business);
      }
      if (profileImageFile) await uploadImage("profileImage", profileImageFile);
      if (coverImageFile)   await uploadImage("coverImage",   coverImageFile);
      // ✅ Si hay externalData recargamos por businessId específico para no cargar el primer negocio del usuario
      if (externalData) {
        const biz = await getBusinessById(businessId);
        if (biz) {
          const d = normalizeBusiness(biz);
          setBusinessData(d);
          setDraft(d);
        }
      } else {
        await loadBusinessData();
      }
      setSchedule(draftSchedule);
      setIsEditing(false);
      flashSuccess("✅ Datos guardados correctamente");
    } catch (err) { flashError(err.message || "Error al guardar"); }
    finally { setLoad("savingBusiness", false); }
  };

  // ── Posts ──
  const sortedPosts  = useMemo(() => posts.filter((p) => p.type !== "event").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [posts]);
  const sortedEvents = useMemo(() => posts.filter((p) => p.type === "event"), [posts]);

  const handleSubmitPost = async (data) => {
    if (!businessId) { flashError("Creá el negocio primero"); return; }
    const id = typeof businessId === "string" ? parseInt(businessId, 10) : businessId;
    if (isNaN(id)) { flashError("ID de comercio inválido"); return; }
    setLoad("creatingPost", true);
    try {
      if (editingPost) {
        await updatePostText(editingPost.id, data.text, id);
        if (data.imagesToDelete?.length) await deleteImagesFromPost(editingPost.id, data.imagesToDelete);
        if (data.imageFiles?.length)     await addImagesToPost(editingPost.id, data.imageFiles);
        flashSuccess("✅ Publicación actualizada");
      } else {
        if (!data.imageFiles?.length) { flashError("Subí al menos una imagen"); return; }
        await createPost(data.text, id, data.imageFiles);
        flashSuccess("✅ Publicación creada");
      }
      await loadPosts(id);
      setShowModal(false);
    } catch (err) { flashError(err.message || "Error al guardar la publicación"); }
    finally { setLoad("creatingPost", false); setEditingPost(null); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("¿Eliminar esta publicación? Esta acción no se puede deshacer.")) return;
    setLoad("deletingPost", true);
    try {
      await deletePost(postId);
      setPosts((p) => p.filter((x) => x.id !== postId));
      flashSuccess("✅ Publicación eliminada");
    } catch (err) { flashError(err.message || "Error al eliminar"); }
    finally { setLoad("deletingPost", false); }
  };

  const openModal = (type, post = null) => {
    setModalType(type); setEditingPost(post); setShowModal(true);
  };

  // ── Handlers para abrir el crop modal ──
  const handleCoverFileSelect = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const src = URL.createObjectURL(f);
    setCropModal({ open: true, src, type: "coverImage" });
    // limpiar el input para permitir re-selección del mismo archivo
    e.target.value = "";
  };

  const handleAvatarFileSelect = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const src = URL.createObjectURL(f);
    setCropModal({ open: true, src, type: "profileImage" });
    e.target.value = "";
  };

  const handleCropConfirm = ({ file, previewUrl }) => {
    if (cropModal.type === "coverImage") {
      if (draft.coverImage?.startsWith("blob:")) URL.revokeObjectURL(draft.coverImage);
      setCoverImageFile(file);
      setDraft((p) => ({ ...p, coverImage: previewUrl }));
    } else {
      if (draft.profileImage?.startsWith("blob:")) URL.revokeObjectURL(draft.profileImage);
      setProfileImageFile(file);
      setDraft((p) => ({ ...p, profileImage: previewUrl }));
    }
    setCropModal({ open: false, src: null, type: null });
  };

  const handleCropCancel = () => {
    if (cropModal.src) URL.revokeObjectURL(cropModal.src);
    setCropModal({ open: false, src: null, type: null });
  };

  // ── Helpers de status ──
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

      {/* ── Banners ── */}
      <div className={styles.bannerStack}>
        {errorMsg   && <div className={`${styles.banner} ${styles.bannerError}`}><AlertCircle size={16}/>{errorMsg}</div>}
        {successMsg && <div className={`${styles.banner} ${styles.bannerSuccess}`}><Check size={16}/>{successMsg}</div>}
        {infoMsg    && <div className={`${styles.banner} ${styles.bannerInfo}`}><Loader size={16} className={styles.spinnerIcon}/>{infoMsg}</div>}
        {(loading.profileImage || loading.coverImage) &&
          <div className={`${styles.banner} ${styles.bannerInfo}`}><Loader size={16} className={styles.spinnerIcon}/>Subiendo imagen...</div>}
      </div>

      {/* ── Bloque de perfil ── */}
      <div className={styles.profileBlock}>

        {/* Portada */}
        <div className={styles.heroSection}>
          {(isEditing ? draft.coverImage : businessData.coverImage)
            ? <img src={isEditing ? draft.coverImage : businessData.coverImage} alt="Portada" className={styles.heroImage} />
            : <div className={styles.heroPlaceholder}><Image size={40}/><span>Sin portada</span></div>
          }
          {isEditing && (
            <label className={styles.coverEditBtn}>
              <Camera size={15}/> {businessData.coverImage ? "Cambiar portada" : "Subir portada"}
              <input type="file" accept="image/*" className={styles.fileInputHidden} onChange={handleCoverFileSelect} />
            </label>
          )}
        </div>

        {/* Avatar + botones */}
        <div className={styles.profileTop}>
          <div className={styles.avatarWrapper}>
            {isEditing ? (
              <label style={{ cursor: "pointer" }}>
                {draft.profileImage
                  ? <img src={draft.profileImage} alt="Perfil" className={styles.avatar}/>
                  : <div className={styles.avatarPlaceholder}><User size={32}/></div>}
                <div className={styles.avatarEditOverlay}><Camera size={18}/></div>
                <input type="file" accept="image/*" className={styles.fileInputHidden} onChange={handleAvatarFileSelect} />
              </label>
            ) : (
              businessData.profileImage
                ? <img src={businessData.profileImage} alt="Perfil" className={styles.avatar}/>
                : <div className={styles.avatarPlaceholder}><User size={32}/></div>
            )}
          </div>

          {isOwner && (
            <div className={styles.topActions}>
              {!isEditing ? (
                <button className={styles.btnEdit} onClick={handleEdit}><Edit2 size={14}/> Editar perfil</button>
              ) : (
                <>
                  <button className={styles.btnCancel} onClick={handleCancel} disabled={isBusy}>Cancelar</button>
                  <button className={styles.btnSave}   onClick={handleSave}   disabled={isBusy}>
                    {loading.savingBusiness ? <><Loader size={14} className={styles.spinnerIcon}/> Guardando...</> : <><Check size={14}/> Guardar</>}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Nombre + estado */}
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
              <div className={styles.statusRow}>
                <span className={`${styles.statusDot} ${statusDotClass[statusInfo.type]}`}/>
                <span className={`${styles.statusText} ${statusTextClass[statusInfo.type]}`}>{statusInfo.label}</span>
              </div>
            </>
          )}
        </div>

        {/* Grid info */}
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
              </>
            ) : (
              <p className={styles.descriptionText}>{businessData.description || "Sin descripción"}</p>
            )}

            {!isEditing && (
              <div style={{ marginTop: 16 }}>
                <button className={styles.scheduleToggleBtn} onClick={() => setShowSchedule((p) => !p)}>
                  <Clock size={15}/> Horarios
                  {showSchedule ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                </button>
                {showSchedule && (
                  <div className={styles.scheduleTable}>
                    {Object.entries(schedule).map(([day, h]) => (
                      <div key={day} className={styles.scheduleRow}>
                        <span className={styles.scheduleDay}>{day}</span>
                        <span className={`${styles.scheduleHours} ${h.cerrado ? styles.scheduleClosed : ""}`}>
                          {h.cerrado ? "Cerrado"
                            : h.deCorrido ? `${h.open} – ${h.close}`
                            : `M: ${h.manana.open}–${h.manana.close}  T: ${h.tarde.open}–${h.tarde.close}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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

            {/* Ubicación */}
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
                <LocationPicker
                  label=""
                  value={businessData.location}
                  onChange={() => {}}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Barra de acciones ── */}
      <div className={styles.actionsBar}>
        <div className={styles.actionsLeft}>
          {!isEditing && <button className={styles.btnFav}><Star size={16} strokeWidth={2}/> Favorito</button>}
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

      {/* ── Tabs ── */}
      <div className={styles.tabsBar}>
        <button className={`${styles.tabBtn} ${activeTab === "posts" ? styles.tabBtnActive : ""}`} onClick={() => setActiveTab("posts")}>
          Publicaciones ({sortedPosts.length})
        </button>
        <button className={`${styles.tabBtn} ${activeTab === "events" ? styles.tabBtnActive : ""}`} onClick={() => setActiveTab("events")}>
          Eventos ({sortedEvents.length})
        </button>
      </div>

      {/* ── Feed ── */}
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
                      <button className={styles.btnPostEdit}   onClick={() => openModal("post", post)} disabled={loading.deletingPost}><Pencil size={12}/> Editar</button>
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
                    <button className={styles.btnPostEdit}   onClick={() => openModal("event", ev)} disabled={loading.deletingPost}><Pencil size={12}/> Editar</button>
                    <button className={styles.btnPostDelete} onClick={() => handleDeletePost(ev.id)} disabled={loading.deletingPost}><Trash2 size={12}/> Eliminar</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Modal publicación ── */}
      <CreatePostModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingPost(null); }}
        onSubmit={handleSubmitPost}
        type={modalType}
        initialData={editingPost}
      />

      {/* ── Modal de recorte de imagen ── */}
      {cropModal.open && (
        <ImageCropModal
          imageSrc={cropModal.src}
          aspect={cropModal.type === "coverImage" ? 16 / 9 : 1}
          title={cropModal.type === "coverImage" ? "Ajustar portada" : "Ajustar foto de perfil"}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

    </div>
  );
};

export default ProfileHeader;