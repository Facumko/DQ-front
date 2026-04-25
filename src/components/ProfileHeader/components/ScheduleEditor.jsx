import React from "react";
import { Clock, ToggleLeft, ToggleRight } from "lucide-react";
import styles from "../ProfileHeader.module.css";

const ScheduleEditor = ({ schedule, onChange }) => {
  const days = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  // Display names for days
  const dayDisplayNames = {
    'Lun': 'Lunes',
    'Mar': 'Martes',
    'Mie': 'Miércoles',
    'Jue': 'Jueves',
    'Vie': 'Viernes',
    'Sab': 'Sábado',
    'Dom': 'Domingo'
  };

  return (
    <div className={styles.scheduleEditor}>
      <div className={styles.scheduleHeader}>
        <Clock size={16} />
        <span>Horarios de atención</span>
      </div>

      <div className={styles.scheduleGrid}>
        {days.map(day => {
          const hoy = schedule[day] || { cerrado: true, deCorrido: true, open: '09:00', close: '18:00', manana: { open: '09:00', close: '13:00' }, tarde: { open: '15:00', close: '18:00' } };

          return (
            <div key={day} className={styles.dayCard}>
              <div className={styles.dayHeader}>
                <span className={styles.dayName}>{dayDisplayNames[day] || day}</span>
                <button
                  type="button"
                  className={`${styles.toggleSwitch} ${hoy.cerrado ? styles.toggleOff : styles.toggleOn}`}
                  onClick={() => onChange(day, 'cerrado', !hoy.cerrado)}
                >
                  {hoy.cerrado ? <ToggleLeft size={20} /> : <ToggleRight size={20} />}
                  <span>{hoy.cerrado ? 'Cerrado' : 'Abierto'}</span>
                </button>
              </div>

              {!hoy.cerrado && (
                <div className={styles.dayControls}>
                  <div className={styles.modeToggle}>
                    <button
                      type="button"
                      className={`${styles.modeBtn} ${hoy.deCorrido ? styles.modeActive : ''}`}
                      onClick={() => onChange(day, 'deCorrido', true)}
                    >
                      De corrido
                    </button>
                    <button
                      type="button"
                      className={`${styles.modeBtn} ${!hoy.deCorrido ? styles.modeActive : ''}`}
                      onClick={() => onChange(day, 'deCorrido', false)}
                    >
                      Dos turnos
                    </button>
                  </div>

                  {hoy.deCorrido ? (
                    <div className={styles.timeInputs}>
                      <div className={styles.timeGroup}>
                        <label>Abre</label>
                        <input
                          type="time"
                          value={hoy.open}
                          onChange={(e) => onChange(day, 'open', e.target.value)}
                          className={styles.timeInput}
                        />
                      </div>
                      <div className={styles.timeGroup}>
                        <label>Cierra</label>
                        <input
                          type="time"
                          value={hoy.close}
                          onChange={(e) => onChange(day, 'close', e.target.value)}
                          className={styles.timeInput}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className={styles.timeInputs}>
                      <div className={styles.shiftGroup}>
                        <span className={styles.shiftLabel}>Mañana</span>
                        <div className={styles.timeGroup}>
                          <input
                            type="time"
                            value={hoy.manana.open}
                            onChange={(e) => onChange(day, 'manana.open', e.target.value)}
                            className={styles.timeInput}
                          />
                          <span className={styles.timeSep}>a</span>
                          <input
                            type="time"
                            value={hoy.manana.close}
                            onChange={(e) => onChange(day, 'manana.close', e.target.value)}
                            className={styles.timeInput}
                          />
                        </div>
                      </div>
                      <div className={styles.shiftGroup}>
                        <span className={styles.shiftLabel}>Tarde</span>
                        <div className={styles.timeGroup}>
                          <input
                            type="time"
                            value={hoy.tarde.open}
                            onChange={(e) => onChange(day, 'tarde.open', e.target.value)}
                            className={styles.timeInput}
                          />
                          <span className={styles.timeSep}>a</span>
                          <input
                            type="time"
                            value={hoy.tarde.close}
                            onChange={(e) => onChange(day, 'tarde.close', e.target.value)}
                            className={styles.timeInput}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleEditor;