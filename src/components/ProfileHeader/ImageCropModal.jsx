import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import styles from "./ImageCropModal.module.css";

// ─── Utilidad: recortar imagen con canvas ───────────────────────────────────
const createCroppedImage = async (imageSrc, croppedAreaPixels) => {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width  = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
      const previewUrl = URL.createObjectURL(blob);
      resolve({ file, previewUrl });
    }, "image/jpeg", 0.92);
  });
};

// ─── Componente principal ───────────────────────────────────────────────────
/**
 * ImageCropModal
 *
 * Props:
 *  - imageSrc   : string (URL blob de la imagen original)
 *  - aspect     : number (ej: 16/9 para portada, 1 para avatar)
 *  - onConfirm  : ({ file, previewUrl }) => void
 *  - onCancel   : () => void
 *  - title      : string (opcional)
 */
const ImageCropModal = ({
  imageSrc,
  aspect     = 1,
  onConfirm,
  onCancel,
  title      = "Ajustar imagen",
}) => {
  const [crop,           setCrop]           = useState({ x: 0, y: 0 });
  const [zoom,           setZoom]           = useState(1);
  const [croppedAreaPx,  setCroppedAreaPx]  = useState(null);
  const [isProcessing,   setIsProcessing]   = useState(false);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPx(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPx) return;
    setIsProcessing(true);
    try {
      const result = await createCroppedImage(imageSrc, croppedAreaPx);
      onConfirm(result);
    } catch (err) {
      console.error("Error al recortar imagen:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.subtitle}>Arrastrá para reposicionar · Usá el slider para hacer zoom</p>
        </div>

        {/* Área de recorte */}
        <div className={styles.cropArea}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid={true}
            style={{
              containerStyle: { borderRadius: "8px" },
              cropAreaStyle:  { border: "2px solid #B00020" },
            }}
          />
        </div>

        {/* Slider de zoom */}
        <div className={styles.zoomSection}>
          <span className={styles.zoomLabel}>🔍</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className={styles.zoomSlider}
          />
          <span className={styles.zoomValue}>{Math.round(zoom * 100)}%</span>
        </div>

        {/* Botones */}
        <div className={styles.actions}>
          <button className={styles.btnCancel} onClick={onCancel} disabled={isProcessing}>
            Cancelar
          </button>
          <button className={styles.btnConfirm} onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? "Procesando..." : "Confirmar"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ImageCropModal;