import React from "react";
import styles from "./EmergencyNumbers.module.css";
import { LOCAL_EMERGENCY_NUMBERS } from "./emergencyNumbers.constants";

const EmergencyNumbers = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Números útiles de Sáenz Peña</h2>
        <p className={styles.subtitle}>Gratuitos. Tocá para llamar directamente.</p>
      </div>

      <div className={styles.grid}>
        {LOCAL_EMERGENCY_NUMBERS.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.id}
              href={`tel:${item.number}`}
              className={styles.card}
              aria-label={`Llamar a ${item.label}: ${item.display}`}
            >
              <span className={styles.iconWrap}>
                <Icon size={22} />
              </span>
              <span className={styles.info}>
                <span className={styles.label}>{item.label}</span>
                <span className={styles.description}>{item.description}</span>
              </span>
              <span className={styles.number}>{item.display}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default EmergencyNumbers;