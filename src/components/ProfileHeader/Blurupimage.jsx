/**
 * BlurUpImage.jsx
 * Imagen con efecto blur-up al cargar + skeleton shimmer.
 * 
 * Uso:
 *   <BlurUpImage src={url} alt="..." className={styles.mainImg} />
 */
import React, { useState, useRef, useEffect } from 'react';
import styles from './BlurUpImage.module.css';

const BlurUpImage = ({
  src,
  alt = '',
  className = '',
  style = {},
  objectFit = 'cover',
  aspectRatio,
}) => {
  const [loaded,  setLoaded]  = useState(false);
  const [errored, setErrored] = useState(false);
  const imgRef = useRef(null);

  // Si la imagen ya estaba en caché del browser, onLoad no se dispara → chequear .complete
  useEffect(() => {
    setLoaded(false);
    setErrored(false);
    if (!src) return;
    const img = imgRef.current;
    if (img?.complete && img?.naturalWidth > 0) setLoaded(true);
  }, [src]);

  if (!src || errored) {
    return (
      <div
        className={`${styles.skeleton} ${styles.skeletonShimmer} ${className}`}
        style={{ aspectRatio, ...style }}
      />
    );
  }

  return (
    <div
      className={`${styles.wrapper} ${className}`}
      style={{ aspectRatio, ...style }}
    >
      {/* Skeleton visible hasta que cargue */}
      {!loaded && (
        <div className={`${styles.skeleton} ${styles.skeletonShimmer} ${styles.skeletonAbsolute}`} />
      )}

      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`${styles.img} ${loaded ? styles.imgLoaded : styles.imgLoading}`}
        style={{ objectFit }}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};

export default BlurUpImage;