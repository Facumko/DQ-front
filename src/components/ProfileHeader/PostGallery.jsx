import React, { useState, useEffect } from "react";
import styles from "./PostGallery.module.css";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PostGallery = ({ images }) => {
  const [index, setIndex] = useState(0);
  
  // Reset index cuando cambian las imágenes
  useEffect(() => {
    setIndex(0);
  }, [images]);

  if (!images || images.length === 0) return null;

  const next = () => setIndex((i) => (i + 1) % images.length);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);

  // Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length]);

  // Navegación por puntos/thumbnails (opcional)
  const goToImage = (newIndex) => setIndex(newIndex);

  return (
    <div className={styles.gallery}>
      <div className={styles.mainWrapper}>
        {/* Flecha izquierda */}
        {images.length > 1 && (
          <button 
            className={`${styles.navBtn} ${styles.navLeft}`} 
            onClick={prev}
            aria-label="Imagen anterior"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Imagen principal con área clickeable para navegación */}
        <div className={styles.imageContainer}>
          <img 
            src={images[index]} 
            alt={`Contenido de la publicación ${index + 1} de ${images.length}`} 
            className={styles.mainImg} 
            loading="lazy"
          />
          
          {/* Áreas clickeables para navegación en pantallas táctiles */}
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

        {/* Flecha derecha */}
        {images.length > 1 && (
          <button 
            className={`${styles.navBtn} ${styles.navRight}`} 
            onClick={next}
            aria-label="Siguiente imagen"
          >
            <ChevronRight size={24} />
          </button>
        )}

        {/* Contador */}
        {images.length > 1 && (
          <div className={styles.counter}>
            {index + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Miniaturas (opcional - para muchas imágenes) */}
      {images.length > 1 && images.length <= 10 && (
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

      {/* Indicadores de puntos para muchas imágenes */}
      {images.length > 10 && (
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