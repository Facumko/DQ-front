import React, { useState, useEffect, useMemo, useContext } from "react";
import { UserContext } from "../../pages/UserContext";
import { 
  getBusinessByUserId, 
  updateBusiness, 
  createBusiness,
  uploadProfileImage,
  uploadCoverImage 
} from "../../Api/Api";
import styles from "./ProfileHeader.module.css";
import {
  MapPin, Clock, Phone, Mail, Star, ArrowRight, Edit2,
  User, Camera, Image, Plus, Calendar,
  Loader, AlertCircle, Check, Link2, Trash2,
  ChevronLeft, ChevronRight
} from "lucide-react";
import CreatePostModal from "./CreatePostModal";
import PostGallery from "./PostGallery";

// ============================================
// UTILIDADES
// ============================================

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => phone.replace(/\D/g, "").length === 10;

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "hace unos segundos";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
};

// Mapeo días español -> inglés (Java DayOfWeek enum)
const DAY_MAP = {
  "Lun": "MONDAY",
  "Mar": "TUESDAY",
  "Mie": "WEDNESDAY",
  "Jue": "THURSDAY",
  "Vie": "FRIDAY",
  "Sab": "SATURDAY",
  "Dom": "SUNDAY"
};

// Normalizar datos del backend
const normalizeBusinessData = (data) => {
  return {
    name: data?.name || "",
    email: data?.email || "",
    phone: data?.phone || "",
    link: data?.link ? String(data.link) : "",
    description: data?.description || "",
    profileImage: data?.profileImage || null,
    coverImage: data?.coverImage || null,
  };
};

