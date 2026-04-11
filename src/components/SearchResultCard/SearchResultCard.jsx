import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../pages/UserContext";
import styles from "./SearchResultCard.module.css";
import { Clock, Star } from "lucide-react";

const SearchResultCard = ({ commerce }) => {
  const navigate = useNavigate();
  const { user, favoriteCommerceIds, toggleFavoriteCommerce } = useContext(UserContext);

  const id    = commerce.idCommerce;
  const isFav = favoriteCommerceIds?.has(id) ?? false;

  const getStatus = () => {
    if (!commerce.schedules?.length) return { label: "Horario no disponible" };
    return { label: "Ver horarios" };
  };

  const status  = getStatus();
  const initial = commerce.name?.charAt(0).toUpperCase() || "?";

  // Categoría a mostrar (filtrar valores internos no útiles)
  const HIDDEN = ["private", "PUBLIC", "PRIVATE", "public"];
  const categoryName = commerce.categories?.find(
    (c) => c.name && !HIDDEN.includes(c.name)
  )?.name || null;

  const handleClick = () => navigate(`/negocios/${id}`);

  const handleFav = (e) => {
    e.stopPropagation();
    if (!user) { navigate("/login"); return; }
    toggleFavoriteCommerce(commerce);
  };

  return (
    <div className={styles.card} onClick={handleClick}>

      <div className={styles.coverBackground}>
        {commerce.coverImage?.url
          ? <img src={commerce.coverImage.url} alt="" />
          : <div className={styles.coverPlaceholder} />
        }
      </div>

      <button
        className={`${styles.favBtn} ${isFav ? styles.favBtnActive : ""}`}
        onClick={handleFav}
        title={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
      >
        <Star size={16} fill={isFav ? "currentColor" : "none"} strokeWidth={2} />
      </button>

      <div className={styles.profileCircle}>
        {commerce.profileImage?.url
          ? <img src={commerce.profileImage.url} alt={commerce.name} />
          : <div className={styles.profilePlaceholder}>{initial}</div>
        }
      </div>

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