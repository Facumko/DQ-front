import React, { useState } from "react";
import styles from "./PostGallery.module.css";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PostGallery = ({ images }) => {
  const [index, setIndex] = useState(0);
  
  if (!images || images.length === 0) return null;

  const next = () => setIndex((i) => (i + 1) % images.length);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);

  return (
    <div className={styles.gallery}>
      <div className={styles.mainWrapper}>
        {/* Flecha izquierda */}
        {images.length > 1 && (
          <button className={styles.navBtn} onClick={prev}>
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Imagen visible */}
        <img src={images[index]} alt={`img-${index}`} className={styles.mainImg} />

        {/* Flecha derecha */}
        {images.length > 1 && (
          <button className={styles.navBtn} onClick={next}>
            <ChevronRight size={24} />
          </button>
        )}

        {/* Contador */}
        {images.length > 1 && (
          <div className={styles.counter}>{index + 1} / {images.length}</div>
        )}
      </div>
    </div>
  );
};

export default PostGallery;