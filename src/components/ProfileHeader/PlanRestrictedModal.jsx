import React from "react";
import { X, Sparkles } from "lucide-react";
import styles from "./PlanRestrictedModal.module.css";

/**
 * Modal que se muestra en lugar del formulario de promoción cuando el
 * usuario no tiene una suscripción activa. Ofrece ir directo al checkout
 * del plan sugerido (targetPlanId).
 */
const PlanRestrictedModal = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Necesitás un plan superior</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.iconWrap}>
            <Sparkles size={26} />
          </div>
          <p className={styles.text}>
            Para poder crear promociones necesitás tener un plan superior activo.
            Mejorá tu plan para destacar tu negocio en el carrusel principal.
          </p>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Ahora no
          </button>
          <button className={styles.upgradeBtn} onClick={onUpgrade}>
            Mejorar plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanRestrictedModal;