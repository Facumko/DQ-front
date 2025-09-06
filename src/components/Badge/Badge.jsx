import React from "react";
import styles from "./Badge.module.css";

const Badge = ({ type, text }) => {
  let bgColor = "";

  switch(type.toLowerCase()) {
    case "Destacado":
      bgColor = "var(--badge-green, #21B457)";
      break;
    case "Oferta":
      bgColor = "var(--badge-red, #DC2626)";
      break;
    default:
      bgColor = "#eee";
  }

  return (
    <span className={styles.badge} style={{ backgroundColor: bgColor }}>
      {text}
    </span>
  );
};

export default Badge;
