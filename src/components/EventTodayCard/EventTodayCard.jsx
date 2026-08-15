import React from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";
import styles from "./EventTodayCard.module.css";

const formatTime = (dateStr) => {
  if (!dateStr) return null;
  const time = dateStr.split("T")[1]?.slice(0, 5);
  return time || null;
};

/**
 * Tarjeta compacta para un evento de hoy, dentro de la caja "¿Qué hacemos
 * hoy?". A diferencia de <EventCalendar/> (que arma el calendario completo
 * de /eventos), esta es una lista simple pensada para "esto pasa hoy",
 * ordenada por horario.
 */
const EventTodayCard = ({ event }) => {
  const navigate = useNavigate();
  const commerceId = event.commerceOwner?.idCommerce;
  const time = formatTime(event.startDate);
  const location = event.address?.address || event.address?.street || event.commerceOwner?.name;

  const handleClick = () => {
    if (commerceId) navigate(`/negocios/${commerceId}?tab=events&item=${event.idEvent}`);
    else navigate("/eventos");
  };

  return (
    <div className={styles.card} onClick={handleClick} role="button" tabIndex={0}>
      <div className={styles.timeBadge}>
        <Calendar size={14} />
        <span>{time || "Hoy"}</span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{event.title || "Sin título"}</h3>
        {event.commerceOwner?.name && (
          <p className={styles.business}>{event.commerceOwner.name}</p>
        )}
        {location && (
          <p className={styles.location}>
            <MapPin size={12} /> {location}
          </p>
        )}
      </div>
    </div>
  );
};

export default EventTodayCard;