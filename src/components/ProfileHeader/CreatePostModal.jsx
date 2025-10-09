// src/components/CreatePostModal.jsx
import React, { useState } from "react";
import styles from "./CreatePostModal.module.css";
import { X, Calendar, Image, MapPin, Clock, User } from "lucide-react";


const CreatePostModal = ({ isOpen, onClose, onSubmit, type = "post" }) => {
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [taggedBusiness, setTaggedBusiness] = useState("");


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
            onChange={(e) => setText(e.target.value)}
            className={styles.textarea}
          />


          <label className={styles.fileLabel}>
            <Image size={18} />
            Subir imagen
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

