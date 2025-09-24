import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "./Carousel.module.css";
import { useCarouselAutoplay } from "./useCarouselAutoplay";
import { useParallaxEffect } from "./useParallaxEffect";
import PropTypes from "prop-types";

const Carousel = ({ slides = [] }) => {  // <--- valor por defecto
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef();
  const touchStartX = useRef(null);

  // Hooks personalizados
  useCarouselAutoplay(isPaused, slides.length, setCurrent);
  useParallaxEffect(carouselRef);

  // Prev/Next
  const prevSlide = useCallback(() => setCurrent(prev => (slides.length ? (prev - 1 + slides.length) % slides.length : 0)), [slides.length]);
  const nextSlide = useCallback(() => setCurrent(prev => (slides.length ? (prev + 1) % slides.length : 0)), [slides.length]);
  const goToSlide = useCallback((index) => setCurrent(index), []);

  // Teclado
  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") prevSlide();
    if (e.key === "ArrowRight") nextSlide();
  };

  // Swipe móvil
  const handleTouchStart = (e) => touchStartX.current = e.touches[0].clientX;
  const handleTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 30) nextSlide();
    if (diff < -30) prevSlide();
    touchStartX.current = null;
  };

  // Pausa autoplay fuera de viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsPaused(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (carouselRef.current) observer.observe(carouselRef.current);
    return () => observer.disconnect();
  }, []);

  if (!slides || slides.length === 0) return null; // <--- protección extra

  return (
    <div
      className={styles.carousel}
      ref={carouselRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="group"
      aria-roledescription="carrusel"
      aria-live="polite"
      tabIndex={0}
    >
      <div className={styles.slideContainer} style={{ transform: `translateX(-${current * 100}%)` }}>
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`${styles.slide} ${index === current ? styles.active : ""}`}
            style={{ backgroundImage: `url(${slide.imageUrl || ""})` }}
            id={`slide-${slide.id}`}
          >
            <div className={styles.overlay}>
              <div className={styles.info}>
                {slide.badge && <span className={`${styles.badge} ${styles[slide.badge.type]}`}>{slide.badge.text}</span>}
                <h2>{slide.title}</h2>
                <p>{slide.subtitle}</p>
                {slide.ctaText && <button className={styles.cta}>{slide.ctaText}</button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className={`${styles.nav} ${styles.prev}`} onClick={prevSlide} aria-label="Anterior slide">‹</button>
      <button className={`${styles.nav} ${styles.next}`} onClick={nextSlide} aria-label="Siguiente slide">›</button>

      <div className={styles.dots} role="tablist" aria-label="Navegación de slides">
        {slides.map((slide, index) => (
          <span
            key={index}
            className={`${styles.dot} ${index === current ? styles.activeDot : ""}`}
            onClick={() => goToSlide(index)}
            role="tab"
            aria-controls={`slide-${slide.id}`}
            aria-label={`Ir al slide ${index + 1}`}
            aria-selected={index === current}
          />
        ))}
      </div>

      <div className={styles.autoplayProgress}>
        <div className={styles.progressBar} style={{ transform: `scaleX(${isPaused ? 0 : 1})` }} />
      </div>
    </div>
  );
};

Carousel.propTypes = {
  slides: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    ctaText: PropTypes.string,
    badge: PropTypes.shape({ type: PropTypes.string, text: PropTypes.string }),
    imageUrl: PropTypes.string.isRequired,
  }))
};

export default Carousel;
