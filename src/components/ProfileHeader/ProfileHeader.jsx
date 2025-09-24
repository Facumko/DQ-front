import React from "react";
import styles from "./ProfileHeader.module.css";
import { MapPin, Clock, Phone, Mail, Star, ArrowRight } from "lucide-react";

const ProfileHeader = () => {
  return (
    <div className={styles.headerContainer}>
      <div className={styles.businessInfo}>
        <h1 className={styles.businessName}>Café Central</h1>
        <span className={styles.status}>Abierto ahora</span>
      </div>

      <div className={styles.contactInfo}>
        <div className={styles.row}>
          <MapPin color="#333" size={18} />
          <div className={styles.address}>
            Calle 12 entre 13 y 15
            <span className={styles.addressDetail}>Frente a la Plaza Central</span>
          </div>
        </div>
        <div className={styles.row}>
          <Clock color="#333" size={18} />
          <span>Lun-Vie: 7:00-22:00, Sáb-Dom: 8:00-23:00</span>
        </div>
        <div className={styles.row}>
          <Phone color="#333" size={18} /><span>+1 (555) 123-4567</span>
          <Mail color="#333" size={18} /><span>info@cafecentral.com</span>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.favButton}><Star color="#e74c3c" /> Favorito</button>
        <button className={styles.socialButton}>@cafecentral <ArrowRight size={16}/></button>
      </div>
    </div>
  );
};

export default ProfileHeader;
