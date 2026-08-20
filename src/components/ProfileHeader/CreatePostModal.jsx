import React, { useState, useEffect } from "react";
import styles from "./CreatePostModal.module.css";
import { X, Calendar, Image, MapPin, Clock, AlertCircle, ArrowLeft, ArrowRight, Trash2 } from "lucide-react";

const MAX_IMAGES = 10;
const MAX_TITLE_LENGTH = 100;
const MAX_LOCATION_LENGTH = 150;

// Cada imagen (nueva o ya guardada en el servidor) se representa igual,
// así reordenar/eliminar es un solo camino de código sin importar el origen.
// { key, url, kind: 'existing' | 'new', id?, file? }

const CreatePostModal = ({ isOpen, onClose, onSubmit, type = "post", initialData = null, isSubmitting = false }) => {
  const [endDate,  setEndDate]  = useState("");
  const [endTime,  setEndTime]  = useState("");
  const [title,    setTitle]    = useState("");
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [originalExistingIds, setOriginalExistingIds] = useState([]); // snapshot al abrir, para saber qué se borró
  const [activeIndex, setActiveIndex] = useState(0);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [taggedBusiness, setTaggedBusiness] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // ✅ Confirmaciones propias (reemplazan window.confirm / alert)
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState(null); // índice de imagen a confirmar borrado
  const [confirmingClose, setConfirmingClose] = useState(false); // confirmar salir sin guardar

  // ✅ Resetear estado al abrir/cerrar
  useEffect(() => {
    if (!isOpen) {
      // Limpiar URLs temporales al cerrar
      images.forEach(img => {
        if (img.kind === 'new' && img.url?.startsWith?.('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });

      setText("");
      setImages([]);
      setOriginalExistingIds([]);
      setDate("");
      setTime("");
      setLocation("");
      setTaggedBusiness("");
      setActiveIndex(0);
      setHasUnsavedChanges(false);
      setEndDate("");
      setEndTime("");
      setTitle("");
      setErrorMessage("");
      setFieldErrors({});
      setPendingRemoveIndex(null);
      setConfirmingClose(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ✅ Cargar datos de edición
  useEffect(() => {
    if (isOpen && initialData) {
      setText(initialData.text || "");
      setDate(initialData.date || "");
      setTime(initialData.time || "");
      setEndDate(initialData.endDate || "");
      setEndTime(initialData.endTime || "");
      setTitle(initialData.title || "");
      setLocation(initialData.location || "");
      setTaggedBusiness(initialData.taggedBusiness || "");
      setFieldErrors({});

      // Cargar imágenes existentes con sus IDs
      const initial = (initialData.imageDetails || []).map(img => ({
        key: `existing-${img.id}`,
        url: img.url,
        kind: 'existing',
        id: img.id,
      }));
      setImages(initial);
      setOriginalExistingIds(initial.map(i => i.id));

      setActiveIndex(0);
      setHasUnsavedChanges(false);
    }
  }, [isOpen, initialData]);

  // ✅ Detectar cambios sin guardar
  useEffect(() => {
    if (!isOpen) return;
    const currentExistingIds = images.filter(i => i.kind === 'existing').map(i => i.id);
    const removedExisting = originalExistingIds.some(id => !currentExistingIds.includes(id));
    const addedNew = images.some(i => i.kind === 'new');
    setHasUnsavedChanges(removedExisting || addedNew);
  }, [images, originalExistingIds, isOpen]);

  // ✅ Mantener el índice activo dentro de rango cuando cambia la cantidad de fotos
  useEffect(() => {
    setActiveIndex(i => Math.min(i, Math.max(images.length - 1, 0)));
  }, [images.length]);

  const totalImages = images.length;
  const newCount = images.filter(i => i.kind === 'new').length;
  const availableSlots = MAX_IMAGES - totalImages;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    if (files.length > availableSlots) {
      setErrorMessage(`Solo puedes agregar ${availableSlots} imágenes más (máximo ${MAX_IMAGES} total, actualmente tienes ${totalImages}).`);
      e.target.value = "";
      return;
    }

    setErrorMessage("");

    const newItems = files.map((file, i) => ({
      key: `new-${Date.now()}-${i}-${file.name}`,
      url: URL.createObjectURL(file),
      kind: 'new',
      file,
    }));

    setActiveIndex(images.length); // enfocar la primera recién agregada
    setImages(prev => [...prev, ...newItems]);
  };

  const removeImageAt = (index) => {
    setImages(prev => {
      const img = prev[index];
      if (img?.kind === 'new' && img.url?.startsWith?.('blob:')) {
        URL.revokeObjectURL(img.url);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleRemoveImage = (index) => {
    const img = images[index];
    if (!img) return;

    if (img.kind === 'existing') {
      // Las imágenes ya guardadas en el servidor requieren confirmación propia
      setPendingRemoveIndex(index);
    } else {
      // Imagen nueva (local): se puede sacar directo, no hay nada que perder en el servidor
      removeImageAt(index);
    }
  };

  const confirmRemoveExistingImage = () => {
    if (pendingRemoveIndex === null) return;
    removeImageAt(pendingRemoveIndex);
    setPendingRemoveIndex(null);
  };

  // ✅ Reordenar: mueve la foto actualmente enfocada un lugar a la izquierda/derecha
  const moveActiveImage = (direction) => {
    setImages(prev => {
      const target = activeIndex + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[activeIndex], next[target]] = [next[target], next[activeIndex]];
      return next;
    });
    setActiveIndex(i => i + direction);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return; // evita doble envío

    // ✅ Validación: en modo creación DEBE haber al menos 1 imagen nueva
    if (!initialData && newCount === 0) {
      setErrorMessage("Debes subir al menos una imagen nueva.");
      return;
    }

    // ✅ Validación: en modo edición debe quedar al menos 1 imagen total
    if (initialData && totalImages === 0) {
      setErrorMessage("Debe quedar al menos una imagen en la publicación.");
      return;
    }

    if (typeof onSubmit !== 'function') {
      setErrorMessage("Error interno: no se puede enviar el formulario.");
      return;
    }

    // ✅ Validación de campos de evento: título, lugar y fechas
    if (type === "event") {
      const errs = {};
      const trimmedTitle = title.trim();
      const trimmedLocation = location.trim();

      if (!trimmedTitle) {
        errs.title = "El título es obligatorio.";
      } else if (trimmedTitle.length > MAX_TITLE_LENGTH) {
        errs.title = `Máximo ${MAX_TITLE_LENGTH} caracteres.`;
      }

      if (!trimmedLocation) {
        errs.location = "El lugar es obligatorio.";
      } else if (trimmedLocation.length > MAX_LOCATION_LENGTH) {
        errs.location = `Máximo ${MAX_LOCATION_LENGTH} caracteres.`;
      }

      if (!date || !time) {
        errs.date = "La fecha y hora de inicio son obligatorias.";
      }
      if (!endDate || !endTime) {
        errs.endDate = "La fecha y hora de fin son obligatorias.";
      }
      if (date && time && endDate && endTime) {
        const start = new Date(`${date}T${time}`);
        const end = new Date(`${endDate}T${endTime}`);
        if (end <= start) {
          errs.endDate = "El fin debe ser posterior al inicio.";
        }
      }

      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        setErrorMessage("Revisá los campos marcados.");
        return;
      }
      setFieldErrors({});
    }

    setErrorMessage("");

    // ✅ Construir payload a partir del array unificado de imágenes
    const currentExistingIds = images.filter(i => i.kind === 'existing').map(i => i.id);
    const imagesToDelete = originalExistingIds.filter(id => !currentExistingIds.includes(id));
    const imageFiles = images.filter(i => i.kind === 'new').map(i => i.file);
    const existingImagesPayload = images.filter(i => i.kind === 'existing').map(i => ({ id: i.id, url: i.url }));

    const payload = {
      text: text.trim(),
      type,
      imageFiles,
      imagesToDelete,
      existingImages: existingImagesPayload,
      ...(type === "event" && {
        date,
        time,
        location,
        taggedBusiness, endDate, endTime, title,
      }),
    };

    // ✅ No cerramos acá: el padre cierra el modal recién cuando el guardado
    // termina bien (isOpen se pone en false desde afuera). Si falla, el
    // modal queda abierto con lo que ya escribiste, no se pierde nada.
    onSubmit(payload);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    if (hasUnsavedChanges) {
      setConfirmingClose(true);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const submitLabel = isSubmitting
    ? (initialData ? "Guardando cambios…" : type === "event" ? "Subiendo evento…" : "Subiendo publicación…")
    : (initialData ? "Guardar cambios" : "Publicar");

  // Bloques reutilizables — se renderizan en distinto orden según el tipo
  // (eventos: título → imágenes → descripción → logística; posts: sin cambios)
  const descriptionSection = (
    <>
      <textarea
        placeholder="Escribe algo..."
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 1000))}
        className={styles.textarea}
        maxLength={1000}
        disabled={isSubmitting}
      />
      <div className={styles.charCount}>{text.length}/1000</div>
    </>
  );

  const imagesSection = (
    <>
      {/* ✅ VISTA PREVIA PRINCIPAL */}
      {images.length > 0 && (
        <div className={styles.mainViewer}>
          <img
            src={images[activeIndex]?.url}
            alt={`Vista previa ${activeIndex + 1}`}
            className={styles.mainImg}
          />

          {images.length > 1 && (
            <>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => setActiveIndex((activeIndex - 1 + images.length) % images.length)}
              >
                ‹
              </button>
              <button
                type="button"
                className={styles.navBtn}
                style={{ right: '12px', left: 'auto' }}
                onClick={() => setActiveIndex((activeIndex + 1) % images.length)}
              >
                ›
              </button>
            </>
          )}
        </div>
      )}

      {/* ✅ Puntitos de posición (reemplaza al contador que tapaba la foto) */}
      {images.length > 1 && (
        <div className={styles.dots}>
          {images.map((img, i) => (
            <button
              key={img.key}
              type="button"
              className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ""}`}
              onClick={() => setActiveIndex(i)}
              aria-label={`Ver foto ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* ✅ Controles sobre la foto actualmente enfocada: reordenar / eliminar */}
      {images.length > 0 && (
        <div className={styles.photoToolbar}>
          <button
            type="button"
            className={styles.toolbarBtn}
            onClick={() => moveActiveImage(-1)}
            disabled={isSubmitting || activeIndex === 0 || images.length < 2}
            title="Mover a la izquierda"
          >
            <ArrowLeft size={15} /> Mover
          </button>
          <button
            type="button"
            className={`${styles.toolbarBtn} ${styles.toolbarBtnDanger}`}
            onClick={() => handleRemoveImage(activeIndex)}
            disabled={isSubmitting}
            title="Eliminar esta foto"
          >
            <Trash2 size={14} /> Eliminar
          </button>
          <button
            type="button"
            className={styles.toolbarBtn}
            onClick={() => moveActiveImage(1)}
            disabled={isSubmitting || activeIndex === images.length - 1 || images.length < 2}
            title="Mover a la derecha"
          >
            Mover <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* Botón agregar más */}
      <label className={`${styles.fileLabel} ${availableSlots === 0 || isSubmitting ? styles.disabled : ""}`}>
        <Image size={18} />
        {images.length === 0
          ? "Subir imagen"
          : `Agregar más (${availableSlots} disponibles)`}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className={styles.fileInput}
          disabled={availableSlots === 0 || isSubmitting}
        />
      </label>
    </>
  );

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={handleClose} type="button" disabled={isSubmitting}>
          <X size={20} />
        </button>

        <h2>{initialData ? "Editar" : type === "event" ? "Crear Evento" : "Crear Publicación"}</h2>

        {/* Advertencia de cambios sin guardar */}
        {hasUnsavedChanges && !isSubmitting && (
          <div className={styles.warningBanner}>
            <AlertCircle size={16} />
            Tienes cambios sin guardar en las imágenes
          </div>
        )}

        {/* Errores de validación */}
        {errorMessage && (
          <div className={styles.errorBanner}>
            <AlertCircle size={16} />
            {errorMessage}
          </div>
        )}

        <div className={styles.form} style={isSubmitting ? { opacity: 0.6, pointerEvents: "none" } : undefined}>
          {type === "event" ? (
            <>
              {/* 1. Título — lo primero que el usuario define mentalmente */}
              <label className={styles.fieldLabel}>
                <span className={styles.fieldLabelText}>Título del evento</span>
                <input
                  type="text"
                  value={title}
                  onChange={e => {
                    setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH));
                    if (fieldErrors.title) setFieldErrors(p => ({ ...p, title: "" }));
                  }}
                  placeholder="Nombre del evento"
                  maxLength={MAX_TITLE_LENGTH}
                  className={fieldErrors.title ? styles.inputErrorBorder : ""}
                />
                <div className={styles.fieldFooter}>
                  {fieldErrors.title
                    ? <span className={styles.fieldErrorText}><AlertCircle size={12} />{fieldErrors.title}</span>
                    : <span />}
                  <span className={styles.charCountSmall}>{title.length}/{MAX_TITLE_LENGTH}</span>
                </div>
              </label>

              {/* 2. Imágenes — ancla visual del evento, antes de describirlo */}
              {imagesSection}

              {/* 3. Descripción — ahora que ya sabe de qué trata y tiene soporte visual */}
              {descriptionSection}

              {/* 4. Datos logísticos: fecha/hora y lugar, al final */}
              <div className={styles.row}>
                <label>
                  <span className={styles.fieldLabelText}><Calendar size={14}/> Inicio</span>
                  <input
                    type="date"
                    value={date}
                    onChange={e => { setDate(e.target.value); if (fieldErrors.date) setFieldErrors(p => ({ ...p, date: "" })); }}
                    className={fieldErrors.date ? styles.inputErrorBorder : ""}
                  />
                </label>
                <label>
                  <span className={styles.fieldLabelText}><Clock size={14}/> Hora inicio</span>
                  <input
                    type="time"
                    value={time}
                    onChange={e => { setTime(e.target.value); if (fieldErrors.date) setFieldErrors(p => ({ ...p, date: "" })); }}
                    className={fieldErrors.date ? styles.inputErrorBorder : ""}
                  />
                </label>
              </div>
              {fieldErrors.date && <span className={styles.fieldErrorText}><AlertCircle size={12} />{fieldErrors.date}</span>}

              <div className={styles.row}>
                <label>
                  <span className={styles.fieldLabelText}><Calendar size={14}/> Fin</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => { setEndDate(e.target.value); if (fieldErrors.endDate) setFieldErrors(p => ({ ...p, endDate: "" })); }}
                    className={fieldErrors.endDate ? styles.inputErrorBorder : ""}
                  />
                </label>
                <label>
                  <span className={styles.fieldLabelText}><Clock size={14}/> Hora fin</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => { setEndTime(e.target.value); if (fieldErrors.endDate) setFieldErrors(p => ({ ...p, endDate: "" })); }}
                    className={fieldErrors.endDate ? styles.inputErrorBorder : ""}
                  />
                </label>
              </div>
              {fieldErrors.endDate && <span className={styles.fieldErrorText}><AlertCircle size={12} />{fieldErrors.endDate}</span>}

              <label className={styles.fieldLabel}>
                <span className={styles.fieldLabelText}><MapPin size={14}/> Lugar</span>
                <input
                  type="text"
                  placeholder="Lugar del evento"
                  value={location}
                  onChange={e => {
                    setLocation(e.target.value.slice(0, MAX_LOCATION_LENGTH));
                    if (fieldErrors.location) setFieldErrors(p => ({ ...p, location: "" }));
                  }}
                  maxLength={MAX_LOCATION_LENGTH}
                  className={fieldErrors.location ? styles.inputErrorBorder : ""}
                />
                <div className={styles.fieldFooter}>
                  {fieldErrors.location
                    ? <span className={styles.fieldErrorText}><AlertCircle size={12} />{fieldErrors.location}</span>
                    : <span />}
                  <span className={styles.charCountSmall}>{location.length}/{MAX_LOCATION_LENGTH}</span>
                </div>
              </label>
            </>
          ) : (
            <>
              {/* Posts normales: se mantiene el orden original (descripción → imágenes) */}
              {descriptionSection}
              {imagesSection}
            </>
          )}
        </div>

        <div className={styles.footer}>
          <button onClick={handleSubmit} className={styles.submitButton} type="button" disabled={isSubmitting}>
            {submitLabel}
          </button>
        </div>
      </div>

      {/* Confirmación para eliminar imagen existente del servidor */}
      {pendingRemoveIndex !== null && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmBox}>
            <p>¿Eliminar esta imagen? El cambio se aplicará recién al guardar.</p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.confirmCancel}
                onClick={() => setPendingRemoveIndex(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.confirmDelete}
                onClick={confirmRemoveExistingImage}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación para cerrar con cambios sin guardar */}
      {confirmingClose && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmBox}>
            <p>Tienes cambios sin guardar en las imágenes. ¿Salir sin guardar?</p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.confirmCancel}
                onClick={() => setConfirmingClose(false)}
              >
                Seguir editando
              </button>
              <button
                type="button"
                className={styles.confirmDelete}
                onClick={() => {
                  setConfirmingClose(false);
                  onClose();
                }}
              >
                Salir sin guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePostModal;