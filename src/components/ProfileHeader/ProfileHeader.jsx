import React, { useState, useEffect, useMemo, useContext, useCallback } from "react";
import { UserContext } from "../../pages/UserContext";
import { 
  getBusinessByUserId, 
  updateBusiness, 
  createBusiness,
  uploadProfileImage,
  uploadCoverImage,
  createPost,
  getPostsByCommerce,
  deletePost,           // ✅ Importar función de eliminar
  updatePostText,       // ✅ Nueva función para editar texto
  addImagesToPost,      // ✅ Para agregar imágenes en edición
  deleteImagesFromPost  // ✅ Para eliminar imágenes en edición
} from "../../Api/Api";
import styles from "./ProfileHeader.module.css";
import {
  MapPin, Clock, Phone, Mail, Star, ArrowRight, Edit2,
  User, Camera, Image, Plus, Calendar,
  Loader, AlertCircle, Check, Link2,
  ChevronLeft, ChevronRight, Info, MessageCircle, Bookmark
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

const normalizeBusinessData = (data) => {
  console.log("🖼️ Normalizando datos de negocio:", {
    rawProfileImage: data?.profileImage,
    rawCoverImage: data?.coverImage
  });
  
  return {
    name: data?.name || "",
    email: data?.email || "",
    phone: data?.phone || "",
    link: data?.link ? String(data.link) : "",
    description: data?.description || "",
    // ✅ CORREGIDO: Extraer URL de objetos de imagen
    profileImage: data?.profileImage?.url || data?.profileImage || null,
    coverImage: data?.coverImage?.url || data?.coverImage || null,
  };
};

// ✅ MEJORADO: Normalización con IDs de imágenes para edición
const normalizePostFromBackend = (post) => {
  // Si el backend ya devuelve el formato correcto (futuro)
  if (post.text && post.images && Array.isArray(post.images) && typeof post.images[0] === 'string') {
    return {
      id: post.id,
      text: post.text,
      images: post.images,
      imageDetails: [], // No hay detalles en formato simple
      type: "post",
      businessName: post.businessName,
      createdAt: post.createdAt,
    };
  }
  
  // Formato actual del backend (con objetos de imagen)
  const sortedImages = post.images
    ? post.images.sort((a, b) => a.imageOrder - b.imageOrder)
    : [];
  
  return {
    id: post.idPost,
    text: post.description,
    images: sortedImages.map(img => img.url), // Solo URLs para el componente de galería
    imageDetails: sortedImages.map(img => ({ // Detalles completos para edición
      id: img.idImage,
      url: img.url,
      order: img.imageOrder,
      publicId: img.publicId,
      originalFileName: img.originalFileName
    })),
    type: "post",
    businessName: post.nameCommerce,
    createdAt: post.postedAt,
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

// ✅ MEJORA 3: Hook personalizado para validaciones
const useFormValidation = () => {
  const [errors, setErrors] = useState({});

  const validate = useCallback((field, value, rules) => {
    let error = "";

    if (rules.required && !value?.trim()) {
      error = `${field} es obligatorio`;
    } else if (rules.maxLength && value?.length > rules.maxLength) {
      error = `Máximo ${rules.maxLength} caracteres`;
    } else if (rules.email && value && !isValidEmail(value)) {
      error = "Correo inválido";
    } else if (rules.phone && value && !isValidPhone(value)) {
      error = "Número debe tener 10 dígitos";
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  }, []);

  const clearErrors = useCallback(() => setErrors({}), []);

  return { errors, validate, clearErrors };
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const ProfileHeader = ({ isOwner = false, businessData: externalBusinessData = null }) => {
  const { user } = useContext(UserContext);
  
  // ✅ MEJORA 5: Estados de carga granulares
  const [loadingStates, setLoadingStates] = useState({
    business: true,
    posts: false,
    profileImage: false,
    coverImage: false,
    savingBusiness: false,
    creatingPost: false,
    deletingPost: false,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("post");
  const [posts, setPosts] = useState([]);
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

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

  const [profileImageFile, setProfileImageFile] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);

  // ✅ MEJORA 3: Hook de validación
  const { errors, validate, clearErrors } = useFormValidation();

  // ✅ MEJORA 2: Limpiar URLs de objeto al desmontar
useEffect(() => {
  return () => {
    if (typeof draft.profileImage === 'string' && draft.profileImage.startsWith('blob:')) {
      URL.revokeObjectURL(draft.profileImage);
    }
    if (typeof draft.coverImage === 'string' && draft.coverImage.startsWith('blob:')) {
      URL.revokeObjectURL(draft.coverImage);
    }
  };
}, [draft.profileImage, draft.coverImage]);

  // ============================================
// CARGAR DATOS
// ============================================

useEffect(() => {
 // Si hay datos externos (perfil público), usarlos directamente
if (externalBusinessData) {
  console.log("🟢 Usando datos externos del negocio:", externalBusinessData.name);
  console.log("🖼️ Datos de imagen antes de normalizar:", {
    profileImage: externalBusinessData.profileImage,
    coverImage: externalBusinessData.coverImage
  });
  
  const loadedData = normalizeBusinessData(externalBusinessData);
  
  console.log("🖼️ Datos de imagen después de normalizar:", {
    profileImage: loadedData.profileImage,
    coverImage: loadedData.coverImage
  });
  
  setBusinessData(loadedData);
  setDraft(loadedData);
  setBusinessId(externalBusinessData.idCommerce || externalBusinessData.id_business);
  setLoadingStates(prev => ({ ...prev, business: false }));
  
  // Cargar publicaciones si hay ID
  if (externalBusinessData.idCommerce || externalBusinessData.id_business) {
    loadPosts(externalBusinessData.idCommerce || externalBusinessData.id_business);
  }
  return;
}

  // Si no hay datos externos, cargar "Mi negocio" (comportamiento original)
  if (user?.id_user) {
    loadBusinessData();
  } else {
    setLoadingStates(prev => ({ ...prev, business: false }));
  }
}, [user?.id_user, externalBusinessData]);

  useEffect(() => {
    const info = getCurrentStatus(schedule);
    setStatus(info.label);
  }, [schedule]);

  // ✅ CORREGIDO: Estructura del if/else y pasar ID explícitamente
  const loadBusinessData = async () => {
    if (!user?.id_user) {
      setLoadingStates(prev => ({ ...prev, business: false }));
      setError("No hay usuario autenticado");
      return;
    }

    setLoadingStates(prev => ({ ...prev, business: true }));
    setError("");

    try {
      console.log("📥 Cargando negocio del usuario:", user.id_user);
      const business = await getBusinessByUserId(user.id_user);
      
      if (business) {
        console.log("✅ Negocio encontrado:", business);
        setBusinessId(business.id_business);
        console.log("✅ ID de negocio establecido:", business.id_business);
        console.log("✅ ID de usuario:", business.id_user);
        if (!business.id_business) {
          console.error("❌ ERROR: No se recibió id_business del backend");
          throw new Error("No se pudo obtener el ID del negocio");}
          setBusinessId(business.id_business);

        
        const loadedData = normalizeBusinessData(business);
        setBusinessData(loadedData);
        setDraft(loadedData);

        // ✅ CORREGIDO: Pasar ID explícitamente
        await loadPosts(business.id_business);
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
        setPosts([]);
      }
    } catch (err) {
      console.error("❌ Error al cargar negocio:", err);
      setError(err.message || "Error al cargar los datos del negocio");
    } finally {
      setLoadingStates(prev => ({ ...prev, business: false }));
    }
  };

  // ✅ Cargar publicaciones del comercio
  const loadPosts = async (commerceId) => {
    const idToUse = commerceId || businessId;
    
    if (!idToUse) {
      console.log("⚠️ No hay businessId, no se cargan publicaciones");
      return;
    }

    setLoadingStates(prev => ({ ...prev, posts: true }));

    try {
      console.log("📥 Cargando publicaciones del comercio:", idToUse);
      const commercePosts = await getPostsByCommerce(idToUse);
      
      const normalized = Array.isArray(commercePosts) 
        ? commercePosts.map(normalizePostFromBackend)
        : [];
      
      setPosts(normalized);
      console.log("✅ Publicaciones cargadas:", normalized.length);
    } catch (err) {
      console.error("❌ Error al cargar publicaciones:", err);
      setPosts([]);
    } finally {
      setLoadingStates(prev => ({ ...prev, posts: false }));
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

  setLoadingStates(prev => ({ ...prev, profileImage: true }));
  setError("");

  try {
    console.log("📤 Subiendo imagen de perfil...");
    const result = await uploadProfileImage(businessId, file);
    console.log("✅ Resultado completo:", result);

    if (result.profileImage) {
      // ✅ FIX: Actualizar ambos estados inmediatamente
      const newImageUrl = result.profileImage;
      
      setBusinessData(prev => ({
        ...prev,
        profileImage: newImageUrl
      }));
      
      setDraft(prev => ({
        ...prev,
        profileImage: newImageUrl
      }));
      
      // ✅ Limpiar el archivo temporal
      setProfileImageFile(null);
      
      showSuccessMessage("✅ Imagen de perfil actualizada");
    } else {
      throw new Error("No se recibió la URL de la imagen actualizada");
    }
  } catch (err) {
    console.error("❌ Error al subir imagen:", err);
    showErrorMessage(err.message || "Error al subir imagen de perfil");
  } finally {
    setLoadingStates(prev => ({ ...prev, profileImage: false }));
  }
};




const handleCoverImageUpload = async (file) => {
  if (!businessId) {
    setError("Primero debes crear el negocio antes de subir imágenes");
    return;
  }

  setLoadingStates(prev => ({ ...prev, coverImage: true }));
  setError("");

  try {
    console.log("📤 Subiendo imagen de portada...");
    const result = await uploadCoverImage(businessId, file);
    console.log("✅ Resultado completo de uploadCoverImage:", result);

    if (result.coverImage) {
      setBusinessData(prev => ({
        ...prev,
        coverImage: result.coverImage
      }));
      
      if (isEditing) {
        setDraft(prev => ({
          ...prev,
          coverImage: result.coverImage
        }));
      }
      
      setCoverImageFile(null);
      showSuccessMessage("✅ Imagen de portada actualizada");
    } else {
      throw new Error("No se recibió la URL de la imagen actualizada");
    }
  } catch (err) {
    console.error("❌ Error al subir portada:", err);
    showErrorMessage(err.message || "Error al subir imagen de portada");
  } finally {
    setLoadingStates(prev => ({ ...prev, coverImage: false }));
  }
};


  // ✅ MEJORA 6: Funciones helper para mensajes
  const showSuccessMessage = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const showErrorMessage = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 5000);
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
    clearErrors();
  };

  // ✅ CORREGIDO: Estructura if/else y validaciones mejoradas
  const handleSave = async () => {
    const trimmedName = (draft.name || "").trim();
    const trimmedDescription = (draft.description || "").trim();
    const trimmedEmail = (draft.email || "").trim();
    const trimmedPhone = (draft.phone || "").trim();
    
    // ✅ MEJORA 3: Validaciones con hook
    let isValid = true;
    
    if (!validate("name", trimmedName, { required: true, maxLength: 100 })) {
      isValid = false;
    }
    
    if (!validate("description", trimmedDescription, { required: true, maxLength: 500 })) {
      isValid = false;
    }
    
    if (trimmedEmail && !validate("email", trimmedEmail, { email: true })) {
      isValid = false;
    }
    
    if (trimmedPhone && !validate("phone", trimmedPhone, { phone: true })) {
      isValid = false;
    }

    if (!isValid) {
      const firstError = Object.values(errors).find(e => e);
      setError(firstError || "Por favor corrige los errores");
      return;
    }

    setLoadingStates(prev => ({ ...prev, savingBusiness: true }));
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

      // ✅ CORREGIDO: Lógica if/else bien estructurada
      if (businessId) {
        console.log("📤 Actualizando negocio:", businessId, dataToSend);
        await updateBusiness(businessId, dataToSend);
        savedBusinessId = businessId;
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

      if (profileImageFile) {
        await handleProfileImageUpload(profileImageFile);
      }

      if (coverImageFile) {
        await handleCoverImageUpload(coverImageFile);
      }

      await loadBusinessData();
      setSchedule(draftSchedule);
      
      setIsEditing(false);
      showSuccessMessage("✅ Datos guardados correctamente");
    } catch (err) {
      console.error("❌ Error al guardar:", err);
      showErrorMessage(err.message || "Error al guardar los datos");
    } finally {
      setLoadingStates(prev => ({ ...prev, savingBusiness: false }));
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
    clearErrors();
  };

  // ✅ MEJORA 4: Optimizar re-renders con useCallback
  const handleInputChange = useCallback((field) => (e) => {
    const value = e.target.value;
    setDraft(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePhoneChange = useCallback((e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    const formatted = raw.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
    setDraft(prev => ({ ...prev, phone: formatted }));
  }, []);

  // ============================================
  // PUBLICACIONES
  // ============================================

  const sortedEvents = useMemo(() => posts.filter((p) => p.type === "event"), [posts]);

  const sortedPosts = useMemo(() => 
    [...posts]
      .filter((p) => p.type !== "event")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), 
    [posts]
  );

// ============================================
// FUNCIONES DE PUBLICACIONES
// ============================================

const handleSubmitPost = async (data) => {
  console.log('🔍 handleSubmitPost - Datos recibidos:', {
    text: data.text?.slice(0, 50),
    imageFiles: data.imageFiles?.length || 0,
    imagesToDelete: data.imagesToDelete?.length || 0,
    existingImages: data.existingImages?.length || 0,
    isEditing: !!editingPost
  });

  if (!businessId) {
    showErrorMessage("Necesitas crear el negocio primero");
    return;
  }

  const businessIdNumber = typeof businessId === 'string' 
    ? parseInt(businessId, 10) 
    : businessId;

  if (isNaN(businessIdNumber)) {
    showErrorMessage("ID de comercio inválido");
    return;
  }

  setLoadingStates(prev => ({ ...prev, creatingPost: true }));
  setError("");

  try {
    if (editingPost) {
      // ✅ MODO EDICIÓN: Dividir en 3 pasos
      
      // 1️⃣ Actualizar texto (siempre)
      console.log('✏️ Paso 1: Actualizando texto...');
      const updatedPost = await updatePostText(
        editingPost.id,
        data.text,
        businessIdNumber
      );
      
      // 2️⃣ Eliminar imágenes si hay
      if (data.imagesToDelete && data.imagesToDelete.length > 0) {
        console.log('🗑️ Paso 2: Eliminando imágenes:', data.imagesToDelete);
        await deleteImagesFromPost(editingPost.id, data.imagesToDelete);
      }
      
      // 3️⃣ Agregar nuevas imágenes si hay
      if (data.imageFiles && data.imageFiles.length > 0) {
        console.log('📤 Paso 3: Agregando nuevas imágenes:', data.imageFiles.length);
        await addImagesToPost(editingPost.id, data.imageFiles);
      }
      
      // 4️⃣ Recargar el post completo desde el backend
      console.log('🔄 Paso 4: Recargando publicaciones...');
      await loadPosts(businessIdNumber);
      
      showSuccessMessage("✅ Publicación actualizada correctamente");
      setShowModal(false);
      
    } else {
      // ✅ MODO CREACIÓN
      if (!data.imageFiles || data.imageFiles.length === 0) {
        showErrorMessage("Debes subir al menos una imagen");
        return;
      }
      
      console.log("📤 Creando nueva publicación...");
      const response = await createPost(
        data.text,
        businessIdNumber,
        data.imageFiles
      );

      console.log("✅ Respuesta del backend:", response);
      
      // Recargar publicaciones desde el servidor
      await loadPosts(businessIdNumber);
      
      showSuccessMessage("✅ Publicación creada correctamente");
      setShowModal(false);
    }
  } catch (error) {
    console.error("❌ Error al guardar publicación:", error);
    showErrorMessage(error.message || "Error al guardar la publicación");
  } finally {
    setLoadingStates(prev => ({ ...prev, creatingPost: false }));
    setEditingPost(null);
  }
};

// ✅ FUNCIÓN PARA ELIMINAR POST
const handleDeletePost = async (postId) => {
  if (!window.confirm('¿Estás seguro de eliminar esta publicación? Esta acción no se puede deshacer.')) {
    return;
  }
  
  setLoadingStates(prev => ({ ...prev, deletingPost: true }));
  setError("");
  
  try {
    console.log('🗑️ Eliminando publicación:', postId);
    await deletePost(postId);
    
    // Actualizar estado local
    setPosts(prev => prev.filter(p => p.id !== postId));
    
    showSuccessMessage("✅ Publicación eliminada correctamente");
  } catch (error) {
    console.error("❌ Error al eliminar publicación:", error);
    showErrorMessage(error.message || "Error al eliminar la publicación");
  } finally {
    setLoadingStates(prev => ({ ...prev, deletingPost: false }));
  }
};

// ✅ FUNCIÓN PARA EDITAR POST
const handleEditPost = (post) => {
  setEditingPost(post);
  setModalType(post.type);
  setShowModal(true);
};

  // ============================================
  // RENDERIZADO
  // ============================================

  if (loadingStates.business) {
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

  const isUploading = loadingStates.profileImage || loadingStates.coverImage;
  const isSaving = loadingStates.savingBusiness || loadingStates.creatingPost;

  return (
    <>
      <div className={styles.headerContainer}>
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

        {isUploading && (
          <div className={styles.infoBanner}>
            <Loader size={18} className={styles.spinnerIcon} />
            Subiendo imagen...
          </div>
        )}

        {isSaving && (
          <div className={styles.infoBanner}>
            <Loader size={18} className={styles.spinnerIcon} />
            {isEditing ? "Guardando cambios..." : "Creando publicación..."}
          </div>
        )}

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
                  disabled={isSaving || isUploading}
                >
                  {loadingStates.savingBusiness ? (
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
                  disabled={isSaving || isUploading}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}

        <div className={styles.layoutModern}>
          <div className={styles.leftColumnModern}>
            <div className={styles.profileHeaderModern}>
              {isEditing ? (
                <label className={styles.profilePicEditModern}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // ✅ MEJORA 2: Limpiar URL anterior
                        if (draft.profileImage?.startsWith('blob:')) {
                          URL.revokeObjectURL(draft.profileImage);
                        }
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
                      onChange={(e) => {
                        handleInputChange("name")(e);
                        validate("name", e.target.value, { required: true, maxLength: 100 });
                      }}
                      className={`${styles.editInputModern} ${errors.name ? styles.invalidModern : ""}`}
                      placeholder="Nombre del negocio *"
                      maxLength={100}
                    />
                    {errors.name && <span className={styles.errorMsgModern}>{errors.name}</span>}
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

            <div className={styles.descriptionSectionModern}>
              {isEditing ? (
                <>
                  <textarea
                    value={draft.description}
                    onChange={(e) => {
                      handleInputChange("description")(e);
                      validate("description", e.target.value, { required: true, maxLength: 500 });
                    }}
                    className={`${styles.textareaModern} ${errors.description ? styles.invalidModern : ""}`}
                    placeholder="Descripción del negocio *"
                    maxLength={500}
                  />
                  {errors.description && <span className={styles.errorMsgModern}>{errors.description}</span>}
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

            <div className={styles.contactInfoModern}>
              <div className={styles.rowModern}>
                <Phone color="#333" size={18} />
                {isEditing ? (
                  <div style={{ flex: 1 }}>
                    <input
                      type="tel"
                      value={draft.phone}
                      onChange={(e) => {
                        handlePhoneChange(e);
                        validate("phone", e.target.value, { phone: true });
                      }}
                      className={`${styles.editInputModern} ${errors.phone ? styles.invalidModern : ""}`}
                      placeholder="(123) 456-7890"
                    />
                    {errors.phone && <span className={styles.errorMsgModern}>{errors.phone}</span>}
                  </div>
                ) : (
                  <span>{businessData.phone || "Sin teléfono"}</span>
                )}
              </div>

              <div className={styles.rowModern}>
                <Mail color="#333" size={18} />
                {isEditing ? (
                  <div style={{ flex: 1 }}>
                    <input
                      type="email"
                      value={draft.email}
                      onChange={(e) => {
                        handleInputChange("email")(e);
                        validate("email", e.target.value, { email: true });
                      }}
                      className={`${styles.editInputModern} ${errors.email ? styles.invalidModern : ""}`}
                      placeholder="ejemplo@dominio.com"
                      maxLength={60}
                    />
                    {errors.email && <span className={styles.errorMsgModern}>{errors.email}</span>}
                  </div>
                ) : (
                  <span>{businessData.email || "Sin email"}</span>
                )}
              </div>

              <div className={styles.rowModern}>
                <Link2 color="#333" size={18} />
                {isEditing ? (
                  <input
                    type="url"
                    value={String(draft.link || "")}
                    onChange={handleInputChange("link")}
                    className={styles.editInputModern}
                    placeholder="https://tusitio.com o @tured"
                    maxLength={200}
                  />
                ) : (
                  <span>{String(businessData.link || "") || "Sin link"}</span>
                )}
              </div>
            </div>

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

          <div className={styles.rightColumnModern}>
            {isEditing && (
              <div className={styles.coverPreviewModern}>
                <label className={styles.coverButtonModern}>
                  <Image size={20} />
                  {draft.coverImage ? "Cambiar portada" : "Subir portada"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // ✅ MEJORA 2: Limpiar URL anterior
                            if (typeof draft.coverImage === 'string' && draft.coverImage.startsWith('blob:')) {

                          URL.revokeObjectURL(draft.coverImage);
                        }
                        setCoverImageFile(file);
                        setDraft({ ...draft, coverImage: URL.createObjectURL(file) });
                      }
                    }}
                    className={styles.fileInputModern}
                  />
                </label>
                {draft.coverImage && (
                  <img src={draft.coverImage} alt="Vista previa" className={styles.coverPreviewImgModern} />
                )}
              </div>
            )}
            {!isEditing && (
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
            )}
          </div>
        </div>
      </div>

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
              disabled={loadingStates.creatingPost}
            >
              <Plus size={16} /> <span>Publicación</span>
            </button>
            <button 
              className={styles.createButtonModern} 
              onClick={() => { 
                setModalType("event"); 
                setShowModal(true); 
              }}
              disabled={loadingStates.creatingPost}
            >
              <Plus size={16} /> <span>Evento</span>
            </button>
          </div>
        )}
      </div>

      <div className={styles.tabBarModern}>
        <button
          className={`${styles.tabButtonModern} ${activeTab === "posts" ? styles.activeTabModern : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          Publicaciones ({sortedPosts.length})
        </button>
        <button
          className={`${styles.tabButtonModern} ${activeTab === "events" ? styles.activeTabModern : ""}`}
          onClick={() => setActiveTab("events")}
        >
          Eventos ({sortedEvents.length})
        </button>
      </div>

      <div className={styles.tabContentModern}>
        {activeTab === "posts" && (
          <div className={styles.postsCenteredWrapper}>
            {loadingStates.posts ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <Loader size={32} className={styles.spinnerIcon} />
                <p style={{ marginTop: "1rem", color: "#666" }}>Cargando publicaciones...</p>
              </div>
            ) : sortedPosts.length === 0 ? (
              <div className={styles.noPostsModern}>
                {isOwner ? "Aún no hay publicaciones. ¡Crea la primera!" : "Este negocio no tiene publicaciones todavía"}
              </div>
            ) : (
              <div className={styles.postsStackModern}>
                {sortedPosts.map((post) => (
                  <div key={post.id} className={styles.postCardModern}>
                    {post.images && post.images.length > 0 && (
                      <PostGallery images={post.images} showThumbnails={true} />
                    )}
                    <div className={styles.postContentModern}>
                      <p className={styles.postTextModern}>{post.text}</p>
                      <span className={styles.postDateModern}>{timeAgo(post.createdAt)}</span>
                      {isOwner && (
                        <div className={styles.postActionsModern}>
                          <button 
                            onClick={() => handleEditPost(post)} 
                            className={styles.editPostButtonModern}
                            disabled={loadingStates.deletingPost}
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDeletePost(post.id)} 
                            className={styles.deletePostButtonModern}
                            disabled={loadingStates.deletingPost}
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
        )}

        {activeTab === "events" && (
          <div className={styles.eventsCenteredWrapper}>
            {sortedEvents.length === 0 ? (
              <div className={styles.noPostsModern}>
                {isOwner ? "Aún no hay eventos. ¡Crea el primero!" : "Este negocio no tiene eventos todavía"}
              </div>
            ) : (
              <div className={styles.eventsStackModern}>
                {sortedEvents.map((event) => (
                  <div key={event.id} className={styles.eventCardModern}>
                    {event.images && event.images.length > 0 && (
                      <PostGallery images={event.images} showThumbnails={true} />
                    )}
                    <div className={styles.eventContentModern}>
                      <h3 className={styles.eventTitleModern}>{event.text}</h3>
                      <div className={styles.eventMetaModern}>
                        {event.date && <span><Calendar size={14} /> {event.date}</span>}
                        {event.time && <span><Clock size={14} /> {event.time}</span>}
                        {event.location && <span><MapPin size={14} /> {event.location}</span>}
                        {event.taggedBusiness && <span><User size={14} /> Con: {event.taggedBusiness}</span>}
                      </div>
                      <span className={styles.eventDateModern}>{timeAgo(event.createdAt)}</span>
                      {isOwner && (
                        <div className={styles.eventActionsModern}>
                          <button 
                            onClick={() => handleEditPost(event)} 
                            className={styles.editPostButtonModern}
                            disabled={loadingStates.deletingPost}
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDeletePost(event.id)} 
                            className={styles.deletePostButtonModern}
                            disabled={loadingStates.deletingPost}
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
        )}
      </div>

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