import React, { useState, useEffect } from "react";
import {
  Play, Pause, Pencil, Trash2, Eye, MousePointer,
  Tag, Link2, AlertCircle, Loader
} from "lucide-react";
import {
  activatePromotion, pausePromotion, deletePromotion, getPromotionMetrics
} from "../../Api/Api";
import styles from "./PromotionCard.module.css";

// Modal de conflicto (ya hay una promoción activa)
const ConflictModal = ({ onConfirm, onCancel }) => (
  <div className={styles.conflictOverlay} onClick={onCancel}>
    <div className={styles.conflictModal} onClick={e => e.stopPropagation()}>
      <div className={styles.conflictIcon}><AlertCircle size={28} /></div>
      <h3 className={styles.conflictTitle}>Ya tenés una promoción activa</h3>
      <p className={styles.conflictDesc}>
        ¿Querés pausar la promoción activa actual y activar esta?
      </p>
      <div className={styles.conflictActions}>
        <button className={styles.conflictCancel} onClick={onCancel}>Cancelar</button>
        <button className={styles.conflictConfirm} onClick={onConfirm}>Sí, activar esta</button>
      </div>
    </div>
  </div>
);

// Badge de estado
const StatusBadge = ({ status }) => {
  const map = {
    ACTIVE: { label: "Activa", cls: styles.badgeActive },
    PAUSED: { label: "Pausada", cls: styles.badgePaused },
    DRAFT:  { label: "Borrador", cls: styles.badgeDraft },
  };
  const { label, cls } = map[status] || map.DRAFT;
  return <span className={`${styles.statusBadge} ${cls}`}>{label}</span>;
};

const PromotionCard = ({ promotion, onEdit, onDeleted, onStatusChanged, onError }) => {
  const [loading, setLoading] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  const isActive = promotion.status === "ACTIVE";
  const isPaused = promotion.status === "PAUSED";
  const isDraft  = promotion.status === "DRAFT";

  // Cargar métricas solo si está ACTIVE
  useEffect(() => {
    if (!isActive) return;
    setMetricsLoading(true);
    getPromotionMetrics(promotion.idPromotion)
      .then(data => setMetrics(data))
      .catch(() => setMetrics(null))
      .finally(() => setMetricsLoading(false));
  }, [promotion.idPromotion, isActive]);

  const handleActivate = async (confirmarPausa = false) => {
    setLoading(true);
    try {
      await activatePromotion(promotion.idPromotion, confirmarPausa);
      setShowConflict(false);
      onStatusChanged?.();
    } catch (err) {
      if (err.isConflict) {
        setShowConflict(true);
      } else {
        onError?.(err.message || "Error al activar la promoción");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    setLoading(true);
    try {
      await pausePromotion(promotion.idPromotion);
      onStatusChanged?.();
    } catch (err) {
      onError?.(err.message || "Error al pausar la promoción");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Eliminar esta promoción? Esta acción no se puede deshacer.")) return;
    setLoading(true);
    try {
      await deletePromotion(promotion.idPromotion);
      onDeleted?.();
    } catch (err) {
      onError?.(err.message || "Error al eliminar la promoción");
      setLoading(false);
    }
  };

  const redirectLabel = promotion.redirectType && promotion.redirectTargetId
    ? promotion.redirectType === "POST"
      ? "Post vinculado"
      : promotion.redirectType === "EVENT"
      ? "Evento vinculado"
      : "Comercio vinculado"
    : null;

  return (
    <>
      <div className={`${styles.card} ${isActive ? styles.cardActive : ""}`}>

        {/* Imagen */}
        <div className={styles.imageWrap}>
          {promotion.coverImageUrl ? (
            <img src={promotion.coverImageUrl} alt={promotion.title} className={styles.image} />
          ) : (
            <div className={styles.imagePlaceholder}>
              <Tag size={28} />
              <span>Sin imagen</span>
            </div>
          )}
          <StatusBadge status={promotion.status} />
        </div>

        {/* Body */}
        <div className={styles.body}>
          <h3 className={styles.cardTitle}>{promotion.title}</h3>

          {promotion.description && (
            <p className={styles.cardDesc}>{promotion.description}</p>
          )}

          {/* Tags */}
          {promotion.tags?.length > 0 && (
            <div className={styles.tagsRow}>
              {promotion.tags.map((tag, i) => (
                <span key={i} className={styles.tagChip}>
                  <Tag size={10} /> {tag.name || tag}
                </span>
              ))}
            </div>
          )}

          {/* Redirect */}
          {redirectLabel && (
            <div className={styles.redirectRow}>
              <Link2 size={12} />
              <span>{redirectLabel}</span>
            </div>
          )}

          {/* Fechas */}
          {(promotion.startDate || promotion.endDate) && (
            <div className={styles.datesRow}>
              {promotion.startDate && (
                <span>Desde {promotion.startDate.split("T")[0]}</span>
              )}
              {promotion.endDate && (
                <span>Hasta {promotion.endDate.split("T")[0]}</span>
              )}
            </div>
          )}

          {/* Métricas — solo si ACTIVE */}
          {isActive && (
            <div className={styles.metricsRow}>
              {metricsLoading ? (
                <span className={styles.metricsLoading}>
                  <Loader size={12} className={styles.spinIcon} /> Cargando métricas...
                </span>
              ) : metrics ? (
                <>
                  <span className={styles.metricItem}>
                    <Eye size={13} /> {metrics.views ?? 0} vistas
                  </span>
                  <span className={styles.metricItem}>
                    <MousePointer size={13} /> {metrics.clicks ?? 0} clicks
                  </span>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className={styles.actions}>
          {/* Activar / Pausar */}
          {!isActive ? (
            <button
              className={styles.btnActivate}
              onClick={() => handleActivate(false)}
              disabled={loading}
              title="Activar promoción"
            >
              {loading ? <Loader size={13} className={styles.spinIcon} /> : <Play size={13} />}
              Activar
            </button>
          ) : (
            <button
              className={styles.btnPause}
              onClick={handlePause}
              disabled={loading}
              title="Pausar promoción"
            >
              {loading ? <Loader size={13} className={styles.spinIcon} /> : <Pause size={13} />}
              Pausar
            </button>
          )}

          {/* Editar */}
          <button
            className={styles.btnEdit}
            onClick={() => onEdit?.(promotion)}
            disabled={loading}
            title="Editar"
          >
            <Pencil size={13} />
          </button>

          {/* Eliminar */}
          <button
            className={styles.btnDelete}
            onClick={handleDelete}
            disabled={loading}
            title="Eliminar"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {showConflict && (
        <ConflictModal
          onConfirm={() => handleActivate(true)}
          onCancel={() => setShowConflict(false)}
        />
      )}
    </>
  );
};

export default PromotionCard;