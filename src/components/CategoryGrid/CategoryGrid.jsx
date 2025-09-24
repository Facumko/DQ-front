import React from "react";
import styles from "./CategoryGrid.module.css"; // Importa estilos CSS
import { Calendar, Utensils, Tag, Store, Wrench, TrendingUp } from "lucide-react"; 
// Importa iconos desde lucide-react

// Array de categorías que se mostrarán en la cuadrícula
// Cada categoría tiene color, icono, texto principal y subtítulo
const categories = [
  { color: "blue", icon: <Calendar size={32} />, text: "¿Qué pasa esta semana?", subtitle: "Eventos destacados" },
  { color: "orange", icon: <Utensils size={32} />, text: "¿Dónde cenar esta noche?", subtitle: "Restaurantes y cafés" },
  { color: "green", icon: <Tag size={32} />, text: "Ofertas destacadas", subtitle: "Descuentos especiales" },
  { color: "purple", icon: <Store size={32} />, text: "¿Qué hay de nuevo cerca?", subtitle: "Nuevos negocios" },
  { color: "red", icon: <Wrench size={32} />, text: "Servicios urgentes", subtitle: "Técnicos y delivery" },
  { color: "pink", icon: <TrendingUp size={32} />, text: "Lo más popular", subtitle: "Tendencias actuales" },
];

const CategoryGrid = () => {
  return (
    <section className={styles.section}>
      {/* Título y subtítulo principal de la sección */}
      <h2 className={styles.title}>¿Qué estás buscando?</h2>
      <p className={styles.subtitle}>
        Explora nuestras categorías más populares y encuentra exactamente lo que necesitas
      </p>

      {/* Grid que mapea las categorías */}
      <div className={styles.grid}>
        {categories.map((cat, i) => (
          <div
            key={i}
            className={`${styles.card} ${styles[cat.color]}`} // Aplica estilo general + color de categoría
            role="button"  // Hace que sea accesible como botón
            tabIndex={0}   // Permite foco con teclado
          >
            <div className={styles.icon}>{cat.icon}</div> {/* Icono de la categoría */}
            <div className={styles.texts}>
              <h3>{cat.text}</h3>        {/* Texto principal */}
              <span>{cat.subtitle}</span> {/* Subtítulo */}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid; // Exporta el componente