const getCurrentStatus = (sch) => {
  const now = new Date();
  const day = now.toLocaleDateString("es-ES", { weekday: "short" });
  const dayMap = { lun: "Lun", mar: "Mar", mié: "Mie", jue: "Jue", vie: "Vie", sáb: "Sab", dom: "Dom" };
  const today = dayMap[day.toLowerCase()];
  
  if (!today || !sch[today]) return { isOpen: false, label: "Cerrado", color: "statusClosed" };
  
  const hoy = sch[today];
  if (hoy.cerrado) return { isOpen: false, label: "Cerrado", color: "statusClosed" };
  
  const ahora = now.toTimeString().slice(0, 5);
  let isOpen = false, label = "";
  
  if (hoy.deCorrido) {
    isOpen = ahora >= hoy.open && ahora <= hoy.close;
    label = isOpen ? `Abierto` : `Abre a las ${hoy.open}`;
  } else {
    const openM = ahora >= hoy.manana.open && ahora <= hoy.manana.close;
    const openT = ahora >= hoy.tarde.open && ahora <= hoy.tarde.close;
    isOpen = openM || openT;
    
    if (openM) label = `Abierto`;
    else if (openT) label = `Abierto`;
    else if (ahora < hoy.manana.open) label = `Abre a las ${hoy.manana.open}`;
    else if (ahora < hoy.tarde.open) label = `Abre a las ${hoy.tarde.open}`;
    else label = `Cerrado`;
  }
  
  return { isOpen, label, color: isOpen ? "statusOpen" : "statusNeutral" };
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const ProfileHeader = ({ isOwner = false }) => {
  const { user } = useContext(UserContext);
  
  // Estados de carga y error
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Estados de UI
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("post");
  const [posts, setPosts] = useState([]);
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  // Datos del negocio
  const [businessId, setBusinessId] = useState(null);
  const [businessData, setBusinessData] = useState({
    name: "",
    email: "",
    phone: "",
    link: "",
    description: "",
    profileImage: null,
    coverImage: null,
  });

  // Horarios (UI solamente, backend después)
  const [schedule, setSchedule] = useState({
    Lun: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
    Mar: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
    Mie: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
    Jue: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
    Vie: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
    Sab: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
    Dom: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "22:00" } },
  });

  const [draft, setDraft] = useState(businessData);
  const [draftSchedule, setDraftSchedule] = useState(schedule);
  const [editingPost, setEditingPost] = useState(null);
  const [status, setStatus] = useState("");

  // Archivos temporales para subir
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);

  // ============================================
  // CARGAR DATOS
  // ============================================
  
  useEffect(() => {
    if (user?.id_user) {
      loadBusinessData();
    } else {
      setLoading(false);
    }
  }, [user?.id_user]);

  useEffect(() => {
    const info = getCurrentStatus(schedule);
    setStatus(info.label);
  }, [schedule]);

  const loadBusinessData = async () => {
    if (!user?.id_user) {
      setLoading(false);
      setError("No hay usuario autenticado");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("📥 Cargando negocio del usuario:", user.id_user);
      const business = await getBusinessByUserId(user.id_user);
      
      if (business) {
        console.log("✅ Negocio encontrado:", business);
        setBusinessId(business.id_business);
        
        const loadedData = normalizeBusinessData(business);
        setBusinessData(loadedData);
        setDraft(loadedData);
      } else {
        console.log("⚠️ El usuario no tiene negocio creado");
        const defaultData = {
          name: user.name ? `${user.name}${user.lastname ? ' ' + user.lastname : ''}` : "",
          email: "",
          phone: "",
          link: "",
          description: "",
          profileImage: null,
          coverImage: null,
        };
        setBusinessData(defaultData);
        setDraft(defaultData);
      }
    } catch (err) {
      console.error("❌ Error al cargar negocio:", err);
      setError(err.message || "Error al cargar los datos del negocio");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SUBIR IMÁGENES
  // ============================================

  const handleProfileImageUpload = async (file) => {
    if (!businessId) {
      setError("Primero debes crear el negocio antes de subir imágenes");
      return;
    }

    setUploadingImage(true);
    setError("");

    try {
      console.log("📤 Subiendo imagen de perfil...");
      const result = await uploadProfileImage(businessId, file);
      console.log("✅ Imagen de perfil subida:", result);

      // Actualizar businessData con la nueva URL
      setBusinessData(prev => ({
        ...prev,
        profileImage: result.profileImage
      }));

      setSuccess("✅ Imagen de perfil actualizada");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("❌ Error al subir imagen:", err);
      setError(err.message || "Error al subir imagen de perfil");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCoverImageUpload = async (file) => {
    if (!businessId) {
      setError("Primero debes crear el negocio antes de subir imágenes");
      return;
    }

    setUploadingImage(true);
    setError("");

    try {
      console.log("📤 Subiendo imagen de portada...");
      const result = await uploadCoverImage(businessId, file);
      console.log("✅ Imagen de portada subida:", result);

      setBusinessData(prev => ({
        ...prev,
        coverImage: result.coverImage
      }));

      setSuccess("✅ Imagen de portada actualizada");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("❌ Error al subir portada:", err);
      setError(err.message || "Error al subir imagen de portada");
    } finally {
      setUploadingImage(false);
    }
  };

  // ============================================
  // EDICIÓN Y GUARDADO
  // ============================================

  const handleEdit = () => {
    setDraft(normalizeBusinessData(businessData));
    setDraftSchedule(schedule);
    setIsEditing(true);
    setError("");
    setSuccess("");
    setProfileImageFile(null);
    setCoverImageFile(null);
  };

  const handleSave = async () => {
    const trimmedName = (draft.name || "").trim();
    const trimmedDescription = (draft.description || "").trim();
    const trimmedEmail = (draft.email || "").trim();
    const trimmedPhone = (draft.phone || "").trim();
    
    if (!trimmedName) {
      setError("El nombre del negocio es obligatorio");
      return;
    }
    
    if (trimmedName.length > 100) {
      setError("El nombre no puede superar los 100 caracteres");
      return;
    }
    
    if (!trimmedDescription) {
      setError("La descripción del negocio es obligatoria");
      return;
    }
    
    if (trimmedDescription.length > 500) {
      setError("La descripción no puede superar los 500 caracteres");
      return;
    }

    if (trimmedPhone && !isValidPhone(trimmedPhone)) {
      setError("El número debe tener 10 dígitos");
      return;
    }

    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      setError("Correo inválido");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const dataToSend = {
        name: trimmedName,
        description: trimmedDescription,
        email: trimmedEmail,
        phone: trimmedPhone,
        link: (draft.link || "").trim(),
      };

      let savedBusinessId = businessId;

      if (businessId) {
        console.log("📤 Actualizando negocio:", businessId, dataToSend);
        await updateBusiness(businessId, dataToSend);
      } else {
        console.log("📤 Creando nuevo negocio:", dataToSend);
        const result = await createBusiness({
          ...dataToSend,
          id_user: user.id_user,
        });
        console.log("✅ Negocio creado:", result);
        savedBusinessId = result.id_business;
        setBusinessId(savedBusinessId);
      }

      // Subir imágenes si hay archivos seleccionados
      if (profileImageFile) {
        await handleProfileImageUpload(profileImageFile);
      }

      if (coverImageFile) {
        await handleCoverImageUpload(coverImageFile);
      }

      // Recargar datos
      await loadBusinessData();
      
      // Guardar horarios en estado (backend después)
      setSchedule(draftSchedule);
      
      setIsEditing(false);
      setSuccess("✅ Datos guardados correctamente");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error("❌ Error al guardar:", err);
      setError(err.message || "Error al guardar los datos");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(normalizeBusinessData(businessData));
    setDraftSchedule(schedule);
    setIsEditing(false);
    setError("");
    setSuccess("");
    setProfileImageFile(null);
    setCoverImageFile(null);
  };

  // ============================================
  // PUBLICACIONES
  // ============================================

  const sortedPosts = useMemo(() => 
    [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), 
    [posts]
  );

  const handleDeletePost = (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta publicación?")) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setModalType(post.type);
    setShowModal(true);
  };

  const handleSubmitPost = (data) => {
    if (editingPost) {
      setPosts((prev) =>
        prev.map((p) => (p.id === editingPost.id ? { ...p, ...data } : p))
      );
    } else {
      const newPost = { 
        ...data, 
        businessName: businessData.name, 
        createdAt: new Date().toISOString(), 
        id: Date.now() 
      };
      setPosts((prev) => [newPost, ...prev]);
    }
    setEditingPost(null);
  };

  // ============================================
  // RENDERIZADO
  // ============================================

  if (loading) {
    return (
      <div className={styles.headerContainer}>
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <Loader size={48} className={styles.spinnerIcon} />
          <p style={{ marginTop: "1rem", color: "#666" }}>
            Cargando información del negocio...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.headerContainer}>
        {/* MENSAJES */}
        {error && (
          <div className={styles.errorBanner}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}
        
        {success && (
          <div className={styles.successBanner}>
            <Check size={18} />
            {success}
          </div>
        )}

        {uploadingImage && (
          <div className={styles.infoBanner}>
            <Loader size={18} className={styles.spinnerIcon} />
            Subiendo imagen...
          </div>
        )}

        {/* BOTONES DE EDICIÓN */}
        {isOwner && (
          <div className={styles.editButtonContainer}>
            {!isEditing ? (
              <button className={styles.editButtonModern} onClick={handleEdit}>
                <Edit2 size={16} /> Editar
              </button>
            ) : (
              <div className={styles.editActionsModern}>
                <button 
                  className={styles.saveButtonModern} 
                  onClick={handleSave}
                  disabled={saving || uploadingImage}
                >
                  {saving ? (
                    <>
                      <Loader size={16} className={styles.spinnerIcon} />
                      Guardando...
                    </>
                  ) : (
                    "Guardar"
                  )}
                </button>
                <button 
                  className={styles.cancelButtonModern} 
                  onClick={handleCancel}
                  disabled={saving || uploadingImage}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}

        {/* LAYOUT PRINCIPAL */}
        <div className={styles.layoutModern}>
          {/* COLUMNA IZQUIERDA */}
          <div className={styles.leftColumnModern}>
            {/* PERFIL */}
            <div className={styles.profileHeaderModern}>
              {isEditing ? (
                <label className={styles.profilePicEditModern}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setProfileImageFile(file);
                        setDraft({ ...draft, profileImage: URL.createObjectURL(file) });
                      }
                    }}
                    className={styles.fileInputModern}
                  />
                  {draft.profileImage ? (
                    <img src={draft.profileImage} alt="Perfil" className={styles.profilePicModern} />
                  ) : (
                    <Camera size={28} color="#999" />
                  )}
                </label>
              ) : (
                <div className={styles.profilePicDisplayModern}>
                  {businessData.profileImage ? (
                    <img src={businessData.profileImage} alt="Perfil" className={styles.profilePicModern} />
                  ) : (
                    <User size={40} color="#999" />
                  )}
                </div>
              )}

              <div className={styles.nameStatusModern}>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value.slice(0, 100) })}
                      className={styles.editInputModern}
                      placeholder="Nombre del negocio *"
                      maxLength={100}
                    />
                    <span style={{ fontSize: "0.75rem", color: "#666" }}>
                      {draft.name.length}/100 caracteres
                    </span>
                  </>
                ) : (
                  <>
                    <h1 className={styles.businessNameModern}>
                      {businessData.name || "Sin nombre"}
                    </h1>
                    <span className={styles[getCurrentStatus(schedule).color]}>
                      {status}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* DESCRIPCIÓN */}
            <div className={styles.descriptionSectionModern}>
              {isEditing ? (
                <>
                  <textarea
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value.slice(0, 500) })}
                    className={styles.textareaModern}
                    placeholder="Descripción del negocio *"
                    maxLength={500}
                  />
                  <span style={{ fontSize: "0.75rem", color: "#666", textAlign: "right", display: "block" }}>
                    {draft.description.length}/500 caracteres
                  </span>
                </>
              ) : (
                <p className={styles.descriptionTextModern}>
                  {businessData.description || "Sin descripción"}
                </p>
              )}
            </div>

            {/* HORARIOS */}
            {!isEditing && (
              <div className={styles.horarioClienteModern}>
                <button
                  className={styles.toggleScheduleModern}
                  onClick={() => setShowFullSchedule(!showFullSchedule)}
                >
                  <Clock size={16} />
                  Ver horarios
                </button>
                {showFullSchedule && (
                  <div className={styles.tablaHorariosModern}>
                    {Object.entries(schedule).map(([day, hoy]) => (
                      <div key={day} className={styles.filaClienteModern}>
                        <span className={styles.diaClienteModern}>{day}</span>
                        <span className={styles.horarioClienteTextModern}>
                          {hoy.cerrado ? "Cerrado" : hoy.deCorrido ? `${hoy.open} – ${hoy.close}` : `Mañana: ${hoy.manana.open} – ${hoy.manana.close} | Tarde: ${hoy.tarde.open} – ${hoy.tarde.close}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CONTACTO */}
            <div className={styles.contactInfoModern}>
              {/* DIRECCIÓN - PRÓXIMAMENTE */}
              <div className={styles.rowModern}>
                <MapPin color="#999" size={18} />
                <div className={styles.comingSoonText}>
                  Sin dirección - Próximamente
                </div>
              </div>

              {/* TELÉFONO */}
              <div className={styles.rowModern}>
                <Phone color="#333" size={18} />
                {isEditing ? (
                  <div style={{ flex: 1 }}>
                    {!isValidPhone(draft.phone) && draft.phone !== "" && (
                      <span className={styles.errorMsgModern}>
                        Número incompleto (faltan dígitos)
                      </span>
                    )}
                    <input
                      type="tel"
                      value={draft.phone}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
                        const formatted = raw.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
                        setDraft({ ...draft, phone: formatted });
                      }}
                      className={`${styles.editInputModern} ${!isValidPhone(draft.phone) && draft.phone !== "" ? styles.invalidModern : ""}`}
                      placeholder="(123) 456-7890"
                    />
                  </div>
                ) : (
                  <span>{businessData.phone || "Sin teléfono"}</span>
                )}
              </div>

              {/* EMAIL */}
              <div className={styles.rowModern}>
                <Mail color="#333" size={18} />
                {isEditing ? (
                  <div style={{ flex: 1 }}>
                    {!isValidEmail(draft.email) && draft.email !== "" && (
                      <span className={styles.errorMsgModern}>Correo inválido</span>
                    )}
                    <input
                      type="email"
                      value={draft.email}
                      onChange={(e) => setDraft({ ...draft, email: e.target.value.slice(0, 100) })}
                      className={`${styles.editInputModern} ${!isValidEmail(draft.email) && draft.email !== "" ? styles.invalidModern : ""}`}
                      placeholder="ejemplo@dominio.com"
                      maxLength={100}
                    />
                  </div>
                ) : (
                  <span>{businessData.email || "Sin email"}</span>
                )}
              </div>

              {/* LINK */}
              <div className={styles.rowModern}>
                <Link2 color="#333" size={18} />
                {isEditing ? (
                  <input
                    type="url"
                    value={String(draft.link || "")}
                    onChange={(e) => setDraft({ ...draft, link: e.target.value.slice(0, 200) })}
                    className={styles.editInputModern}
                    placeholder="https://tusitio.com o @tured"
                    maxLength={200}
                  />
                ) : (
                  <span>{String(businessData.link || "") || "Sin link"}</span>
                )}
              </div>
            </div>

            {/* HORARIOS - EDICIÓN */}
            {isEditing && (
              <div className={styles.horarioSectionModern}>
                <div className={styles.horarioHeaderModern}>
                  <Clock size={16} />
                  <span>Configurar horarios</span>
                  <span className={styles.editHintModern}>Marcá "Cerrado" si no abrís ese día</span>
                </div>
                <div className={styles.horarioEditModern}>
                  {Object.entries(draftSchedule).map(([day, hoy]) => (
                    <div key={day} className={styles.diaFilaModern}>
                      <span className={styles.diaNombreModern}>{day}</span>
                      <div className={styles.diaContenidoModern}>
                        <label className={styles.chkCerradoModern}>
                          <input 
                            type="checkbox" 
                            checked={hoy.cerrado} 
                            onChange={(e) =>
                              setDraftSchedule((s) => ({ 
                                ...s, 
                                [day]: { ...s[day], cerrado: e.target.checked } 
                              }))
                            } 
                          />
                          Cerrado
                        </label>
                        {!hoy.cerrado && (
                          <div className={styles.turnosDiaModern}>
                            {hoy.deCorrido ? (
                              <div className={styles.corridoFilaModern}>
                                <span className={styles.turnoLabelModern}>De corrido</span>
                                <input 
                                  type="time" 
                                  value={hoy.open} 
                                  onChange={(e) =>
                                    setDraftSchedule((s) => ({ 
                                      ...s, 
                                      [day]: { ...s[day], open: e.target.value } 
                                    }))
                                  } 
                                />
                                <span className={styles.sepModern}>a</span>
                                <input 
                                  type="time" 
                                  value={hoy.close} 
                                  onChange={(e) =>
                                    setDraftSchedule((s) => ({ 
                                      ...s, 
                                      [day]: { ...s[day], close: e.target.value } 
                                    }))
                                  } 
                                />
                              </div>
                            ) : (
                              <>
                                <div className={styles.turnoFilaModern}>
                                  <span className={styles.turnoLabelModern}>Mañana</span>
                                  <input 
                                    type="time" 
                                    value={hoy.manana.open} 
                                    onChange={(e) =>
                                      setDraftSchedule((s) => ({ 
                                        ...s, 
                                        [day]: { 
                                          ...s[day], 
                                          manana: { ...s[day].manana, open: e.target.value } 
                                        } 
                                      }))
                                    } 
                                  />
                                  <span className={styles.sepModern}>a</span>
                                  <input 
                                    type="time" 
                                    value={hoy.manana.close} 
                                    onChange={(e) =>
                                      setDraftSchedule((s) => ({ 
                                        ...s, 
                                        [day]: { 
                                          ...s[day], 
                                          manana: { ...s[day].manana, close: e.target.value } 
                                        } 
                                      }))
                                    } 
                                  />
                                </div>
                                <div className={styles.turnoFilaModern}>
                                  <span className={styles.turnoLabelModern}>Tarde</span>
                                  <input 
                                    type="time" 
                                    value={hoy.tarde.open} 
                                    onChange={(e) =>
                                      setDraftSchedule((s) => ({ 
                                        ...s, 
                                        [day]: { 
                                          ...s[day], 
                                          tarde: { ...s[day].tarde, open: e.target.value } 
                                        } 
                                      }))
                                    } 
                                  />
                                  <span className={styles.sepModern}>a</span>
                                  <input 
                                    type="time" 
                                    value={hoy.tarde.close} 
                                    onChange={(e) =>
                                      setDraftSchedule((s) => ({ 
                                        ...s, 
                                        [day]: { 
                                          ...s[day], 
                                          tarde: { ...s[day].tarde, close: e.target.value } 
                                        } 
                                      }))
                                    } 
                                  />
                                </div>
                              </>
                            )}
                            <label className={styles.chkCorridoModern}>
                              <input 
                                type="checkbox" 
                                checked={hoy.deCorrido} 
                                onChange={(e) =>
                                  setDraftSchedule((s) => ({ 
                                    ...s, 
                                    [day]: { ...s[day], deCorrido: e.target.checked } 
                                  }))
                                } 
                              />
                              De corrido
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA - PORTADA */}
          <div className={styles.rightColumnModern}>
            {isEditing && (
              <div className={styles.coverEditToolsModern}>
                <label className={styles.coverButtonModern}>
                  <Image size={20} />
                  {draft.coverImage ? "Cambiar portada" : "Subir portada"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setCoverImageFile(file);
                        setDraft({ ...draft, coverImage: URL.createObjectURL(file) });
                      }
                    }}
                    className={styles.fileInputModern}
                  />
                </label>
                {draft.coverImage && (
                  <button 
                    className={styles.removeCoverButtonModern} 
                    onClick={() => {
                      setDraft({ ...draft, coverImage: null });
                      setCoverImageFile(null);
                    }}
                  >
                    Eliminar portada
                  </button>
                )}
              </div>
            )}

            <div className={styles.coverDisplayModern}>
              {businessData.coverImage ? (
                <img src={businessData.coverImage} alt="Portada" className={styles.coverImageModern} />
              ) : (
                <div className={styles.coverPlaceholderModern}>
                  <Image size={48} color="#ccc" />
                  <span>Sin portada</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ACCIONES EXTERNAS */}
      <div className={styles.externalActionsModern}>
        {!isEditing && (
          <div className={styles.actionsModern}>
            <button className={styles.favButtonModern}>
              <Star color="#e74c3c" /> Favorito
            </button>
            {businessData.link && String(businessData.link).trim() !== "" && (
              <a 
                href={String(businessData.link).startsWith('http') ? String(businessData.link) : `https://${String(businessData.link)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialButtonModern}
                style={{ textDecoration: 'none' }}
              >
                {String(businessData.link)} <ArrowRight size={16} />
              </a>
            )}
          </div>
        )}

        {isOwner && !businessId && !isEditing && (
          <div className={styles.infoBanner}>
            <AlertCircle size={18} />
            Completa los datos de tu negocio para empezar a publicar
          </div>
        )}

        {isOwner && businessId && !isEditing && (
          <div className={styles.createActionsModern}>
            <button 
              className={styles.createButtonModern} 
              onClick={() => { 
                setModalType("post"); 
                setShowModal(true); 
              }}
            >
              <Plus size={16} /> <span>Publicación</span>
            </button>
            <button 
              className={styles.createButtonModern} 
              onClick={() => { 
                setModalType("event"); 
                setShowModal(true); 
              }}
            >
              <Plus size={16} /> <span>Evento</span>
            </button>
          </div>
        )}
      </div>

      {/* PUBLICACIONES */}
      <div className={styles.postsSectionModern}>
        <h3 className={styles.postsTitleModern}>Publicaciones y Eventos</h3>
        {sortedPosts.length === 0 ? (
          <p className={styles.noPostsModern}>Aún no hay publicaciones.</p>
        ) : (
          <div className={styles.postsCenteredWrapper}>
            <div className={styles.postsStackModern}>
              {sortedPosts.map((post) => (
                <div key={post.id} className={styles.postCardModern}>
                  {post.images && post.images.length > 0 && (
                    <PostGallery images={post.images.map(img => 
                      typeof img === 'string' ? img : URL.createObjectURL(img)
                    )} />
                  )}

                  <div className={styles.postContentModern}>
                    <p className={styles.postTextModern}>{post.text}</p>

                    {post.type === "event" && (
                      <div className={styles.eventDetailsModern}>
                        {post.date && <span><Calendar size={14} /> {post.date}</span>}
                        {post.time && <span><Clock size={14} /> {post.time}</span>}
                        {post.location && <span><MapPin size={14} /> {post.location}</span>}
                        {post.taggedBusiness && <span><User size={14} /> Con: {post.taggedBusiness}</span>}
                      </div>
                    )}

                    <span className={styles.postDateModern}>{timeAgo(post.createdAt)}</span>

                    {isOwner && (
                      <div className={styles.postActionsModern}>
                        <button 
                          onClick={() => handleEditPost(post)} 
                          className={styles.editPostButtonModern}
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDeletePost(post.id)} 
                          className={styles.deletePostButtonModern}
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE PUBLICACIÓN */}
      <CreatePostModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingPost(null);
        }}
        onSubmit={handleSubmitPost}
        type={modalType}
        initialData={editingPost}
      />
    </>
  );
};

export default ProfileHeader;