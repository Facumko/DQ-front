import React, { useState, useRef, useEffect, useCallback } from "react";
import { Camera, ZoomIn, ZoomOut, RotateCcw, Check, X, Move, Upload } from "lucide-react";
import styles from "./InlineImageEditor.module.css";
import { compressAvatar, compressCover } from "./imageUtils";

// ── Hook reutilizable: maneja imgLoaded con soporte de caché ──
// Si la imagen ya estaba cacheada, onLoad no se dispara.
// Este hook chequea .complete en el ref para cubrirlo.
const useImgLoaded = (src) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    setLoaded(false);
    if (!src) return;
    // Chequeo inmediato por si ya está en caché
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  const onLoad  = useCallback(() => setLoaded(true),  []);
  const onError = useCallback(() => setLoaded(true),  []); // en error también sacamos skeleton

  return { imgRef, loaded, onLoad, onError };
};

// ═══════════════════════════════════════════════════════
// COVER EDITOR
// ═══════════════════════════════════════════════════════
export const CoverEditor = ({
  currentImage,
  isEditing,
  onFileSelect,
  pendingFile,
  onConfirm,
  onDiscard,
}) => {
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  const displayImage = pendingFile?.previewUrl || currentImage || null;
  const { imgRef, loaded: imgLoaded, onLoad, onError } = useImgLoaded(displayImage);

  const [isDragging,    setIsDragging]    = useState(false);
  const [posY,          setPosY]          = useState(50);
  const [zoom,          setZoom]          = useState(1);
  const [startY,        setStartY]        = useState(null);
  const [startPosY,     setStartPosY]     = useState(50);
  const [showGrid,      setShowGrid]      = useState(false);
  const [isDragOver,    setIsDragOver]    = useState(false);
  const [confirmed,     setConfirmed]     = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    if (pendingFile) { setPosY(50); setZoom(1); setConfirmed(false); }
  }, [pendingFile?.previewUrl]);

  useEffect(() => {
    if (!pendingFile) setConfirmed(false);
  }, [pendingFile]);

  const canDrag = pendingFile && isEditing && !confirmed;

  const onMouseDown = useCallback((e) => {
    if (!canDrag) return;
    e.preventDefault();
    setIsDragging(true); setShowGrid(true);
    setStartY(e.clientY); setStartPosY(posY);
  }, [canDrag, posY]);

  const onMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const h = containerRef.current?.offsetHeight || 1;
    setPosY(Math.max(0, Math.min(100, startPosY - ((e.clientY - startY) / h) * 100)));
  }, [isDragging, startY, startPosY]);

  const onMouseUp = useCallback(() => { setIsDragging(false); setShowGrid(false); }, []);

  const onTouchStart = useCallback((e) => {
    if (!canDrag) return;
    setIsDragging(true); setShowGrid(true);
    setStartY(e.touches[0].clientY); setStartPosY(posY);
  }, [canDrag, posY]);

  const onTouchMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    const h = containerRef.current?.offsetHeight || 1;
    setPosY(Math.max(0, Math.min(100, startPosY - ((e.touches[0].clientY - startY) / h) * 100)));
  }, [isDragging, startY, startPosY]);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend",  onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend",  onMouseUp);
    };
  }, [onMouseMove, onMouseUp, onTouchMove]);

  const processFile = async (file) => {
    setIsCompressing(true);
    try {
      const result = await compressCover(file);
      onFileSelect(result.file, result.previewUrl);
    } catch {
      onFileSelect(file, URL.createObjectURL(file));
    } finally {
      setIsCompressing(false);
    }
  };

  const onDragOver  = (e) => { e.preventDefault(); setIsDragOver(true); };
  const onDragLeave = () => setIsDragOver(false);
  const onDrop = async (e) => {
    e.preventDefault(); setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) processFile(file);
  };
  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleConfirm = () => { onConfirm(posY, zoom); setConfirmed(true); };
  const handleDiscard = () => { setConfirmed(false); onDiscard(); };

  return (
    <div
      className={`${styles.coverContainer} ${isEditing ? styles.coverEditing : ""} ${isDragOver ? styles.dragOver : ""}`}
      ref={containerRef}
      onDragOver={isEditing ? onDragOver : undefined}
      onDragLeave={isEditing ? onDragLeave : undefined}
      onDrop={isEditing ? onDrop : undefined}
    >
      {/* Skeleton: visible mientras no cargó */}
      {!imgLoaded && <div className={styles.coverSkeleton} />}

      {displayImage ? (
        <img
          ref={imgRef}
          src={displayImage}
          alt="Portada"
          className={`${styles.coverImage} ${imgLoaded ? styles.coverImgLoaded : styles.coverImgLoading}`}
          style={{
            objectPosition: `center ${posY}%`,
            transform: `scale(${zoom})`,
            transformOrigin: `center ${posY}%`,
            cursor: canDrag ? (isDragging ? "grabbing" : "grab") : "default",
          }}
          onLoad={onLoad}
          onError={onError}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          draggable={false}
        />
      ) : (
        <div className={styles.coverPlaceholder}>
          <Upload size={32} strokeWidth={1.5} />
        </div>
      )}

      {isCompressing && (
        <div className={styles.compressingOverlay}>
          <div className={styles.compressingSpinner} />
          <span>Optimizando...</span>
        </div>
      )}

      {showGrid && <div className={styles.gridOverlay} />}

      {isEditing && (
        <div className={styles.coverOverlay}>
          {isDragOver && (
            <div className={styles.dropHint}>
              <Upload size={32} />
              <span>Soltá para usar esta imagen</span>
            </div>
          )}

          {!isDragOver && pendingFile && !confirmed && (
            <div className={styles.coverToolbar}>
              <div className={styles.toolbarGroup}>
                <Move size={13} />
                <span>Arrastrá para ajustar</span>
              </div>
              <div className={styles.toolbarDivider} />
              <div className={styles.zoomGroup}>
                <button type="button" className={styles.toolBtn}
                  onClick={() => setZoom(z => Math.max(1, +(z - 0.1).toFixed(2)))}>
                  <ZoomOut size={13} />
                </button>
                <input type="range" min={1} max={2.5} step={0.05} value={zoom}
                  onChange={e => setZoom(Number(e.target.value))}
                  className={styles.zoomSlider} />
                <button type="button" className={styles.toolBtn}
                  onClick={() => setZoom(z => Math.min(2.5, +(z + 0.1).toFixed(2)))}>
                  <ZoomIn size={13} />
                </button>
                <span className={styles.zoomVal}>{Math.round(zoom * 100)}%</span>
              </div>
              <button type="button" className={styles.toolBtn}
                onClick={() => { setPosY(50); setZoom(1); }} title="Resetear">
                <RotateCcw size={13} />
              </button>
              <div className={styles.toolbarDivider} />
              <button type="button" className={styles.toolBtnConfirm} onClick={handleConfirm}>
                <Check size={13} /> Listo
              </button>
              <button type="button" className={styles.toolBtnDiscard} onClick={handleDiscard}>
                <X size={13} /> Descartar
              </button>
            </div>
          )}

          {!isDragOver && (
            <label className={styles.uploadBtn}>
              <Camera size={14} />
              {currentImage || pendingFile ? "Cambiar portada" : "Subir portada"}
              <input ref={fileInputRef} type="file" accept="image/*"
                onChange={handleFileInput} className={styles.hiddenInput} />
            </label>
          )}
        </div>
      )}

      {pendingFile && isEditing && (
        <div className={`${styles.unsavedBadge} ${confirmed ? styles.badgeReady : ""}`}>
          <span className={confirmed ? styles.readyDot : styles.unsavedDot} />
          {confirmed ? "Listo — se guarda al confirmar" : "Pendiente de guardar"}
        </div>
      )}
    </div>
  );
};


// ═══════════════════════════════════════════════════════
// AVATAR EDITOR
// ═══════════════════════════════════════════════════════
export const AvatarEditor = ({
  currentImage,
  isEditing,
  onFileSelect,
  pendingFile,
  onConfirm,
  onDiscard,
}) => {
  const fileInputRef = useRef(null);

  const displayImage = pendingFile?.previewUrl || currentImage || null;
  const { imgRef, loaded: imgLoaded, onLoad, onError } = useImgLoaded(displayImage);

  const [zoom,          setZoom]          = useState(1);
  const [offset,        setOffset]        = useState({ x: 50, y: 50 });
  const [isDragging,    setIsDragging]    = useState(false);
  const [dragStart,     setDragStart]     = useState(null);
  const [startOffset,   setStartOffset]   = useState({ x: 50, y: 50 });
  const [expanded,      setExpanded]      = useState(false);
  const [confirmed,     setConfirmed]     = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    if (pendingFile) {
      setZoom(1); setOffset({ x: 50, y: 50 });
      setExpanded(true); setConfirmed(false);
    } else {
      setExpanded(false); setConfirmed(false);
    }
  }, [pendingFile?.previewUrl]);

  const canDrag = pendingFile && !confirmed;

  const onMouseDown = useCallback((e) => {
    if (!canDrag) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setStartOffset({ ...offset });
  }, [canDrag, offset]);

  const onMouseMove = useCallback((e) => {
    if (!isDragging || !dragStart) return;
    const factor = (100 / 190) * (1 / zoom);
    setOffset({
      x: Math.max(0, Math.min(100, startOffset.x - (e.clientX - dragStart.x) * factor)),
      y: Math.max(0, Math.min(100, startOffset.y - (e.clientY - dragStart.y) * factor)),
    });
  }, [isDragging, dragStart, startOffset, zoom]);

  const onMouseUp = useCallback(() => setIsDragging(false), []);

  const onTouchStart = useCallback((e) => {
    if (!canDrag) return;
    const t = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: t.clientX, y: t.clientY });
    setStartOffset({ ...offset });
  }, [canDrag, offset]);

  const onTouchMove = useCallback((e) => {
    if (!isDragging || !dragStart) return;
    e.preventDefault();
    const t = e.touches[0];
    const factor = (100 / 190) * (1 / zoom);
    setOffset({
      x: Math.max(0, Math.min(100, startOffset.x - (t.clientX - dragStart.x) * factor)),
      y: Math.max(0, Math.min(100, startOffset.y - (t.clientY - dragStart.y) * factor)),
    });
  }, [isDragging, dragStart, startOffset, zoom]);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend",  onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend",  onMouseUp);
    };
  }, [onMouseMove, onMouseUp, onTouchMove]);

  const processFile = async (file) => {
    setIsCompressing(true);
    try {
      const result = await compressAvatar(file);
      onFileSelect(result.file, result.previewUrl);
    } catch {
      onFileSelect(file, URL.createObjectURL(file));
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleConfirm = () => {
    onConfirm(offset.x, offset.y, zoom);
    setConfirmed(true);
    setExpanded(false);
  };

  const handleDiscard = () => {
    setConfirmed(false);
    setExpanded(false);
    onDiscard();
  };

  return (
    <div className={`${styles.avatarWrapper} ${expanded ? styles.avatarExpanded : ""}`}>

      {isEditing && pendingFile && !confirmed && <div className={styles.avatarRing} />}
      {isEditing && confirmed && (
        <div className={styles.avatarConfirmedBadge}><Check size={10} /></div>
      )}

      <div
        className={`${styles.avatarCircle} ${pendingFile && !confirmed ? styles.avatarCircleEditing : ""}`}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        style={{ cursor: canDrag ? (isDragging ? "grabbing" : "grab") : "default" }}
      >
        {/* Skeleton visible hasta que cargue */}
        {!imgLoaded && <div className={styles.avatarSkeleton} />}

        {isCompressing && (
          <div className={styles.avatarCompressing}>
            <div className={styles.compressingSpinner} />
          </div>
        )}

        {displayImage ? (
          <img
            ref={imgRef}
            src={displayImage}
            alt="Perfil"
            draggable={false}
            className={imgLoaded ? styles.avatarImgLoaded : styles.avatarImgLoading}
            style={{
              objectPosition: `${offset.x}% ${offset.y}%`,
              transform: `scale(${zoom})`,
              transformOrigin: `${offset.x}% ${offset.y}%`,
            }}
            onLoad={onLoad}
            onError={onError}
          />
        ) : (
          <div className={styles.avatarFallback}>
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.avatarFallbackSvg}>
              <circle cx="40" cy="40" r="40" fill="#ebebec"/>
              <ellipse cx="40" cy="62" rx="22" ry="14" fill="#d1d5db"/>
              <circle cx="40" cy="30" r="14" fill="#d1d5db"/>
              <circle cx="35" cy="26" r="4" fill="white" fillOpacity="0.35"/>
            </svg>
          </div>
        )}

        {isEditing && !pendingFile && (
          <label className={styles.avatarCameraOverlay}>
            <Camera size={22} />
            <input ref={fileInputRef} type="file" accept="image/*"
              onChange={handleFileInput} className={styles.hiddenInput} />
          </label>
        )}
      </div>

      {isEditing && pendingFile && expanded && !confirmed && (
        <div className={styles.avatarEditPanel}>
          <p className={styles.avatarEditHint}>
            <Move size={11} /> Arrastrá para reposicionar
          </p>
          <div className={styles.avatarZoomRow}>
            <ZoomOut size={13} />
            <input type="range" min={1} max={3} step={0.05} value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className={styles.avatarZoomSlider} />
            <ZoomIn size={13} />
            <span className={styles.avatarZoomVal}>{Math.round(zoom * 100)}%</span>
          </div>
          <div className={styles.avatarActions}>
            <label className={styles.avatarChangeBtn}>
              <Camera size={12} /> Cambiar
              <input type="file" accept="image/*" onChange={handleFileInput} className={styles.hiddenInput} />
            </label>
            <button type="button" className={styles.avatarResetBtn}
              onClick={() => { setOffset({ x: 50, y: 50 }); setZoom(1); }} title="Resetear">
              <RotateCcw size={12} />
            </button>
            <button type="button" className={styles.avatarDiscardBtn}
              onClick={handleDiscard} title="Descartar">
              <X size={12} />
            </button>
            <button type="button" className={styles.avatarConfirmBtn} onClick={handleConfirm}>
              <Check size={12} /> OK
            </button>
          </div>
        </div>
      )}

      {pendingFile && isEditing && (
        <div className={confirmed ? styles.avatarReadyDot : styles.avatarUnsaved} />
      )}
    </div>
  );
};