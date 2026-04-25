import React, { useState, useEffect, useRef } from "react";
import { X, Image, Link2, Tag, Calendar, AlertCircle, Check } from "lucide-react";
import styles from "./PromotionModal.module.css";
import LinkContentModal from "./LinkContentModal";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const PromotionModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  availableTags = [],
  posts = [],
  events = [],
  isSubmitting = false,
}) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    tags: [],
    startDate: "",
    endDate: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [linked, setLinked] = useState(null); // { type: 'post'|'event', item }
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [errors, setErrors] = useState({});
  const fileRef = useRef();

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setForm({
        title: initialData.title || "",
        description: initialData.description || "",
        tags: initialData.tags?.map(t => t.name || t) || [],
        startDate: initialData.startDate?.split("T")[0] || "",
        endDate: initialData.endDate?.split("T")[0] || "",
      });
      setImagePreview(initialData.coverImageUrl || null);
      setImageFile(null);
      if (initialData.redirectType === "POST" && initialData.redirectTargetId) {
        const post = posts.find(p => p.id === initialData.redirectTargetId);
        if (post) setLinked({ type: "post", item: post });
      } else if (initialData.redirectType === "EVENT" && initialData.redirectTargetId) {
        const ev = events.find(e => e.idEvent === initialData.redirectTargetId);
        if (ev) setLinked({ type: "event", item: ev });
      }
    } else {
      setForm({ title: "", description: "", tags: [], startDate: "", endDate: "" });
      setImageFile(null);
      setImagePreview(null);
      setLinked(null);
    }
    setErrors({});
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: "" }));
  };

  const toggleTag = (tagName) => {
    setForm(p => {
      if (p.tags.includes(tagName)) {
        return { ...p, tags: p.tags.filter(t => t !== tagName) };
      }
      if (p.tags.length >= 1) return p; // max 1 tag
      return { ...p, tags: [...p.tags, tagName] };
    });
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) { setErrors(p => ({ ...p, image: "Máximo 5MB" })); return; }
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrors(p => ({ ...p, image: "Solo JPG, PNG o WebP" })); return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors(p => ({ ...p, image: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "El título es requerido";
    if (form.title.trim().length > 100) e.title = "Máximo 100 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const dto = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      tags: form.tags,
      startDate: form.startDate ? `${form.startDate}T00:00:00` : null,
      endDate: form.endDate ? `${form.endDate}T23:59:59` : null,
      idLinkedPost: linked?.type === "post" ? linked.item.id : null,
      idLinkedEvent: linked?.type === "event" ? linked.item.idEvent : null,
    };
    onSubmit(dto, imageFile);
  };

  const handleLinkSelect = (type, item) => {
    if (!type) { setLinked(null); return; }
    setLinked({ type, item });
  };

  const linkedLabel = linked
    ? linked.type === "post"
      ? `Post: ${(linked.item.text || "").slice(0, 30)}...`
      : `Evento: ${linked.item.title}`
    : null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.header}>
            <h2 className={styles.title}>
              {initialData ? "Editar promoción" : "Nueva promoción"}
            </h2>
            <button className={styles.closeBtn} onClick={onClose} disabled={isSubmitting}>
              <X size={18} />
            </button>
          </div>

          <div className={styles.body}>
            <div className={styles.field}>
              <label className={styles.label}>Título <span className={styles.req}>*</span></label>
              <input
                className={`${styles.input} ${errors.title ? styles.inputError : ""}`}
                value={form.title}
                onChange={e => handleChange("title", e.target.value)}
                placeholder="Ej: Oferta de verano, 2x1 en cenas..."
                maxLength={100}
              />
              {errors.title && (
                <span className={styles.errorMsg}><AlertCircle size={12} />{errors.title}</span>
              )}
              <span className={styles.charCount}>{form.title.length}/100</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Descripción</label>
              <textarea
                className={styles.textarea}
                value={form.description}
                onChange={e => handleChange("description", e.target.value)}
                placeholder="Describí tu promoción..."
                rows={3}
                maxLength={300}
              />
              <span className={styles.charCount}>{form.description.length}/300</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                <Image size={13} /> Imagen de portada
              </label>
              {imagePreview ? (
                <div className={styles.imagePreviewWrap}>
                  <img src={imagePreview} alt="Preview" className={styles.imagePreview} />
                  <button
                    className={styles.changeImageBtn}
                    onClick={() => fileRef.current?.click()}
                    type="button"
                  >
                    Cambiar imagen
                  </button>
                  <button
                    className={styles.removeImageBtn}
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    type="button"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button className={styles.uploadBtn} onClick={() => fileRef.current?.click()} type="button">
                  <Image size={20} />
                  <span>Subir imagen</span>
                  <span className={styles.uploadHint}>JPG, PNG, WebP — máx 5MB</span>
                </button>
              )}
              {errors.image && (
                <span className={styles.errorMsg}><AlertCircle size={12} />{errors.image}</span>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImage}
              />
            </div>

            {availableTags.length > 0 && (
              <div className={styles.field}>
                <label className={styles.label}>
                  <Tag size={13} /> Etiqueta <span className={styles.hint}>(máx. 1)</span>
                </label>
                <div className={styles.tagsWrap}>
                  {availableTags.map(tag => {
                    const tagName = tag.name || tag;
                    const selected = form.tags.includes(tagName);
                    return (
                      <button
                        key={tagName}
                        type="button"
                        className={`${styles.tagChip} ${selected ? styles.tagChipActive : ""}`}
                        onClick={() => toggleTag(tagName)}
                      >
                        {selected && <Check size={11} />}
                        {tagName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={styles.dateRow}>
              <div className={styles.field}>
                <label className={styles.label}><Calendar size={13} /> Inicio</label>
                <input
                  type="date"
                  className={styles.input}
                  value={form.startDate}
                  onChange={e => handleChange("startDate", e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}><Calendar size={13} /> Fin</label>
                <input
                  type="date"
                  className={styles.input}
                  value={form.endDate}
                  onChange={e => handleChange("endDate", e.target.value)}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}><Link2 size={13} /> Vincular post o evento</label>
              {linkedLabel ? (
                <div className={styles.linkedBadge}>
                  <span>{linkedLabel}</span>
                  <button
                    className={styles.linkedEdit}
                    onClick={() => setShowLinkModal(true)}
                    type="button"
                  >
                    Cambiar
                  </button>
                  <button
                    className={styles.linkedRemove}
                    onClick={() => setLinked(null)}
                    type="button"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <button
                  className={styles.linkBtn}
                  onClick={() => setShowLinkModal(true)}
                  type="button"
                >
                  <Link2 size={15} /> Elegir post o evento
                </button>
              )}
            </div>
          </div>

          <div className={styles.footer}>
            <button className={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={isSubmitting || !form.title.trim()}
            >
              {isSubmitting
                ? "Guardando..."
                : initialData ? "Guardar cambios" : "Crear promoción"}
            </button>
          </div>
        </div>
      </div>

      <LinkContentModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        posts={posts}
        events={events}
        currentLinked={linked ? { type: linked.type, id: linked.type === "post" ? linked.item.id : linked.item.idEvent } : null}
        onSelect={handleLinkSelect}
      />
    </>
  );
};

export default PromotionModal;