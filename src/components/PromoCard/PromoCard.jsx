import React from "react";
import PropTypes from "prop-types";
import styles from "./PromoCard.module.css";

const PromoCard = ({ title, subtitle, promo, imageUrl }) => {
  return (
    <div className={styles.card} tabIndex={0} role="button">
      <img src={imageUrl} alt={title} className={styles.image} loading="lazy" />
      <div className={styles.content}>
        <span className={styles.title}>{title}</span>
        <span className={styles.subtitle}>{subtitle}</span>
        <span className={styles.promo}>{promo}</span>
      </div>
    </div>
  );
};

PromoCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  promo: PropTypes.string,
  imageUrl: PropTypes.string.isRequired,
};

export default PromoCard;
