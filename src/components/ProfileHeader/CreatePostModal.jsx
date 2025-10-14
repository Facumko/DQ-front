// src/components/CreatePostModal.jsx
import React, { useState, useEffect } from "react";
import styles from "./CreatePostModal.module.css";
import { X, Calendar, Image, MapPin, Clock, User } from "lucide-react";


const CreatePostModal = ({ isOpen, onClose, onSubmit, type = "post", initialData = null }) => {
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [taggedBusiness, setTaggedBusiness] = useState("");


  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setText(initialData.text || "");
        setImages(initialData.images || []);
        setDate(initialData.date || "");
        setTime(initialData.time || "");
        setLocation(initialData.location || "");
        setTaggedBusiness(initialData.taggedBusiness || "");
      } else {
        setText("");
        setImages([]);
        setDate("");
        setTime("");
        setLocation("");
        setTaggedBusiness("");
      }
    }
  }, [isOpen, initialData]);


  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImages(files);
    }
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    if (images.length === 0) return alert("Debes subir al menos una imagen.");
    const payload = {
      text,
      images,
      type,
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


        <h2>{type === "event" ? "Crear Evento" : "Crear Publicación"}</h2>


        <form onSubmit={handleSubmit} className={styles.form}>
          <textarea
            placeholder="Escribe algo..."
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 1000))}
            className={styles.textarea}
            maxLength={1000}
          />
          <div className={styles.charCount}>{text.length}/1000</div>


          <label className={styles.fileLabel}>
            <Image size={18} />
            {images.length > 0 ? images.map((f) => f.name).join(", ") : "Subir imagen"}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className={styles.fileInput}
            />
          </label>


          {type === "event" && (
            <>
              <div className={styles.row}>
                <label>
                  <Calendar size={16} />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </label>
                <label>
                  <Clock size={16} />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
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
            Publicar
          </button>
        </form>
      </div>
    </div>
  );
};


export default CreatePostModal;

