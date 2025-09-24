import React, { useState } from "react";
import styles from "./Publications.module.css";
import PromoCard from "../PromoCard/PromoCard";

const Publications = ({ publicaciones = [] }) => {
  const [activeFilter, setActiveFilter] = useState("2 Publicaciones");

  const defaultPublicaciones = [
    { title: "Noche de Jazz en Vivo", type: "Evento", tag: "Nuevo", datetime: "Viernes 8 PM", timeAgo: "Hace 1 hora" },
    { title: "Fin de Semana Exitoso", type: "Promoción", tag: "Oferta", datetime: "Todo el fin de semana", timeAgo: "Hace 3 horas" }
  ];

  const pubs = publicaciones.length > 0 ? publicaciones : defaultPublicaciones;

  const filters = ["Mis Favoritos", "2 Publicaciones", "2 Eventos"];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Publicaciones y Eventos</h2>
        <div className={styles.filters}>
          {filters.map(f => (
            <button
              key={f}
              className={`${styles.filterButton} ${activeFilter === f ? styles.active : ""}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.cardsContainer}>
        {pubs.map((pub, i) => (
          <PromoCard key={i} {...pub} />
        ))}
      </div>
    </div>
  );
};

export default Publications;
