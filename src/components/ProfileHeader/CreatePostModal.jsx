import React, { useState, useEffect } from "react";
import styles from "./CreatePostModal.module.css";
import { X, Calendar, Image, MapPin, Clock, User, Trash2, ChevronLeft, ChevronRight } from "lucide-react"; // ✅ Añadidos ChevronLeft y ChevronRight

const MAX_IMAGES = 10;

const CreatePostModal = ({ isOpen, onClose, onSubmit, type = "post", initialData = null }) => {
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]); // ✅ NUEVO: Guardar archivos reales
  const [activeIndex, setActiveIndex] = useState(0);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [taggedBusiness, setTaggedBusiness] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setText(initialData.text || "");
        setImages(initialData.images || []);
        setImageFiles([]); // ✅ Para edición, no tenemos los archivos originales
        setDate(initialData.date || "");
        setTime(initialData.time || "");
        setLocation(initialData.location || "");
        setTaggedBusiness(initialData.taggedBusiness || "");
        setActiveIndex(0);
      } else {
        setText("");
        setImages([]);
        setImageFiles([]);
        setDate("");
        setTime("");
        setLocation("");
        setTaggedBusiness("");
        setActiveIndex(0);
      }
    }
  }, [isOpen, initialData]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const available = MAX_IMAGES - images.length;
    
    if (files.length > available) {
      alert(`Solo puedes agregar ${available} imágenes más (máximo ${MAX_IMAGES}).`);
      return;
    }
    
    // ✅ CORREGIDO: Crear URLs temporales solo para preview
    const newUrls = files.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...newUrls]);
    setImageFiles((prev) => [...prev, ...files]); // ✅ Guardar archivos reales
    setActiveIndex(images.length);
  };

  const handleRemoveImage = (index) => {
    // ✅ CORREGIDO: Liberar memoria de la URL temporal
    if (images[index] && images[index].startsWith('blob:')) {
      URL.revokeObjectURL(images[index]);
    }
    
    const newImages = images.filter((_, i) => i !== index);
    const newFiles = imageFiles.filter((_, i) => i !== index);
    
    setImages(newImages);
    setImageFiles(newFiles);
    
    if (activeIndex >= newImages.length && newImages.length > 0) {
      setActiveIndex(newImages.length - 1);
    } else if (newImages.length === 0) {
      setActiveIndex(0);
    }
  };

  const nextImage = () => setActiveIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setActiveIndex((prev) => (prev - 1 + images.length) % images.length);

const handleSubmit = (e) => {
  e.preventDefault();
  if (images.length === 0) return alert("Debes subir al menos una imagen.");
  
  // ✅ CORREGIDO: Siempre enviar las URLs para mostrar, no los archivos
  const payload = {
    text,
    images: images, // Enviar las URLs que ya tenemos para display
    type,
    ...(type === "event" && { date, time, location, taggedBusiness }),
  };
  
  onSubmit(payload);
  onClose();
};

  // ✅ CORREGIDO: Limpiar URLs temporales cuando se cierra el modal
  useEffect(() => {
    return () => {
      images.forEach(img => {
        if (img && img.startsWith('blob:')) {
          URL.revokeObjectURL(img);
        }
      });
    };
  }, []);

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

          {/* Miniaturas */}
          {images.length > 0 && (
            <div className={styles.thumbs}>
              {images.map((img, i) => (
                <div key={i} className={`${styles.thumb} ${i === activeIndex ? styles.active : ""}`}>
                  <img src={img} alt={`thumb-${i}`} onClick={() => setActiveIndex(i)} />
                  <button type="button" className={styles.removeThumb} onClick={() => handleRemoveImage(i)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Agregar más */}
          <label className={styles.fileLabel}>
            <Image size={18} />
            {images.length === 0 ? "Subir imagen" : `Agregar más (${MAX_IMAGES - images.length} disponibles)`}
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handleImageChange} 
              className={styles.fileInput} 
              disabled={images.length >= MAX_IMAGES} 
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
                <input type="text" placeholder="Lugar del evento" value={location} onChange={(e) => setLocation(e.target.value)} required />
              </label>
              <label>
                <User size={16} />
                <input type="text" placeholder="Etiquetar otro comercio (opcional)" value={taggedBusiness} onChange={(e) => setTaggedBusiness(e.target.value)} />
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