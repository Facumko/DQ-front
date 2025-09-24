import React from "react";
import ProfileHeader from "../components/ProfileHeader/ProfileHeader";
import Publications from "../components/Publications/Publications";
import UpcomingEvents from "../components/UpcomingEvents/UpcomingEvents";
import Gallery from "../components/Gallery/Gallery";
import FloatingChat from "../components/FloatingChat/FloatingChat";

// Valores por defecto para publicaciones, eventos y galería
const defaultPublications = [
  { title: "Noche de Jazz", type: "Evento", tag: "Nuevo", datetime: "Viernes 8 PM", timeAgo: "Hace 1 hora" },
  { title: "Fin de Semana Exitoso", type: "Promoción", tag: "Oferta", datetime: "Todo el fin de semana", timeAgo: "Hace 3 horas" }
];

const defaultEvents = [
  { id: 1, title: "Noche de Jazz", datetime: "Viernes 8 PM", img: "" },
  { id: 2, title: "Clases de Barista", datetime: "Sábado 10 AM", img: "" }
];

const defaultGallery = [
  { id: 1, img: "" },
  { id: 2, img: "" },
  { id: 3, img: "" }
];

const Negocios = () => {
  return (
    <div style={{ background: "#f4f5f8", minHeight: "100vh", padding: "24px" }}>
      <ProfileHeader />

      <Publications publicaciones={defaultPublications} />

      <UpcomingEvents events={defaultEvents} />

      <Gallery images={defaultGallery} />

      <FloatingChat />
    </div>
  );
};

export default Negocios;
