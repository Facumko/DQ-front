import React from "react";
import PropTypes from "prop-types"; // Para validar tipos de props
import styles from "./PromoCard.module.css"; // Importa estilos CSS

// Componente funcional PromoCard
// Muestra una promoción con imagen, título, subtítulo y texto promocional
const PromoCard = ({ title, subtitle, promo, imageUrl }) => {
  return (
    <div className={styles.card} tabIndex={0} role="button">
      {/* Imagen de la promo, carga diferida para performance */}
      <img src={imageUrl} alt={title} className={styles.image} loading="lazy" />

      {/* Contenedor de textos */}
      <div className={styles.content}>
        <span className={styles.title}>{title}</span>       {/* Título principal */}
        <span className={styles.subtitle}>{subtitle}</span> {/* Subtítulo descriptivo */}
        <span className={styles.promo}>{promo}</span>       {/* Texto de promoción */}
      </div>
    </div>
  );
};

// Validación de tipos de props
PromoCard.propTypes = {
  title: PropTypes.string.isRequired,    // Título obligatorio
  subtitle: PropTypes.string,            // Subtítulo opcional
  promo: PropTypes.string,               // Promo opcional
  imageUrl: PropTypes.string.isRequired, // URL de la imagen obligatoria
};

export default PromoCard; // Exporta el componente
