import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation } from "lucide-react";
import styles from "./LocationDisplay.module.css";

// Mismo fix de ícono de Leaflet + Vite que usa LocationPicker
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Mismo ícono rojo de negocio que usa LocationPicker, para consistencia visual
const businessIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize:    [25, 41],
  iconAnchor:  [12, 41],
  popupAnchor: [1, -34],
  shadowSize:  [41, 41],
});

const ZOOM = 15;

/**
 * Vista de solo lectura de la ubicación de un negocio.
 * A diferencia de <LocationPicker>, NO tiene buscador, NO tiene botón de
 * GPS, y el marcador NO es arrastrable ni el mapa reacciona a clics:
 * es solo para que cualquier usuario vea dónde queda el negocio y llegue.
 * Editar la ubicación es una acción exclusiva del dueño (ver LocationPicker).
 */
export default function LocationDisplay({ location, label = "Ubicación" }) {
  if (!location?.lat || !location?.lng) return null;
  const { lat, lng, address } = location;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className={styles.wrapper}>
      {label && <p className={styles.label}>{label}</p>}

      {address && (
        <div className={styles.addressRow}>
          <MapPin size={15} className={styles.addressIcon} />
          <span className={styles.addressText}>{address}</span>
        </div>
      )}

      <div className={styles.mapWrap}>
        <MapContainer
          center={[lat, lng]}
          zoom={ZOOM}
          className={styles.map}
          scrollWheelZoom={false}
          dragging={true}
          doubleClickZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <Marker position={[lat, lng]} icon={businessIcon} />
        </MapContainer>
      </div>

      <a
        className={styles.directionsBtn}
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Navigation size={15} />
        Cómo llegar
      </a>
    </div>
  );
}