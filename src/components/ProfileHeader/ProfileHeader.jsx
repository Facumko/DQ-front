import React, { useState, useEffect, useMemo, useContext } from "react";
import { UserContext } from "../../pages/UserContext";
import { getBusinessByUserId, updateBusiness, createBusiness } from "../../Api/Api";
import styles from "./ProfileHeader.module.css";
import {
  MapPin, Clock, Phone, Mail, Star, ArrowRight, Edit2,
  User, Camera, Image, Plus, Calendar,
  Loader, AlertCircle, Check
} from "lucide-react";
import CreatePostModal from "./CreatePostModal";

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

const getDefaultSchedule = () => ({
  Lun: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
  Mar: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
  Mie: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
  Jue: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
  Vie: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
  Sab: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
  Dom: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "22:00" } },
});

const ProfileHeader = ({ isOwner = false }) => {
  const { user } = useContext(UserContext);
  
  // Estados de carga y error
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Estados de UI
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("post");
  const [posts, setPosts] = useState([]);
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [status, setStatus] = useState("");

  // Datos del negocio
  const [businessId, setBusinessId] = useState(null);
  const [businessData, setBusinessData] = useState({
    name: "",
    email: "",
    phone: "",
    social: "",
    address: "",
    addressDetail: "",
    description: "",
    profileImage: null,
    coverImage: null,
  });

  const [schedule, setSchedule] = useState(getDefaultSchedule());

  // Borradores para edición
  const [draft, setDraft] = useState(businessData);
  const [draftSchedule, setDraftSchedule] = useState(schedule);
  const [editingPost, setEditingPost] = useState(null);

  // ============================================
  // CARGAR DATOS DEL NEGOCIO
  // ============================================
  
  useEffect(() => {
    loadBusinessData();
  }, [user?.id_user]);

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
        
        const loadedData = {
          name: business.name || "",
          email: business.email || user.email || "",
          phone: business.phone || user.phone || "",
          social: business.social || "",
          address: business.address || "",
          addressDetail: business.address_detail || "",
          description: business.description || "",
          profileImage: business.profile_image || null,
          coverImage: business.cover_image || null,
        };
        
        setBusinessData(loadedData);
        setSchedule(business.schedule || getDefaultSchedule());
      } else {
        console.log("⚠️ El usuario no tiene negocio creado");
        
        // Prellenar con datos del usuario
        const defaultData = {
          name: user.name ? `${user.name}${user.lastname ? ' ' + user.lastname : ''}` : "",
          email: user.email || "",
          phone: user.phone || "",
          social: "",
          address: "",
          addressDetail: "",
          description: "",
          profileImage: null,
          coverImage: null,
        };
        
        setBusinessData(defaultData);
        setSchedule(getDefaultSchedule());
      }
    } catch (err) {
      console.error("❌ Error al cargar negocio:", err);
      setError(err.message || "Error al cargar los datos del negocio");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // GUARDAR CAMBIOS
  // ============================================

  const handleEdit = () => {
    setDraft(businessData);
    setDraftSchedule(schedule);
    setIsEditing(true);
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    // Validaciones
    if (!draft.name || draft.name.trim() === "") {
      setError("El nombre del negocio es obligatorio");
      return;
    }
    
    if (draft.name.length > 100) {
      setError("El nombre no puede superar los 100 caracteres");
      return;
    }
    
    if (!draft.description || draft.description.trim() === "") {
      setError("La descripción del negocio es obligatoria");
      return;
    }
    
    if (draft.description.length > 500) {
      setError("La descripción no puede superar los 500 caracteres");
      return;
    }

    if (draft.phone && !isValidPhone(draft.phone)) {
      setError("El número debe tener 10 dígitos");
      return;
    }

    if (draft.email && !isValidEmail(draft.email)) {
      setError("Correo inválido");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const dataToSend = {
        name: draft.name.trim(),
        description: draft.description.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
        social: draft.social.trim(),
        address: draft.address.trim(),
        address_detail: draft.addressDetail.trim(),
        profile_image: draft.profileImage,
        cover_image: draft.coverImage,
        schedule: draftSchedule,
      };

      let result;

      if (businessId) {
        // Actualizar negocio existente
        console.log("📤 Actualizando negocio:", businessId, dataToSend);
        result = await updateBusiness(businessId, dataToSend);
        console.log("✅ Negocio actualizado:", result);
      } else {
        // Crear nuevo negocio
        console.log("📤 Creando nuevo negocio:", dataToSend);
        result = await createBusiness({
          ...dataToSend,
          id_user: user.id_user,
        });
        console.log("✅ Negocio creado:", result);
        setBusinessId(result.id_business);
      }

      // Actualizar estado local
      setBusinessData({
        name: result.name,
        email: result.email,
        phone: result.phone,
        social: result.social,
        address: result.address,
        addressDetail: result.address_detail,
        description: result.description,
        profileImage: result.profile_image,
        coverImage: result.cover_image,
      });
      
      setSchedule(result.schedule);
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
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  // ============================================
  // ESTADO DEL NEGOCIO
  // ============================================

  useEffect(() => {
    const info = getCurrentStatus(schedule);
    setStatus(info.label);
  }, [schedule]);

  const getCurrentStatus = (sch) => {
    const now = new Date();
    const day = now.toLocaleDateString("es-ES", { weekday: "short" });
    const dayMap = { lun: "Lun", mar: "Mar", mié: "Mie", jue: "Jue", vie: "Vie", sáb: "Sab", dom: "Dom" };
    const today = dayMap[day.toLowerCase()];
    
    if (!today) return { isOpen: false, label: "Cerrado", color: "statusClosed" };
    
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
      else label = `Abre a las ${hoy.manana.open}`;
    }
    
    return { isOpen, label, color: isOpen ? "statusOpenModern" : "statusNeutralModern" };
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
        {/* Mensajes */}
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

        {/* Botones de edición */}
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
                  disabled={saving}
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
                  disabled={saving}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}

        <div className={styles.layoutModern}>
          {/* COLUMNA IZQUIERDA */}
          <div className={styles.leftColumnModern}>
            {/* Perfil */}
            <div className={styles.profileHeaderModern}>
              {isEditing ? (
                <label className={styles.profilePicEditModern}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setDraft({ ...draft, profileImage: URL.createObjectURL(e.target.files[0]) })}
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
                    />
                    <span style={{ fontSize: "0.75rem", color: "#665" }}>
                      {draft.name.length}/100 caracteres
                    </span>
                  </>
                ) : (
                  <>
                    <h1 className={styles.businessNameModern}>
                      {businessData.name || "Sin nombre"}
                    </h1>
                    <span className={styles[getCurrentStatus(schedule).color]}>{status}</span>
                  </>
                )}
              </div>
            </div>

            {/* Descripción */}
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

            {/* Horarios (solo lectura) */}
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
                          {hoy.cerrado 
                            ? "Cerrado" 
                            : hoy.deCorrido 
                            ? `${hoy.open} – ${hoy.close}` 
                            : `Mañana: ${hoy.manana.open} – ${hoy.manana.close} | Tarde: ${hoy.tarde.open} – ${hoy.tarde.close}`
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Contacto */}
            <div className={styles.contactInfoModern}>
              <div className={styles.rowModern}>
                <MapPin color="#333" size={18} />
                {isEditing ? (
                  <div className={styles.editColumnModern}>
                    <input
                      type="text"
                      value={draft.address}
                      onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                      className={styles.editInputModern}
                      placeholder="Dirección"
                    />
                    <input
                      type="text"
                      value={draft.addressDetail}
                      onChange={(e) => setDraft({ ...draft, addressDetail: e.target.value })}
                      className={styles.editInputSmallModern}
                      placeholder="Detalle de ubicación"
                    />
                  </div>
                ) : (
                  <div className={styles.addressModern}>
                    {businessData.address || "Sin dirección"}
                    {businessData.addressDetail && (
                      <span className={styles.addressDetailModern}>{businessData.addressDetail}</span>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.rowModern}>
                <Phone color="#333" size={18} />
                {isEditing ? (
                  <>
                    {!isValidPhone(draft.phone) && draft.phone !== "" && (
                      <span className={styles.errorMsgModern}>Número incompleto (faltan dígitos)</span>
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
                  </>
                ) : (
                  <span>{businessData.phone || "Sin teléfono"}</span>
                )}
              </div>

              <div className={styles.rowModern}>
                <Mail color="#333" size={18} />
                {isEditing ? (
                  <>
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
                  </>
                ) : (
                  <span>{businessData.email || "Sin email"}</span>
                )}
              </div>
            </div>

            {/* Edición de Horarios */}
            {isEditing && (
              <div className={styles.horarioSectionModern}>
                <div className={styles.horarioHeaderModern}>
                  <Clock size={16} />
                  <span>Horarios de atención</span>
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
                      if (file) setDraft({ ...draft, coverImage: URL.createObjectURL(file) });
                    }}
                    className={styles.fileInputModern}
                  />
                </label>
                {draft.coverImage && (
                  <button 
                    className={styles.removeCoverButtonModern} 
                    onClick={() => setDraft({ ...draft, coverImage: null })}
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
            <button className={styles.socialButtonModern}>
              {businessData.social || "@usuario"} <ArrowRight size={16} />
            </button>
          </div>
        )}

        {isOwner && !businessId && !isEditing && (
          <div className={styles.infoBanner}>
            <AlertCircle size={18} />
            Completa los datos de tu negocio para empezar a publicar
          </div>
        )}

        {isOwner && businessId && (
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
          <div className={styles.postsGridModern}>
            {sortedPosts.map((post) => (
              <div key={post.id} className={styles.postCardModern}>
                {post.images && post.images.length > 0 && (
                  <img 
                    src={URL.createObjectURL(post.images[0])} 
                    alt="Publicación" 
                    className={styles.postImageModern} 
                  />
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
        )}
      </div>

      {/* MODAL DE PUBLICACIÓN */}
      <CreatePostModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingPost(null);
        }}
        onSubmit={(data) => {
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
        }}
        type={modalType}
        initialData={editingPost}
      />
    </>
  );
};

export default ProfileHeader;