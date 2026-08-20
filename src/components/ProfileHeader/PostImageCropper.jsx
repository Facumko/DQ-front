import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { ZoomIn, ZoomOut, Check, X } from "lucide-react";
import { cropImageToSquare } from "./imageUtils";
import styles from "./PostImageCropper.module.css";

/**
 * Recorte cuadrado (1:1) de una imagen antes de subirla a una publicación,
 * igual que el ajuste de imagen de Instagram: arrastrar para mover, control
 * de zoom para acercar/alejar, siempre dentro de un marco cuadrado fijo.
 *
 * Al confirmar, devuelve un archivo YA recortado (mismo tamaño de salida
 * para cualquier imagen de entrada), para que se vea igual en todos lados
 * donde se muestre la publicación.
 *
 * @param {string} imageSrc - objectURL de la imagen original a recortar
 * @param {(result: {file: File, previewUrl: string}) => void} onConfirm
 * @param {() => void} onCancel
 */
const PostImageCropper = ({ imageSrc, onConfirm, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const onCropComplete = useCallback((_croppedArea, croppedAreaPixelsValue) => {
    setCroppedAreaPixels(croppedAreaPixelsValue);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels || isProcessing) return;
    setIsProcessing(true);
    setError("");
    try {
      const result = await cropImageToSquare(imageSrc, croppedAreaPixels);
      onConfirm(result);
    } catch {
      setError("No se pudo recortar la imagen. Probá de nuevo.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Ajustá tu foto</h3>
          <button type="button" className={styles.closeBtn} onClick={onCancel} disabled={isProcessing} aria-label="Cancelar">
            <X size={20} />
          </button>
        </div>

        <p className={styles.hint}>Arrastrá para mover y usá el control para acercar o alejar</p>

        <div className={styles.cropperWrapper}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="rect"
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className={styles.zoomRow}>
          <ZoomOut size={18} className={styles.zoomIcon} />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className={styles.zoomSlider}
            aria-label="Zoom"
          />
          <ZoomIn size={18} className={styles.zoomIcon} />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={isProcessing}>
            Cancelar
          </button>
          <button type="button" className={styles.confirmBtn} onClick={handleConfirm} disabled={isProcessing || !croppedAreaPixels}>
            {isProcessing ? "Procesando…" : <><Check size={16} /> Listo</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostImageCropper;