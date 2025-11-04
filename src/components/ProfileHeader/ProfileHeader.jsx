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
  deletePost,
  updatePostText,
  addImagesToPost,
  deleteImagesFromPost
} from "../../Api/Api";
import styles from "./ProfileHeader.module.css";
import { Loader, AlertCircle, Check } from "lucide-react";
import CreatePostModal from "./CreatePostModal";
import BusinessInfo from "./components/BusinessInfo";
import BusinessActions from "./components/BusinessActions";
import PostsTabs from "./components/PostsTabs";
import PostsList from "./components/PostsList";

// ============================================
// UTILIDADES
// ============================================

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => phone.replace(/\D/g, "").length === 10;

const normalizeBusinessData = (data) => {
  return {
    name: data?.name || "",
    email: data?.email || "",
    phone: data?.phone || "",
    link: data?.link ? String(data.link) : "",
    description: data?.description || "",
    profileImage: data?.profileImage?.url || data?.profileImage || null,
    coverImage: data?.coverImage?.url || data?.coverImage || null,
  };
};

const normalizePostFromBackend = (post) => {
  if (post.text && post.images && Array.isArray(post.images) && typeof post.images[0] === 'string') {
    return {
      id: post.id,
      text: post.text,
      images: post.images,
      imageDetails: [],
      type: "post",
      businessName: post.businessName,
      createdAt: post.createdAt,
    };
  }
  
  const sortedImages = post.images ? post.images.sort((a, b) => a.imageOrder - b.imageOrder) : [];
  
  return {
    id: post.idPost,
    text: post.description,
    images: sortedImages.map(img => img.url),
    imageDetails: sortedImages.map(img => ({
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

  const { errors, validate, clearErrors } = useFormValidation();

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

  useEffect(() => {
    if (externalBusinessData) {
      const loadedData = normalizeBusinessData(externalBusinessData);
      setBusinessData(loadedData);
      setDraft(loadedData);
      setBusinessId(externalBusinessData.idCommerce || externalBusinessData.id_business);
      setLoadingStates(prev => ({ ...prev, business: false }));
      if (externalBusinessData.idCommerce || externalBusinessData.id_business) {
        loadPosts(externalBusinessData.idCommerce || externalBusinessData.id_business);
      }
      return;
    }
    if (user?.id_user) {
      loadBusinessData();
    } else {
      setLoadingStates(prev => ({ ...prev, business: false }));
    }
  }, [user?.id_user, externalBusinessData]);

  useEffect(() => {
    const now = new Date();
    const day = now.toLocaleDateString("es-ES", { weekday: "short" });
    const dayMap = { lun: "Lun", mar: "Mar", mié: "Mie", jue: "Jue", vie: "Vie", sáb: "Sab", dom: "Dom" };
    const today = dayMap[day.toLowerCase()];
    if (!today || !schedule[today]) {
      setStatus("Cerrado");
      return;
    }
    const hoy = schedule[today];
    if (hoy.cerrado) {
      setStatus("Cerrado");
      return;
    }
    const ahora = now.toTimeString().slice(0, 5);
    let isOpen = false;
    if (hoy.deCorrido) {
      isOpen = ahora >= hoy.open && ahora <= hoy.close;
      setStatus(isOpen ? "Abierto" : `Abre a las ${hoy.open}`);
    } else {
      const openM = ahora >= hoy.manana.open && ahora <= hoy.manana.close;
      const openT = ahora >= hoy.tarde.open && ahora <= hoy.tarde.close;
      isOpen = openM || openT;
      if (openM || openT) setStatus("Abierto");
      else if (ahora < hoy.manana.open) setStatus(`Abre a las ${hoy.manana.open}`);
      else if (ahora < hoy.tarde.open) setStatus(`Abre a las ${hoy.tarde.open}`);
      else setStatus("Cerrado");
    }
  }, [schedule]);

  const loadBusinessData = async () => {
    if (!user?.id_user) {
      setLoadingStates(prev => ({ ...prev, business: false }));
      setError("No hay usuario autenticado");
      return;
    }
    setLoadingStates(prev => ({ ...prev, business: true }));
    setError("");
    try {
      const business = await getBusinessByUserId(user.id_user);
      if (business) {
        setBusinessId(business.id_business);
        if (!business.id_business) throw new Error("No se pudo obtener el ID del negocio");
        const loadedData = normalizeBusinessData(business);
        setBusinessData(loadedData);
        setDraft(loadedData);
        await loadPosts(business.id_business);
      } else {
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
      setError(err.message || "Error al cargar los datos del negocio");
    } finally {
      setLoadingStates(prev => ({ ...prev, business: false }));
    }
  };

  const loadPosts = async (commerceId) => {
    const idToUse = commerceId || businessId;
    if (!idToUse) return;
    setLoadingStates(prev => ({ ...prev, posts: true }));
    try {
      const commercePosts = await getPostsByCommerce(idToUse);
      const normalized = Array.isArray(commercePosts) ? commercePosts.map(normalizePostFromBackend) : [];
      setPosts(normalized);
    } catch (err) {
      setPosts([]);
    } finally {
      setLoadingStates(prev => ({ ...prev, posts: false }));
    }
  };

  const handleProfileImageUpload = async (file) => {
    if (!businessId) {
      setError("Primero debes crear el negocio antes de subir imágenes");
      return;
    }
    setLoadingStates(prev => ({ ...prev, profileImage: true }));
    setError("");
    try {
      const result = await uploadProfileImage(businessId, file);
      if (result.profileImage) {
        const newImageUrl = result.profileImage;
        setBusinessData(prev => ({ ...prev, profileImage: newImageUrl }));
        setDraft(prev => ({ ...prev, profileImage: newImageUrl }));
        setProfileImageFile(null);
        showSuccessMessage("✅ Imagen de perfil actualizada");
      } else {
        throw new Error("No se recibió la URL de la imagen actualizada");
      }
    } catch (err) {
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
      const result = await uploadCoverImage(businessId, file);
      if (result.coverImage) {
        setBusinessData(prev => ({ ...prev, coverImage: result.coverImage }));
        if (isEditing) {
          setDraft(prev => ({ ...prev, coverImage: result.coverImage }));
        }
        setCoverImageFile(null);
        showSuccessMessage("✅ Imagen de portada actualizada");
      } else {
        throw new Error("No se recibió la URL de la imagen actualizada");
      }
    } catch (err) {
      showErrorMessage(err.message || "Error al subir imagen de portada");
    } finally {
      setLoadingStates(prev => ({ ...prev, coverImage: false }));
    }
  };

  const showSuccessMessage = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const showErrorMessage = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 5000);
  };

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

  const handleSave = async () => {
    const trimmedName = (draft.name || "").trim();
    const trimmedDescription = (draft.description || "").trim();
    const trimmedEmail = (draft.email || "").trim();
    const trimmedPhone = (draft.phone || "").trim();
    
    let isValid = true;
    if (!validate("name", trimmedName, { required: true, maxLength: 100 })) isValid = false;
    if (!validate("description", trimmedDescription, { required: true, maxLength: 500 })) isValid = false;
    if (trimmedEmail && !validate("email", trimmedEmail, { email: true })) isValid = false;
    if (trimmedPhone && !validate("phone", trimmedPhone, { phone: true })) isValid = false;

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
      if (businessId) {
        await updateBusiness(businessId, dataToSend);
        savedBusinessId = businessId;
      } else {
        const result = await createBusiness({ ...dataToSend, id_user: user.id_user });
        savedBusinessId = result.id_business;
        setBusinessId(savedBusinessId);
      }

      if (profileImageFile) await handleProfileImageUpload(profileImageFile);
      if (coverImageFile) await handleCoverImageUpload(coverImageFile);

      await loadBusinessData();
      setSchedule(draftSchedule);
      setIsEditing(false);
      showSuccessMessage("✅ Datos guardados correctamente");
    } catch (err) {
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

  const handleInputChange = useCallback((field) => (e) => {
    const value = e.target.value;
    setDraft(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePhoneChange = useCallback((e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    const formatted = raw.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
    setDraft(prev => ({ ...prev, phone: formatted }));
  }, []);

  const sortedEvents = useMemo(() => posts.filter((p) => p.type === "event"), [posts]);
  const sortedPosts = useMemo(() => [...posts].filter((p) => p.type !== "event").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [posts]);

  const handleSubmitPost = async (data) => {
    if (!businessId) {
      showErrorMessage("Necesitas crear el negocio primero");
      return;
    }
    const businessIdNumber = typeof businessId === 'string' ? parseInt(businessId, 10) : businessId;
    if (isNaN(businessIdNumber)) {
      showErrorMessage("ID de comercio inválido");
      return;
    }
    setLoadingStates(prev => ({ ...prev, creatingPost: true }));
    setError("");
    try {
      if (editingPost) {
        await updatePostText(editingPost.id, data.text, businessIdNumber);
        if (data.imagesToDelete && data.imagesToDelete.length > 0) {
          await deleteImagesFromPost(editingPost.id, data.imagesToDelete);
        }
        if (data.imageFiles && data.imageFiles.length > 0) {
          await addImagesToPost(editingPost.id, data.imageFiles);
        }
        await loadPosts(businessIdNumber);
        showSuccessMessage("✅ Publicación actualizada correctamente");
        setShowModal(false);
      } else {
        if (!data.imageFiles || data.imageFiles.length === 0) {
          showErrorMessage("Debes subir al menos una imagen");
          return;
        }
        await createPost(data.text, businessIdNumber, data.imageFiles);
        await loadPosts(businessIdNumber);
        showSuccessMessage("✅ Publicación creada correctamente");
        setShowModal(false);
      }
    } catch (error) {
      showErrorMessage(error.message || "Error al guardar la publicación");
    } finally {
      setLoadingStates(prev => ({ ...prev, creatingPost: false }));
      setEditingPost(null);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta publicación? Esta acción no se puede deshacer.')) return;
    setLoadingStates(prev => ({ ...prev, deletingPost: true }));
    setError("");
    try {
      await deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      showSuccessMessage("✅ Publicación eliminada correctamente");
    } catch (error) {
      showErrorMessage(error.message || "Error al eliminar la publicación");
    } finally {
      setLoadingStates(prev => ({ ...prev, deletingPost: false }));
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setModalType(post.type);
    setShowModal(true);
  };

  if (loadingStates.business) {
    return (
      <div className={styles.headerContainer}>
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <Loader size={48} className={styles.spinnerIcon} />
          <p style={{ marginTop: "1rem", color: "#666" }}>Cargando información del negocio...</p>
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

        <BusinessInfo 
          isOwner={isOwner}
          isEditing={isEditing}
          businessData={businessData}
          draft={draft}
          schedule={schedule}
          draftSchedule={draftSchedule}
          status={status}
          errors={errors}
          loadingStates={loadingStates}
          profileImageFile={profileImageFile}
          coverImageFile={coverImageFile}
          onEdit={handleEdit}
          onSave={handleSave}
          onCancel={handleCancel}
          onInputChange={handleInputChange}
          onPhoneChange={handlePhoneChange}
          onValidate={validate}
          setDraft={setDraft}
          setDraftSchedule={setDraftSchedule}
          setProfileImageFile={setProfileImageFile}
          setCoverImageFile={setCoverImageFile}
        />
      </div>

      <BusinessActions 
        isOwner={isOwner}
        isEditing={isEditing}
        businessId={businessId}
        businessData={businessData}
        loadingStates={loadingStates}
        onCreatePost={(type) => {
          setModalType(type);
          setShowModal(true);
        }}
      />

      <PostsTabs 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        postsCount={sortedPosts.length}
        eventsCount={sortedEvents.length}
      />

      <PostsList 
        activeTab={activeTab}
        posts={sortedPosts}
        events={sortedEvents}
        isOwner={isOwner}
        loadingStates={loadingStates}
        onEditPost={handleEditPost}
        onDeletePost={handleDeletePost}
      />

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
