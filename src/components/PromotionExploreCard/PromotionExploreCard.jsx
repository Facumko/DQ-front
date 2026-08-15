import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Percent } from "lucide-react";
import { registerPromotionView, registerPromotionClick } from "../../Api/Api";
import styles from "./PromotionExploreCard.module.css";

// Misma lógica de link que normalizeFeaturedBox en Home.jsx: si la promo
// tiene un post o evento vinculado, va directo ahí; si no, al perfil del
// comercio. La repetimos acá en vez de importarla porque esa función vive
// dentro del componente Home y no está exportada aparte.
const resolvePromotionLink = (promo) => {
  const commerceId = promo.idCommerce;
  if (!commerceId) return "/";
  const rt = (promo.redirectType || "").toUpperCase();
  if (rt === "POST" && promo.redirectTargetId) return `/negocios/${commerceId}?tab=posts&item=${promo.redirectTargetId}`;
  if (rt === "EVENT" && promo.redirectTargetId) return `/negocios/${commerceId}?tab=events&item=${promo.redirectTargetId}`;
  return `/negocios/${commerceId}`;
};

const formatUntil = (endDate) => {
  if (!endDate) return null;
  const date = new Date(endDate);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
};

/**
 * Tarjeta pública de una promoción activa, para la caja "Promociones y
 * Descuentos". A diferencia de PromotionCard (que es la vista de gestión
 * del dueño, con activar/pausar/editar), esta es de solo lectura: registra
 * la vista al mostrarse y el click al tocarla, y lleva al post/evento
 * vinculado o al perfil del comercio.
 */
const PromotionExploreCard = ({ promotion }) => {
  const navigate = useNavigate();
  const viewed = useRef(false);

  useEffect(() => {
    if (viewed.current || !promotion?.idPromotion) return;
    viewed.current = true;
    registerPromotionView(promotion.idPromotion).catch(() => {});
  }, [promotion?.idPromotion]);

  const handleClick = () => {
    registerPromotionClick(promotion.idPromotion).catch(() => {});
    navigate(resolvePromotionLink(promotion));
  };

  const until = formatUntil(promotion.endDate);

  return (
    <div className={styles.card} onClick={handleClick} role="button" tabIndex={0}>
      <div className={styles.imageWrap}>
        {promotion.coverImageUrl ? (
          <img src={promotion.coverImageUrl} alt={promotion.title} className={styles.image} />
        ) : (
          <div className={styles.imagePlaceholder}>
            <Percent size={28} />
          </div>
        )}
        {until && <span className={styles.untilBadge}>Hasta el {until}</span>}
      </div>

      <div className={styles.body}>
        <div className={styles.commerceRow}>
          {promotion.commerceProfileImageUrl ? (
            <img src={promotion.commerceProfileImageUrl} alt="" className={styles.commerceLogo} />
          ) : (
            <div className={styles.commerceLogoPlaceholder} />
          )}
          <span className={styles.commerceName}>{promotion.commerceName || "Comercio"}</span>
        </div>

        <h3 className={styles.title}>{promotion.title}</h3>
        {promotion.description && <p className={styles.description}>{promotion.description}</p>}

        {promotion.tags?.length > 0 && (
          <div className={styles.tags}>
            {promotion.tags.slice(0, 3).map((tag, i) => {
              const tagName = tag.nameTag || tag.name || tag;
              return (
                <span key={i} className={styles.tagChip}>
                  <Tag size={10} /> {tagName}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionExploreCard;