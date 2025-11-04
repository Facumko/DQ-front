import React from "react";
import { Clock } from "lucide-react";
import styles from "../ProfileHeader.module.css";

const ScheduleEditor = ({ schedule, onChange }) => {
  return (
    <div className={styles.horarioSectionModern}>
      <div className={styles.horarioHeaderModern}>
        <Clock size={16} />
        <span>Configurar horarios</span>
        <span className={styles.editHintModern}>Marcá "Cerrado" si no abrís ese día</span>
      </div>
      <div className={styles.horarioEditModern}>
        {Object.entries(schedule).map(([day, hoy]) => (
          <div key={day} className={styles.diaFilaModern}>
            <span className={styles.diaNombreModern}>{day}</span>
            <div className={styles.diaContenidoModern}>
              <label className={styles.chkCerradoModern}>
                <input 
                  type="checkbox" 
                  checked={hoy.cerrado} 
                  onChange={(e) => onChange(day, 'cerrado', e.target.checked)}
                />
                Cerrado
              </label>
              {!hoy.cerrado && (
                <div className={styles.turnosDiaModern}>
                  {hoy.deCorrido ? (
                    <div className={styles.corridoFilaModern}>
                      <span className={styles.turnoLabelModern}>De corrido</span>
                      <input 
                        type="time" 
                        value={hoy.open} 
                        onChange={(e) => onChange(day, 'open', e.target.value)}
                      />
                      <span className={styles.sepModern}>a</span>
                      <input 
                        type="time" 
                        value={hoy.close} 
                        onChange={(e) => onChange(day, 'close', e.target.value)}
                      />
                    </div>
                  ) : (
                    <>
                      <div className={styles.turnoFilaModern}>
                        <span className={styles.turnoLabelModern}>Mañana</span>
                        <input 
                          type="time" 
                          value={hoy.manana.open} 
                          onChange={(e) => onChange(day, 'manana.open', e.target.value)}
                        />
                        <span className={styles.sepModern}>a</span>
                        <input 
                          type="time" 
                          value={hoy.manana.close} 
                          onChange={(e) => onChange(day, 'manana.close', e.target.value)}
                        />
                      </div>
                      <div className={styles.turnoFilaModern}>
                        <span className={styles.turnoLabelModern}>Tarde</span>
                        <input 
                          type="time" 
                          value={hoy.tarde.open} 
                          onChange={(e) => onChange(day, 'tarde.open', e.target.value)}
                        />
                        <span className={styles.sepModern}>a</span>
                        <input 
                          type="time" 
                          value={hoy.tarde.close} 
                          onChange={(e) => onChange(day, 'tarde.close', e.target.value)}
                        />
                      </div>
                    </>
                  )}
                  <label className={styles.chkCorridoModern}>
                    <input 
                      type="checkbox" 
                      checked={hoy.deCorrido} 
                      onChange={(e) => onChange(day, 'deCorrido', e.target.checked)}
                    />
                    De corrido
                  </label>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleEditor;