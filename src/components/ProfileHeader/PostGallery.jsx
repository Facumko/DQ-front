import React, { useState, useEffect } from "react";
import styles from "./PostGallery.module.css";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PostGallery = ({ images, showThumbnails = false }) => { // ✅ NUEVO parámetro
  const [index, setIndex] = useState(0);
  
  useEffect(() => {
    setIndex(0);
  }, [images]);

  if (!images || images.length === 0) return null;

  const next = () => setIndex((i) => (i + 1) % images.length);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length]);

  const goToImage = (newIndex) => setIndex(newIndex);

  return (
    <div className={styles.gallery}>
      <div className={styles.mainWrapper}>
        {images.length > 1 && (
          <button 
            className={`${styles.navBtn} ${styles.navLeft}`} 
            onClick={prev}
            aria-label="Imagen anterior"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <div className={styles.imageContainer}>
          <img 
            src={images[index]} 
            alt={`Contenido de la publicación ${index + 1} de ${images.length}`} 
            className={styles.mainImg} 
            loading="lazy"
          />
          
          {images.length > 1 && (
            <>
              <div 
                className={styles.leftClickArea} 
                onClick={prev}
                aria-hidden="true"
              />
              <div 
                className={styles.rightClickArea} 
                onClick={next}
                aria-hidden="true"
              />
            </>
          )}
        </div>

        {images.length > 1 && (
          <button 
            className={`${styles.navBtn} ${styles.navRight}`} 
            onClick={next}
            aria-label="Siguiente imagen"
          >
            <ChevronRight size={24} />
          </button>
        )}

        {images.length > 1 && (
          <div className={styles.counter}>
            {index + 1} / {images.length}
          </div>
        )}
      </div>

      {/* ✅ CORREGIDO: Solo mostrar miniaturas si showThumbnails es true */}
      {showThumbnails && images.length > 1 && images.length <= 10 && (
        <div className={styles.thumbnails}>
          {images.map((img, i) => (
            <button
              key={i}
              className={`${styles.thumbnail} ${i === index ? styles.thumbnailActive : ''}`}
              onClick={() => goToImage(i)}
              aria-label={`Ver imagen ${i + 1}`}
            >
              <img src={img} alt="" className={styles.thumbnailImg} />
            </button>
          ))}
        </div>
      )}

      {/* ✅ CORREGIDO: Solo mostrar dots si showThumbnails es true */}
      {showThumbnails && images.length > 10 && (
        <div className={styles.dots}>
          {images.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === index ? styles.dotActive : ''}`}
              onClick={() => goToImage(i)}
              aria-label={`Ir a imagen ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PostGallery;