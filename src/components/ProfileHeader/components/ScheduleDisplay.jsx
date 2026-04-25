import React, { useState, useEffect } from "react";
import { Clock, ChevronDown, ChevronUp } from "lucide-react";
import styles from "../ProfileHeader.module.css";

const ScheduleDisplay = ({ schedule }) => {
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [nextOpenTime, setNextOpenTime] = useState(null);

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

  // Ensure schedule is valid
  const safeSchedule = schedule || {};

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      const currentDay = new Intl.DateTimeFormat('es', { weekday: 'short' }).format(now).toLowerCase();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      // Map Spanish day abbreviations to our schedule keys
      const dayMap = {
        'lun': 'Lun',
        'mar': 'Mar',
        'mié': 'Mie',
        'jue': 'Jue',
        'vie': 'Vie',
        'sáb': 'Sab',
        'dom': 'Dom'
      };

      const todayKey = dayMap[currentDay] || 'Lun';
      const today = safeSchedule[todayKey];

      if (!today || today.cerrado) {
        setIsOpen(false);
        // Find next open day
        const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const todayIndex = days.indexOf(todayKey);
        for (let i = 1; i <= 7; i++) {
          const nextDayIndex = (todayIndex + i) % 7;
          const nextDay = schedule[days[nextDayIndex]];
          if (nextDay && !nextDay.cerrado) {
            setNextOpenTime(`Abre ${days[nextDayIndex].toLowerCase()}`);
            break;
          }
        }
        return;
      }

      if (today.deCorrido) {
        const [openHour, openMin] = today.open.split(':').map(Number);
        const [closeHour, closeMin] = today.close.split(':').map(Number);
        const openTime = openHour * 60 + openMin;
        const closeTime = closeHour * 60 + closeMin;

        if (currentTime >= openTime && currentTime < closeTime) {
          setIsOpen(true);
          setNextOpenTime(`Cierra a las ${today.close}`);
        } else {
          setIsOpen(false);
          setNextOpenTime(currentTime < openTime ? `Abre a las ${today.open}` : 'Cerrado hoy');
        }
      } else {
        const mananaOpen = today.manana.open.split(':').map(Number);
        const mananaClose = today.manana.close.split(':').map(Number);
        const tardeOpen = today.tarde.open.split(':').map(Number);
        const tardeClose = today.tarde.close.split(':').map(Number);

        const mananaOpenTime = mananaOpen[0] * 60 + mananaOpen[1];
        const mananaCloseTime = mananaClose[0] * 60 + mananaClose[1];
        const tardeOpenTime = tardeOpen[0] * 60 + tardeOpen[1];
        const tardeCloseTime = tardeClose[0] * 60 + tardeClose[1];

        if ((currentTime >= mananaOpenTime && currentTime < mananaCloseTime) ||
            (currentTime >= tardeOpenTime && currentTime < tardeCloseTime)) {
          setIsOpen(true);
          const nextClose = currentTime < mananaCloseTime ? mananaCloseTime : tardeCloseTime;
          const closeHour = Math.floor(nextClose / 60);
          const closeMin = nextClose % 60;
          setNextOpenTime(`Cierra a las ${closeHour.toString().padStart(2, '0')}:${closeMin.toString().padStart(2, '0')}`);
        } else {
          setIsOpen(false);
          if (currentTime < mananaOpenTime) {
            setNextOpenTime(`Abre a las ${today.manana.open}`);
          } else if (currentTime < tardeOpenTime) {
            setNextOpenTime(`Abre a las ${today.tarde.open}`);
          } else {
            setNextOpenTime('Cerrado hoy');
          }
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [safeSchedule]);

  return (
    <div className={styles.scheduleDisplay}>
      <div className={`${styles.scheduleStatus} ${isOpen ? styles.open : styles.closed}`}>
        <Clock size={16} />
        <span>{isOpen ? 'Abierto ahora' : 'Cerrado'}</span>
        {nextOpenTime && <span className={styles.nextTime}>• {nextOpenTime}</span>}
      </div>

      <button
        className={styles.scheduleToggle}
        onClick={() => setShowFullSchedule(!showFullSchedule)}
      >
        <Clock size={16} />
        <span>Ver horarios completos</span>
        {showFullSchedule ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {showFullSchedule && (
        <div className={styles.scheduleTable}>
          {Object.entries(safeSchedule).map(([day, hoy]) => (
            <div key={day} className={styles.scheduleRow}>
              <span className={styles.scheduleDay}>{dayDisplayNames[day] || day}</span>
              <span className={`${styles.scheduleHours} ${hoy.cerrado ? styles.scheduleClosed : ''}`}>
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