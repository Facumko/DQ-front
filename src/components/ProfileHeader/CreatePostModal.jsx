import React, { useState, useEffect } from "react";
import styles from "./CreatePostModal.module.css";
import { X, Calendar, Image, MapPin, Clock, User, Trash2 } from "lucide-react";

const MAX_IMAGES = 10;

const CreatePostModal = ({ isOpen, onClose, onSubmit, type = "post", initialData = null }) => {
  const [text, setText] = useState("");
  const [previewUrls, setPreviewUrls] = useState([]); // ✅ URLs para preview
  const [imageFiles, setImageFiles] = useState([]); // ✅ Archivos reales para enviar
  const [activeIndex, setActiveIndex] = useState(0);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [taggedBusiness, setTaggedBusiness] = useState("");

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
      setDate("");
      setTime("");
      setLocation("");
      setTaggedBusiness("");
      setActiveIndex(0);
    }
  }, [isOpen]);

  // ✅ Cargar datos de edición (sin archivos porque ya están en Cloudinary)
  useEffect(() => {
    if (isOpen && initialData) {
      setText(initialData.text || "");
      setPreviewUrls(initialData.images || []); // URLs de Cloudinary
      setImageFiles([]); // En edición no tenemos archivos locales
      setDate(initialData.date || "");
      setTime(initialData.time || "");
      setLocation(initialData.location || "");
      setTaggedBusiness(initialData.taggedBusiness || "");
      setActiveIndex(0);
    }
  }, [isOpen, initialData]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const available = MAX_IMAGES - previewUrls.length;
    
    if (files.length > available) {
      alert(`Solo puedes agregar ${available} imágenes más (máximo ${MAX_IMAGES}).`);
      return;
    }
    
    // Crear URLs temporales para preview
    const newUrls = files.map(file => URL.createObjectURL(file));
    
    setPreviewUrls(prev => [...prev, ...newUrls]);
    setImageFiles(prev => [...prev, ...files]); // ✅ Guardar archivos reales
    setActiveIndex(previewUrls.length);
  };

  const handleRemoveImage = (index) => {
    // Liberar memoria si es blob temporal
    if (previewUrls[index]?.startsWith?.('blob:')) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    
    if (activeIndex >= previewUrls.length - 1 && previewUrls.length > 1) {
      setActiveIndex(previewUrls.length - 2);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (previewUrls.length === 0) {
      alert("Debes subir al menos una imagen.");
      return;
    }
    
    // ✅ CORREGIDO: Enviar archivos reales al padre
    const payload = {
      text,
      type,
      imageFiles: initialData ? [] : imageFiles, // Solo archivos en modo creación
      existingImages: initialData ? previewUrls : [], // URLs de Cloudinary en edición
      ...(type === "event" && { date, time, location, taggedBusiness }),
    };
    
    onSubmit(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={20} />
        </button>

        <h2>{initialData ? "Editar" : type === "event" ? "Crear Evento" : "Crear Publicación"}</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <textarea
            placeholder="Escribe algo..."
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 1000))}
            className={styles.textarea}
            maxLength={1000}
          />
          <div className={styles.charCount}>{text.length}/1000</div>

          {/* ✅ VISTA PREVIA PRINCIPAL - Una sola galería */}
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

          {/* ✅ MINIATURAS - Solo para navegación */}
          {previewUrls.length > 1 && (
            <div className={styles.thumbs}>
              {previewUrls.map((url, i) => (
                <div 
                  key={i} 
                  className={`${styles.thumb} ${i === activeIndex ? styles.active : ""}`}
                  onClick={() => setActiveIndex(i)}
                >
                  <img src={url} alt={`Miniatura ${i + 1}`} />
                  <button 
                    type="button" 
                    className={styles.removeThumb} 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(i);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Botón agregar más */}
          <label className={styles.fileLabel}>
            <Image size={18} />
            {previewUrls.length === 0 
              ? "Subir imagen" 
              : `Agregar más (${MAX_IMAGES - previewUrls.length} disponibles)`}
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handleImageChange} 
              className={styles.fileInput} 
              disabled={previewUrls.length >= MAX_IMAGES} 
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

          <button type="submit" className={styles.submitButton}>
            {initialData ? "Guardar cambios" : "Publicar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;