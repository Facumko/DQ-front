import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SearchResultCard.module.css";
import { Clock, Star } from "lucide-react";

const SearchResultCard = ({ commerce }) => {
  const navigate  = useNavigate();
  const [isFav, setIsFav] = useState(false);

  const getStatus = () => {
    if (!commerce.schedules || commerce.schedules.length === 0)
      return { label: "Horario no disponible" };
    return { label: "Ver horarios" };
  };

  const status   = getStatus();
  const initial  = commerce.name?.charAt(0).toUpperCase() || "?";

  const handleClick = () => navigate(`/negocios/${commerce.idCommerce}`);

  const handleFav = (e) => {
    e.stopPropagation();
    setIsFav(prev => !prev);
    // TODO: conectar al endpoint de favoritos
  };

  return (
    <div className={styles.card} onClick={handleClick}>

      {/* Portada */}
      <div className={styles.coverBackground}>
        {commerce.coverImage?.url
          ? <img src={commerce.coverImage.url} alt="" />
          : <div className={styles.coverPlaceholder} />
        }
      </div>

      {/* Estrella favorito */}
      <button
        className={`${styles.favBtn} ${isFav ? styles.favBtnActive : ""}`}
        onClick={handleFav}
        title={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
      >
        <Star size={16} fill={isFav ? "currentColor" : "none"} strokeWidth={2} />
      </button>

      {/* Perfil circular */}
      <div className={styles.profileCircle}>
        {commerce.profileImage?.url
          ? <img src={commerce.profileImage.url} alt={commerce.name} />
          : <div className={styles.profilePlaceholder}>{initial}</div>
        }
      </div>

      {/* Info */}
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