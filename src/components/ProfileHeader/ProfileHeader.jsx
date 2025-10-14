import React, { useState, useEffect, useMemo, useContext } from "react";
import { UserContext } from "../../pages/UserContext";
import { getBusinessByUserId, updateBusiness, createBusiness } from "../../Api/Api";
import styles from "./ProfileHeader.module.css";
import {
  MapPin, Clock, Phone, Mail, Star, ArrowRight, Edit2,
  User, Camera, Image, Plus, Calendar,
  Loader, AlertCircle, Check, Link as LinkIcon
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

  // Datos del negocio (SOLO CAMPOS QUE EXISTEN EN BACKEND)
  const [businessId, setBusinessId] = useState(null);
  const [businessData, setBusinessData] = useState({
    name: "",
    email: "",
    phone: "",
    link: "", // Backend usa "link" no "social"
    description: "",
  });

  // Borradores para edición
  const [draft, setDraft] = useState(businessData);
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
          link: business.link || "",
          description: business.description || "",
        };
        
        setBusinessData(loadedData);
        setDraft(loadedData);
      } else {
        console.log("⚠️ El usuario no tiene negocio creado");
        
        // Prellenar con datos del usuario
        const defaultData = {
          name: user.name ? `${user.name}${user.lastname ? ' ' + user.lastname : ''}` : "",
          email: user.email || "",
          phone: user.phone || "",
          link: "",
          description: "",
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
  // GUARDAR CAMBIOS
  // ============================================

  const handleEdit = () => {
    setDraft(businessData);
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
        link: draft.link.trim(),
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
        link: result.link,
        description: result.description,
      });
      
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
    setDraft(businessData);
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
              {/* Imagen de perfil - PLACEHOLDER POR AHORA */}
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
                <LinkIcon color="#333" size={18} />
                {isEditing ? (
                  <input
                    type="url"
                    value={draft.link}
                    onChange={(e) => setDraft({ ...draft, link: e.target.value.slice(0, 200) })}
                    className={styles.editInputModern}
                    placeholder="https://tusitio.com o @tured"
                  />
                ) : (
                  <span>{businessData.link || "Sin link"}</span>
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA - PORTADA PLACEHOLDER */}
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

      {/* ACCIONES EXTERNAS */}
      <div className={styles.externalActionsModern}>
        {!isEditing && (
          <div className={styles.actionsModern}>
            <button className={styles.favButtonModern}>
              <Star color="#e74c3c" /> Favorito
            </button>
            {businessData.link && (
              <a 
                href={businessData.link.startsWith('http') ? businessData.link : `https://${businessData.link}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialButtonModern}
                style={{ textDecoration: 'none' }}
              >
                {businessData.link} <ArrowRight size={16} />
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

/* NOTA PARA DESARROLLADORES:
 * 
 * CAMPOS DESHABILITADOS TEMPORALMENTE:
 * - Dirección: Esperando FK de address
 * - Horarios: Esperando endpoint /comercio/traer/horarios/${idCommerce}
 * - Imágenes: Esperando implementación de upload
 * 
 * Para habilitar cuando el backend esté listo:
 * 1. Descomentar código en Api.jsx (buscar "FUTURO:")
 * 2. Descomentar secciones en este componente
 * 3. Activar endpoints correspondientes
 */