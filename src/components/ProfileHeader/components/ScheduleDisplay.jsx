import React, { useState } from "react";
import { Clock } from "lucide-react";
import styles from "../ProfileHeader.module.css";

const ScheduleDisplay = ({ schedule }) => {
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  return (
    <div className={styles.horarioClienteModern}>
      <button
        className={styles.toggleScheduleModern}
        onClick={() => setShowFullSchedule(!showFullSchedule)}
      >
        <Clock size={16} />
        Ver horarios
      </button>
      {showFullSchedule && (
        <div className={styles.tablaHorariosModern}>
          {Object.entries(schedule).map(([day, hoy]) => (
            <div key={day} className={styles.filaClienteModern}>
              <span className={styles.diaClienteModern}>{day}</span>
              <span className={styles.horarioClienteTextModern}>
                {hoy.cerrado 
                  ? "Cerrado" 
                  : hoy.deCorrido 
                    ? `${hoy.open} – ${hoy.close}` 
                    : `Mañana: ${hoy.manana.open} – ${hoy.manana.close} | Tarde: ${hoy.tarde.open} – ${hoy.tarde.close}`
                }
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScheduleDisplay;