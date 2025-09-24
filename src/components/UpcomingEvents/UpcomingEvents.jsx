import React from "react";
import styles from "./UpcomingEvents.module.css";
import Carousel from "../Carousel/Carousel";

const UpcomingEvents = ({ events = [] }) => {
  const defaultEvents = [
    { id: 1, title: "Noche de Jazz", datetime: "Viernes 8 PM", img: "" },
    { id: 2, title: "Clases de Barista", datetime: "Sábado 10 AM", img: "" }
  ];

  const evs = events.length > 0 ? events : defaultEvents;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Próximos eventos</h2>
        <a href="#" className={styles.viewAll}>Ver todos →</a>
      </div>
      <Carousel items={evs} />
    </div>
  );
};

export default UpcomingEvents;
