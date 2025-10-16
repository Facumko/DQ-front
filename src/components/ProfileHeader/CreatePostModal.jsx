import React, { useState, useEffect } from "react";
import styles from "./CreatePostModal.module.css";
import { X, Calendar, Image, MapPin, Clock, User, Trash2, AlertCircle } from "lucide-react";

const MAX_IMAGES = 10;

const CreatePostModal = ({ isOpen, onClose, onSubmit, type = "post", initialData = null }) => {
  const [text, setText] = useState("");
  const [previewUrls, setPreviewUrls] = useState([]); // URLs para preview
  const [imageFiles, setImageFiles] = useState([]); // Archivos nuevos
  const [existingImages, setExistingImages] = useState([]); // Imágenes del servidor {id, url}
  const [imagesToDelete, setImagesToDelete] = useState([]); // IDs a eliminar
  const [activeIndex, setActiveIndex] = useState(0);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [taggedBusiness, setTaggedBusiness] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ✅ Resetear estado al abrir/cerrar
  useEffect(() => {
    if (!isOpen) {
      // Limpiar URLs temporales al cerrar
      previewUrls.forEach(url => {
        if (url?.startsWith?.('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      
      setText("");
      setPreviewUrls([]);
      setImageFiles([]);
      setExistingImages([]);
      setImagesToDelete([]);
      setDate("");
      setTime("");
      setLocation("");
      setTaggedBusiness("");
      setActiveIndex(0);
      setHasUnsavedChanges(false);
    }
  }, [isOpen]);

  // ✅ Cargar datos de edición
  useEffect(() => {
    if (isOpen && initialData) {
      setText(initialData.text || "");
      setDate(initialData.date || "");
      setTime(initialData.time || "");
      setLocation(initialData.location || "");
      setTaggedBusiness(initialData.taggedBusiness || "");
      
      // Cargar imágenes existentes con sus IDs
      if (initialData.imageDetails && initialData.imageDetails.length > 0) {
        setExistingImages(initialData.imageDetails);
        setPreviewUrls(initialData.imageDetails.map(img => img.url));
      } else {
        setExistingImages([]);
        setPreviewUrls([]);
      }
      
      setImageFiles([]);
      setImagesToDelete([]);
      setActiveIndex(0);
      setHasUnsavedChanges(false);
    }
  }, [isOpen, initialData]);

  // ✅ Detectar cambios sin guardar
  useEffect(() => {
    if (isOpen) {
      const hasChanges = imageFiles.length > 0 || imagesToDelete.length > 0;
      setHasUnsavedChanges(hasChanges);
    }
  }, [imageFiles, imagesToDelete, isOpen]);

  // ✅ Calcular total de imágenes
  const totalImages = existingImages.length - imagesToDelete.length + imageFiles.length;
  const availableSlots = MAX_IMAGES - totalImages;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > availableSlots) {
      alert(`Solo puedes agregar ${availableSlots} imágenes más (máximo ${MAX_IMAGES} total, actualmente tienes ${totalImages}).`);
      return;
    }
    
    // Crear URLs temporales para preview
    const newUrls = files.map(file => URL.createObjectURL(file));
    
    setPreviewUrls(prev => [...prev, ...newUrls]);
    setImageFiles(prev => [...prev, ...files]);
    setActiveIndex(previewUrls.length);
  };

const handleRemoveImage = (index) => {
  console.log('🗑️ Intentando eliminar imagen en índice:', index);
  console.log('Estado actual:', {
    totalPreviewUrls: previewUrls.length,
    existingImagesCount: existingImages.length,
    imagesToDeleteCount: imagesToDelete.length,
    newImageFilesCount: imageFiles.length
  });
  
  // ✅ Calcular cuántas imágenes existentes hay (sin contar las marcadas para eliminar)
  const activeExistingCount = existingImages.filter(img => 
    !imagesToDelete.includes(img.id)
  ).length;
  
  // ✅ Determinar si es una imagen existente o nueva
  const isExistingImage = index < activeExistingCount;
  
  if (isExistingImage) {
    // ✅ Es una imagen EXISTENTE del servidor
    const existingImageIndex = index;
    const activeExistingImages = existingImages.filter(img => 
      !imagesToDelete.includes(img.id)
    );
    const imageToDelete = activeExistingImages[existingImageIndex];
    
    if (!imageToDelete) {
      console.error('❌ No se encontró la imagen a eliminar');
      return;
    }
    
    console.log('🗑️ Marcando imagen existente para eliminar:', imageToDelete);
    
    if (window.confirm(`¿Eliminar esta imagen? Se aplicará al guardar.`)) {
      // Marcar para eliminar
      setImagesToDelete(prev => [...prev, imageToDelete.id]);
      
      // Remover del preview
      setPreviewUrls(prev => prev.filter((_, i) => i !== index));
      
      // Ajustar índice activo si es necesario
      if (activeIndex >= previewUrls.length - 1 && previewUrls.length > 1) {
        setActiveIndex(previewUrls.length - 2);
      }
    }
  } else {
    // ✅ Es una imagen NUEVA (archivo local)
    const fileIndex = index - activeExistingCount;
    
    console.log('🗑️ Eliminando archivo nuevo en índice:', fileIndex);
    
    // Liberar memoria del blob
    if (previewUrls[index]?.startsWith?.('blob:')) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    
    // Remover del preview
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    
    // Remover del array de archivos
    setImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
    
    // Ajustar índice activo
    if (activeIndex >= previewUrls.length - 1 && previewUrls.length > 1) {
      setActiveIndex(previewUrls.length - 2);
    }
  }
};


const handleSubmit = (e) => {
  e.preventDefault();
  
  // ✅ Validación: en modo creación DEBE haber al menos 1 imagen nueva
  if (!initialData && imageFiles.length === 0) {
    alert("Debes subir al menos una imagen nueva.");
    return;
  }
  
  // ✅ Validación: en modo edición debe quedar al menos 1 imagen total
  if (initialData && totalImages === 0) {
    alert("Debe quedar al menos una imagen en la publicación.");
    return;
  }
  
  // ✅ Construir payload con validaciones
  const payload = {
    text: text.trim(),
    type,
    imageFiles: imageFiles,              // ✅ Archivos nuevos (Array de File)
    imagesToDelete: imagesToDelete,       // ✅ IDs a eliminar (Array de números)
    existingImages: existingImages.filter(img => !imagesToDelete.includes(img.id)), // ✅ Imágenes que quedan
    ...(type === "event" && { 
      date, 
      time, 
      location, 
      taggedBusiness 
    }),
  };

  console.log("📤 Modal enviando payload final:", {
    text: payload.text.slice(0, 50) + '...',
    newImageCount: payload.imageFiles.length,
    imagesToDeleteCount: payload.imagesToDelete.length,
    existingImageCount: payload.existingImages.length,
    totalImagesAfterChanges: payload.existingImages.length + payload.imageFiles.length,
    isEditing: !!initialData
  });

  // ✅ Validar que onSubmit exista
  if (typeof onSubmit !== 'function') {
    console.error("❌ ERROR: onSubmit no es una función");
    alert("Error interno: no se puede enviar el formulario");
    return;
  }

  onSubmit(payload);
  onClose();
};

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm("Tienes cambios sin guardar en las imágenes. ¿Deseas salir sin guardar?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={handleClose}>
          <X size={20} />
        </button>

        <h2>{initialData ? "Editar" : type === "event" ? "Crear Evento" : "Crear Publicación"}</h2>

        {/* Advertencia de cambios sin guardar */}
        {hasUnsavedChanges && (
          <div className={styles.warningBanner}>
            <AlertCircle size={16} />
            Tienes cambios sin guardar en las imágenes
          </div>
        )}

        <div onSubmit={handleSubmit} className={styles.form}>
          <textarea
            placeholder="Escribe algo..."
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 1000))}
            className={styles.textarea}
            maxLength={1000}
          />
          <div className={styles.charCount}>{text.length}/1000</div>

          {/* ✅ VISTA PREVIA PRINCIPAL */}
          {previewUrls.length > 0 && (
            <div className={styles.mainViewer}>
              <img 
                src={previewUrls[activeIndex]} 
                alt={`Vista previa ${activeIndex + 1}`} 
                className={styles.mainImg} 
              />
              
              {previewUrls.length > 1 && (
                <>
                  <button 
                    type="button"
                    className={styles.navBtn}
                    onClick={() => setActiveIndex((activeIndex - 1 + previewUrls.length) % previewUrls.length)}
                  >
                    ‹
                  </button>
                  <button 
                    type="button"
                    className={styles.navBtn}
                    style={{ right: '12px', left: 'auto' }}
                    onClick={() => setActiveIndex((activeIndex + 1) % previewUrls.length)}
                  >
                    ›
                  </button>
                  <div className={styles.counter}>
                    {activeIndex + 1} / {previewUrls.length}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ✅ MINIATURAS con indicador visual */}
          {previewUrls.length > 1 && (
            <div className={styles.thumbs}>
              {previewUrls.map((url, i) => {  
                const activeExistingCount = existingImages.filter(img => 
                  !imagesToDelete.includes(img.id)
                ).length;
                const isExisting = i < activeExistingCount;
                const isNew = !isExisting;
                return (
                  <div 
                    key={i} 
                    className={`${styles.thumb} ${i === activeIndex ? styles.active : ""} ${isNew ? styles.newImage : ""}`}
                    onClick={() => setActiveIndex(i)}
                    title={isNew ? "Imagen nueva" : "Imagen existente"}
                  >
                    <img src={url} alt={`Miniatura ${i + 1}`} />
                    <button 
                      type="button" 
                      className={styles.removeThumb} 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(i);
                      }}
                      title="Eliminar imagen"
                    >
                      −
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Contador de imágenes */}
          <div className={styles.imageCounter}>
            <span>Total: {totalImages} / {MAX_IMAGES} imágenes</span>
            {imagesToDelete.length > 0 && (
              <span className={styles.deleteCount}>
                {imagesToDelete.length} a eliminar
              </span>
            )}
            {imageFiles.length > 0 && (
              <span className={styles.newCount}>
                {imageFiles.length} nueva{imageFiles.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Botón agregar más */}
          <label className={`${styles.fileLabel} ${availableSlots === 0 ? styles.disabled : ""}`}>
            <Image size={18} />
            {previewUrls.length === 0 
              ? "Subir imagen" 
              : `Agregar más (${availableSlots} disponibles)`}
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handleImageChange} 
              className={styles.fileInput} 
              disabled={availableSlots === 0} 
            />
          </label>

          {/* Campos de evento */}
          {type === "event" && (
            <>
              <div className={styles.row}>
                <label>
                  <Calendar size={16} />
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </label>
                <label>
                  <Clock size={16} />
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                </label>
              </div>
              <label>
                <MapPin size={16} />
                <input 
                  type="text" 
                  placeholder="Lugar del evento" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  required 
                />
              </label>
              <label>
                <User size={16} />
                <input 
                  type="text" 
                  placeholder="Etiquetar otro comercio (opcional)" 
                  value={taggedBusiness} 
                  onChange={(e) => setTaggedBusiness(e.target.value)} 
                />
              </label>
            </>
          )}

          <button onClick={handleSubmit} className={styles.submitButton}>
            {initialData ? "Guardar cambios" : "Publicar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;