import React, { useMemo } from "react";
import EventCalendar, { MOCK_EVENTS, getUpcomingCount } from "../components/EventCalendar/EventCalendar";
import styles from "./Eventos.module.css";
import { Calendar, Sparkles } from "lucide-react";

const Eventos = () => {
  // 🔄 TODO: Reemplazar con llamada al backend cuando esté listo
  // Ejemplo futuro:
  // const [events, setEvents] = useState([]);
  // useEffect(() => {
  //   getAllPosts().then(posts =>
  //     setEvents(posts.filter(p => p.type === "event").map(normalizeEventFromPost))
  //   );
  // }, []);

  const events = MOCK_EVENTS; // <- reemplazar por estado real
  const upcoming = useMemo(() => getUpcomingCount(events), [events]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <Calendar size={28} />
          </div>
          <div>
            <h1 className={styles.title}>Eventos</h1>
            <p className={styles.subtitle}>
              Descubrí lo que está pasando en tu ciudad
            </p>
          </div>
        </div>

        {/* Contador de próximos eventos */}
        {upcoming > 0 && (
          <div className={styles.upcomingBadge}>
            <Sparkles size={15} className={styles.sparkle} />
            <span>
              <strong>{upcoming}</strong> evento{upcoming !== 1 ? "s" : ""} próximos
            </span>
          </div>
        )}
      </div>

      {/* Calendario */}
      <div className={styles.calendarWrapper}>
        <EventCalendar events={events} />
      </div>
    </div>
  );
};

export default Eventos;