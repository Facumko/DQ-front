import React, { useMemo, useState, useEffect } from "react";
import EventCalendar, { MOCK_EVENTS, getUpcomingCount } from "../components/EventCalendar/EventCalendar";
import { getAllEvents } from "../Api/Api";
import styles from "./Eventos.module.css";
import { Calendar, Sparkles } from "lucide-react";

const Eventos = () => {
  const [events, setEvents] = useState(MOCK_EVENTS);

  useEffect(() => {
    getAllEvents()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const normalized = data.map((ev) => ({
            id:          ev.idEvent,
            title:       ev.title,
            date:        ev.startDate?.split("T")[0],
            time:        ev.startDate?.split("T")[1]?.slice(0, 5),
            endTime:     ev.endDate?.split("T")[1]?.slice(0, 5),
            location:    ev.address?.address || "",
            business:    ev.nameCommerce || "",
            description: ev.description || "",
            category:    ev.categories?.[0]?.name || "Evento",
            color:       "#B00020",
          }));
          setEvents(normalized);
        }
      })
      .catch(() => {}); // si falla usa los mock
  }, []);

  const upcoming = useMemo(() => getUpcomingCount(events), [events]);

  return (
    <div className={styles.page}>
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

        {upcoming > 0 && (
          <div className={styles.upcomingBadge}>
            <Sparkles size={15} className={styles.sparkle} />
            <span>
              <strong>{upcoming}</strong> evento{upcoming !== 1 ? "s" : ""} próximos
            </span>
          </div>
        )}
      </div>

      <div className={styles.calendarWrapper}>
        <EventCalendar events={events} />
      </div>
    </div>
  );
};

export default Eventos;