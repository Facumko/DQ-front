import React from "react";
import { Star, ArrowRight, Plus, AlertCircle } from "lucide-react";
import styles from "../ProfileHeader.module.css";

const BusinessActions = ({ isOwner, isEditing, businessId, businessData, loadingStates, onCreatePost }) => {
  return (
    <div className={styles.externalActionsModern}>
      {!isEditing && (
        <div className={styles.actionsModern}>
          <button className={styles.favButtonModern}>
            <Star color="#e74c3c" /> Favorito
          </button>
          {businessData.link && String(businessData.link).trim() !== "" && (
            <a 
              href={String(businessData.link).startsWith('http') ? String(businessData.link) : `https://${String(businessData.link)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialButtonModern}
              style={{ textDecoration: 'none' }}
            >
              {String(businessData.link)} <ArrowRight size={16} />
            </a>
          )}
        </div>
      )}

      {isOwner && !businessId && !isEditing && (
        <div className={styles.infoBanner}>
          <AlertCircle size={18} />
          Completa los datos de tu negocio para empezar a publicar
        </div>
      )}

      {isOwner && businessId && !isEditing && (
        <div className={styles.createActionsModern}>
          <button 
            className={styles.createButtonModern} 
            onClick={() => onCreatePost("post")}
            disabled={loadingStates.creatingPost}
          >
            <Plus size={16} /> <span>Publicación</span>
          </button>
          <button 
            className={styles.createButtonModern} 
            onClick={() => onCreatePost("event")}
            disabled={loadingStates.creatingPost}
          >
            <Plus size={16} /> <span>Evento</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default BusinessActions;