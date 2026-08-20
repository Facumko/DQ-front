import React, { useState, useEffect } from "react";
import EventCalendar from "../components/EventCalendar/EventCalendar";
import { getAllEvents } from "../Api/Api";
import styles from "./Eventos.module.css";
import { Calendar, Loader, AlertCircle } from "lucide-react";

// Paleta para diferenciar eventos por categoría del comercio
const EVENT_COLORS = ["#B00020", "#1976D2", "#43A047", "#FB8C00", "#8E24AA", "#D81B60", "#00897B", "#5E35B1"];

// Hash simple y estable: misma categoría → siempre el mismo color
const colorForCategory = (name) => {
  if (!name) return EVENT_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length];
};

// EventResponseDto (real) → forma que espera <EventCalendar/>
const normalizeEvent = (ev) => {
  const category = ev.commerceOwner?.category?.name || "Evento";
  return {
    id:          ev.idEvent,
    title:       ev.title || "Sin título",
    date:        ev.startDate?.split("T")[0],
    time:        ev.startDate?.split("T")[1]?.slice(0, 5),
    endTime:     ev.endDate?.split("T")[1]?.slice(0, 5),
    location:    ev.address?.address || ev.address?.street || "",
    business:    ev.commerceOwner?.name || "",
    description: ev.description || "",
    category,
    color:       colorForCategory(category),
  };
};

const Eventos = () => {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getAllEvents()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        const normalized = list
          .filter((ev) => ev.active !== false && ev.startDate) // solo eventos reales y activos
          .map(normalizeEvent);
        setEvents(normalized);
      })
      .catch(() => {
        if (!cancelled) setError("No pudimos cargar los eventos. Intentá de nuevo más tarde.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <Calendar size={26} />
          </div>
          <div>
            <h1 className={styles.title}>Eventos</h1>
            <p className={styles.subtitle}>Descubrí lo que está pasando en tu ciudad</p>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className={styles.calendarWrapper}>
        {loading ? (
          <div className={styles.loadingState}>
            <Loader size={26} className={styles.spin} />
            <p>Cargando eventos…</p>
          </div>
        ) : (
          <EventCalendar events={events} />
        )}
      </div>
    </div>
  );
};

export default Eventos;