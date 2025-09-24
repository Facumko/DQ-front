import React from "react"; 
import styles from "./Badge.module.css"; // Importa los estilos CSS específicos del badge

// Componente funcional Badge
// Recibe "type" (tipo de badge) y "text" (lo que se muestra)
const Badge = ({ type, text }) => {
  let bgColor = ""; // Variable para definir el color de fondo según el tipo

  // Determina el color de fondo según el tipo de badge
  switch(type.toLowerCase()) {
    case "Destacado":
      bgColor = "var(--badge-green, #21B457)"; // Verde para destacados
      break;
    case "Oferta":
      bgColor = "var(--badge-red, #DC2626)"; // Rojo para ofertas
      break;
    default:
      bgColor = "#eee"; // Gris claro si no coincide con los anteriores
  }

  // Renderiza un span con el texto y color de fondo dinámico
  return (
    <span className={styles.badge} style={{ backgroundColor: bgColor }}>
      {text}
    </span>
  );
};

export default Badge; // Exporta el componente para usarlo en otros lados
