import React, { useState } from "react";
import styles from "./ProfileHeader.module.css";
import { MapPin, Clock, Phone, Mail, Star, ArrowRight, Edit2 } from "lucide-react";

const ProfileHeader = ({ isOwner = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Estados para edición (solo si isOwner)
  const [businessData, setBusinessData] = useState({
    name: "Café Central",
    status: "Abierto ahora",
    address: "Calle 12 entre 13 y 15",
    addressDetail: "Frente a la Plaza Central",
    schedule: "Lun-Vie: 7:00-22:00, Sáb-Dom: 8:00-23:00",
    phone: "+1 (555) 123-4567",
    email: "info@cafecentral.com",
    social: "@cafecentral"
  });

  const handleSave = () => {
    // Aquí harías la llamada al backend para guardar
    console.log("Guardando cambios:", businessData);
    setIsEditing(false);
    // TODO: Implementar llamada a API
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Restaurar datos originales si es necesario
  };

  return (
    <div className={styles.headerContainer}>
      {/* ⭐ Botón de editar (solo para dueño) */}
      {isOwner && (
        <div className={styles.editButtonContainer}>
          {!isEditing ? (
            <button 
              className={styles.editButton}
              onClick={() => setIsEditing(true)}
              title="Editar información"
            >
              <Edit2 size={18} />
              Editar
            </button>
          ) : (
            <div className={styles.editActions}>
              <button className={styles.saveButton} onClick={handleSave}>
                Guardar
              </button>
              <button className={styles.cancelButton} onClick={handleCancel}>
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}

      <div className={styles.businessInfo}>
        {isEditing ? (
          <input
            type="text"
            value={businessData.name}
            onChange={(e) => setBusinessData({...businessData, name: e.target.value})}
            className={styles.editInput}
          />
        ) : (
          <h1 className={styles.businessName}>{businessData.name}</h1>
        )}
        <span className={styles.status}>{businessData.status}</span>
      </div>

      <div className={styles.contactInfo}>
        <div className={styles.row}>
          <MapPin color="#333" size={18} />
          {isEditing ? (
            <div className={styles.editColumn}>
              <input
                type="text"
                value={businessData.address}
                onChange={(e) => setBusinessData({...businessData, address: e.target.value})}
                className={styles.editInput}
                placeholder="Dirección"
              />
              <input
                type="text"
                value={businessData.addressDetail}
                onChange={(e) => setBusinessData({...businessData, addressDetail: e.target.value})}
                className={styles.editInputSmall}
                placeholder="Detalle de ubicación"
              />
            </div>
          ) : (
            <div className={styles.address}>
              {businessData.address}
              <span className={styles.addressDetail}>{businessData.addressDetail}</span>
            </div>
          )}
        </div>

        <div className={styles.row}>
          <Clock color="#333" size={18} />
          {isEditing ? (
            <input
              type="text"
              value={businessData.schedule}
              onChange={(e) => setBusinessData({...businessData, schedule: e.target.value})}
              className={styles.editInput}
              placeholder="Horarios"
            />
          ) : (
            <span>{businessData.schedule}</span>
          )}
        </div>

        <div className={styles.row}>
          <Phone color="#333" size={18} />
          {isEditing ? (
            <input
              type="tel"
              value={businessData.phone}
              onChange={(e) => setBusinessData({...businessData, phone: e.target.value})}
              className={styles.editInput}
              placeholder="Teléfono"
            />
          ) : (
            <span>{businessData.phone}</span>
          )}

          <Mail color="#333" size={18} />
          {isEditing ? (
            <input
              type="email"
              value={businessData.email}
              onChange={(e) => setBusinessData({...businessData, email: e.target.value})}
              className={styles.editInput}
              placeholder="Email"
            />
          ) : (
            <span>{businessData.email}</span>
          )}
        </div>
      </div>

      {!isEditing && (
        <div className={styles.actions}>
          <button className={styles.favButton}><Star color="#e74c3c" /> Favorito</button>
          <button className={styles.socialButton}>
            {isEditing ? (
              <input
                type="text"
                value={businessData.social}
                onChange={(e) => setBusinessData({...businessData, social: e.target.value})}
                className={styles.editInput}
                placeholder="Usuario de red social"
              />
            ) : (
              <>
                {businessData.social} <ArrowRight size={16}/>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileHeader;