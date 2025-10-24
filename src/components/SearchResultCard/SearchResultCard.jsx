import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SearchResultCard.module.css";
import { MapPin, Clock } from "lucide-react";

const SearchResultCard = ({ commerce }) => {
  const navigate = useNavigate();

  // Status de horario (simplificado)
  const getStatus = () => {
    if (!commerce.schedules || commerce.schedules.length === 0) {
      return { isOpen: false, label: "Horario no disponible" };
    }
    // Por ahora retornamos neutral, después se puede mejorar
    return { isOpen: false, label: "Ver horarios" };
  };

  const status = getStatus();

  // Placeholder de imagen
  const getInitial = () => {
    return commerce.name?.charAt(0).toUpperCase() || "?";
  };

  const handleClick = () => {
    navigate(`/negocios/${commerce.idCommerce}`);
  };

  return (
    <div className={styles.card} onClick={handleClick}>
      {/* Portada de fondo */}
      <div className={styles.coverBackground}>
        {commerce.coverImage?.url ? (
          <img src={commerce.coverImage.url} alt="" />
        ) : (
          <div className={styles.coverPlaceholder} />
        )}
      </div>

      {/* Perfil circular */}
      <div className={styles.profileCircle}>
        {commerce.profileImage?.url ? (
          <img src={commerce.profileImage.url} alt={commerce.name} />
        ) : (
          <div className={styles.profilePlaceholder}>
            {getInitial()}
          </div>
        )}
      </div>

      {/* Info del comercio */}
      <div className={styles.info}>
        <h3 className={styles.name}>{commerce.name}</h3>
        
        {status.label && (
          <div className={styles.status}>
            <Clock size={14} />
            <span>{status.label}</span>
          </div>
        )}

        {commerce.description && (
          <p className={styles.description}>
            {commerce.description.length > 100 
              ? `${commerce.description.substring(0, 100)}...` 
              : commerce.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default SearchResultCard;