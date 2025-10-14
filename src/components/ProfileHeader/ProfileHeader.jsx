import React, { useState, useEffect, useMemo, useContext } from "react";
import { UserContext } from "../../pages/UserContext";
import { getBusinessByUserId, updateBusiness, createBusiness } from "../../Api/Api";
import styles from "./ProfileHeader.module.css";
import {
  MapPin, Clock, Phone, Mail, Star, ArrowRight, Edit2,
  User, Camera, Image, Plus, Calendar,
  Loader, AlertCircle, Check, Link2
} from "lucide-react";
import CreatePostModal from "./CreatePostModal";

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

// Normalizar datos del backend (convertir null a strings vacíos)
const normalizeBusinessData = (data) => {
  // Asegurar que link sea siempre un string
  let linkValue = "";
  if (data?.link !== null && data?.link !== undefined) {
    linkValue = String(data.link);
  }
  
  return {
    name: data?.name || "",
    email: data?.email || "",
    phone: data?.phone || "",
    link: linkValue,
    description: data?.description || "",
  };
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

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

  // Datos del negocio
  const [businessId, setBusinessId] = useState(null);
  const [businessData, setBusinessData] = useState({
    name: "",
    email: "",
    phone: "",
    link: "",
    description: "",
  });

  // Borradores para edición (inicializar con valores seguros)
  const [draft, setDraft] = useState({
    name: "",
    email: "",
    phone: "",
    link: "",
    description: "",
  });
  const [editingPost, setEditingPost] = useState(null);

  // ============================================
  // CARGAR DATOS DEL NEGOCIO
  // ============================================
  
  useEffect(() => {
    if (user?.id_user) {
      loadBusinessData();
    } else {
      setLoading(false);
    }
  }, [user?.id_user]);

  const loadBusinessData = async () => {
    if (!user?.id_user) {
      console.warn("⚠️ No hay usuario autenticado");
      setLoading(false);
      setError("No hay usuario autenticado");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("📥 Cargando negocio del usuario:", user.id_user);
      const business = await getBusinessByUserId(user.id_user);
      
      console.log("📦 Respuesta getBusinessByUserId:", business);
      
      if (business) {
        console.log("✅ Negocio encontrado:", business);
        
        setBusinessId(business.id_business);
        
        const loadedData = normalizeBusinessData(business);
        
        console.log("📝 Datos procesados:", loadedData);
        
        setBusinessData(loadedData);
        setDraft(loadedData);
      } else {
        console.log("⚠️ El usuario no tiene negocio creado");
        
        // Prellenar con datos del usuario
        const defaultData = {
          name: user.name ? `${user.name}${user.lastname ? ' ' + user.lastname : ''}` : "",
          email: "",
          phone: "",
          link: "",
          description: "",
        };
        
        console.log("📝 Datos por defecto:", defaultData);
        
        setBusinessData(defaultData);
        setDraft(defaultData);
      }
    } catch (err) {
      console.error("❌ Error al cargar negocio:", err);
      setError(err.message || "Error al cargar los datos del negocio");
    } finally {
      setLoading(false);
      console.log("✅ Carga finalizada");
    }
  };

  // ============================================
  // GUARDAR CAMBIOS
  // ============================================

  const handleEdit = () => {
    // Asegurar que draft tenga strings válidos
    setDraft(normalizeBusinessData(businessData));
    setIsEditing(true);
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    // Validaciones
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

      if (businessId) {
        // Actualizar negocio existente
        console.log("📤 Actualizando negocio:", businessId, dataToSend);
        await updateBusiness(businessId, dataToSend);
        console.log("✅ Negocio actualizado, recargando datos...");
        
        // RECARGAR datos del backend después de actualizar
        await loadBusinessData();
      } else {
        // Crear nuevo negocio
        console.log("📤 Creando nuevo negocio:", dataToSend);
        const result = await createBusiness({
          ...dataToSend,
          id_user: user.id_user,
        });
        console.log("✅ Negocio creado:", result);
        setBusinessId(result.id_business);
        
        // Cargar datos del negocio recién creado
        await loadBusinessData();
      }
      
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
    // Restaurar draft con datos normalizados
    setDraft(normalizeBusinessData(businessData));
    setIsEditing(false);
    setError("");
    setSuccess("");
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
        {/* ===== MENSAJES ===== */}
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

        {/* ===== BOTONES DE EDICIÓN ===== */}
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

        {/* ===== LAYOUT PRINCIPAL ===== */}
        <div className={styles.layoutModern}>
          {/* COLUMNA IZQUIERDA */}
          <div className={styles.leftColumnModern}>
            {/* Perfil */}
            <div className={styles.profileHeaderModern}>
              <div className={styles.profilePicDisplayModern}>
                <User size={40} color="#999" />
              </div>

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
                    <span className={styles.statusNeutralModern}>
                      Negocio activo
                    </span>
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

            {/* HORARIOS - PRÓXIMAMENTE */}
            {!isEditing && (
              <div className={styles.horarioClienteModern}>
                <div className={styles.comingSoonBadge}>
                  <Clock size={16} />
                  <span>Horarios - Próximamente</span>
                </div>
              </div>
            )}

            {/* Contacto */}
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

              {/* LINK/RED SOCIAL */}
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
          </div>

          {/* COLUMNA DERECHA - PORTADA */}
          <div className={styles.rightColumnModern}>
            <div className={styles.coverDisplayModern}>
              <div className={styles.coverPlaceholderModern}>
                <Image size={48} color="#ccc" />
                <span>Portada - Próximamente</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== ACCIONES EXTERNAS ===== */}
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

      {/* ===== PUBLICACIONES ===== */}
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

      {/* ===== MODAL DE PUBLICACIÓN ===== */}
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