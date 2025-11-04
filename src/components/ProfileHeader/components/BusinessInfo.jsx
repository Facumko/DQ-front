import React from "react";
import { Edit2, Loader, User, Camera, Phone, Mail, Link2 } from "lucide-react";
import ScheduleDisplay from "./ScheduleDisplay";
import ScheduleEditor from "./ScheduleEditor";
import CoverImage from "./CoverImage";
import styles from "../ProfileHeader.module.css";

const BusinessInfo = ({ 
  isOwner, isEditing, businessData, draft, schedule, draftSchedule, status, errors, 
  loadingStates, profileImageFile, coverImageFile, onEdit, onSave, onCancel, 
  onInputChange, onPhoneChange, onValidate, setDraft, setDraftSchedule, 
  setProfileImageFile, setCoverImageFile 
}) => {
  
  const handleScheduleChange = (day, field, value) => {
    setDraftSchedule(prev => {
      const newSchedule = { ...prev };
      if (field === 'cerrado' || field === 'deCorrido') {
        newSchedule[day] = { ...newSchedule[day], [field]: value };
      } else if (field.includes('.')) {
        const [section, subfield] = field.split('.');
        newSchedule[day] = {
          ...newSchedule[day],
          [section]: { ...newSchedule[day][section], [subfield]: value }
        };
      } else {
        newSchedule[day] = { ...newSchedule[day], [field]: value };
      }
      return newSchedule;
    });
  };

  const getCurrentStatusColor = () => {
    const now = new Date();
    const day = now.toLocaleDateString("es-ES", { weekday: "short" });
    const dayMap = { lun: "Lun", mar: "Mar", mié: "Mie", jue: "Jue", vie: "Vie", sáb: "Sab", dom: "Dom" };
    const today = dayMap[day.toLowerCase()];
    
    if (!today || !schedule[today]) return "statusClosed";
    const hoy = schedule[today];
    if (hoy.cerrado) return "statusClosed";
    
    const ahora = now.toTimeString().slice(0, 5);
    let isOpen = false;
    
    if (hoy.deCorrido) {
      isOpen = ahora >= hoy.open && ahora <= hoy.close;
    } else {
      const openM = ahora >= hoy.manana.open && ahora <= hoy.manana.close;
      const openT = ahora >= hoy.tarde.open && ahora <= hoy.tarde.close;
      isOpen = openM || openT;
    }
    
    return isOpen ? "statusOpen" : "statusNeutral";
  };

  return (
    <>
      {isOwner && (
        <div className={styles.editButtonContainer}>
          {!isEditing ? (
            <button className={styles.editButtonModern} onClick={onEdit}>
              <Edit2 size={16} /> Editar
            </button>
          ) : (
            <div className={styles.editActionsModern}>
              <button 
                className={styles.saveButtonModern} 
                onClick={onSave}
                disabled={loadingStates.savingBusiness || loadingStates.profileImage || loadingStates.coverImage}
              >
                {loadingStates.savingBusiness ? (
                  <><Loader size={16} className={styles.spinnerIcon} />Guardando...</>
                ) : "Guardar"}
              </button>
              <button 
                className={styles.cancelButtonModern} 
                onClick={onCancel}
                disabled={loadingStates.savingBusiness || loadingStates.profileImage || loadingStates.coverImage}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}

      <div className={styles.layoutModern}>
        <div className={styles.leftColumnModern}>
          <div className={styles.profileHeaderModern}>
            {isEditing ? (
              <label className={styles.profilePicEditModern}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (draft.profileImage?.startsWith('blob:')) {
                        URL.revokeObjectURL(draft.profileImage);
                      }
                      setProfileImageFile(file);
                      setDraft({ ...draft, profileImage: URL.createObjectURL(file) });
                    }
                  }}
                  className={styles.fileInputModern}
                />
                {draft.profileImage ? (
                  <img src={draft.profileImage} alt="Perfil" className={styles.profilePicModern} />
                ) : (
                  <Camera size={28} color="#999" />
                )}
              </label>
            ) : (
              <div className={styles.profilePicDisplayModern}>
                {businessData.profileImage ? (
                  <img src={businessData.profileImage} alt="Perfil" className={styles.profilePicModern} />
                ) : (
                  <User size={40} color="#999" />
                )}
              </div>
            )}

            <div className={styles.nameStatusModern}>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => {
                      onInputChange("name")(e);
                      onValidate("name", e.target.value, { required: true, maxLength: 100 });
                    }}
                    className={`${styles.editInputModern} ${errors.name ? styles.invalidModern : ""}`}
                    placeholder="Nombre del negocio *"
                    maxLength={100}
                  />
                  {errors.name && <span className={styles.errorMsgModern}>{errors.name}</span>}
                  <span style={{ fontSize: "0.75rem", color: "#666" }}>
                    {draft.name.length}/100 caracteres
                  </span>
                </>
              ) : (
                <>
                  <h1 className={styles.businessNameModern}>{businessData.name || "Sin nombre"}</h1>
                  <span className={styles[getCurrentStatusColor()]}>{status}</span>
                </>
              )}
            </div>
          </div>

          <div className={styles.descriptionSectionModern}>
            {isEditing ? (
              <>
                <textarea
                  value={draft.description}
                  onChange={(e) => {
                    onInputChange("description")(e);
                    onValidate("description", e.target.value, { required: true, maxLength: 500 });
                  }}
                  className={`${styles.textareaModern} ${errors.description ? styles.invalidModern : ""}`}
                  placeholder="Descripción del negocio *"
                  maxLength={500}
                />
                {errors.description && <span className={styles.errorMsgModern}>{errors.description}</span>}
                <span style={{ fontSize: "0.75rem", color: "#666", textAlign: "right", display: "block" }}>
                  {draft.description.length}/500 caracteres
                </span>
              </>
            ) : (
              <p className={styles.descriptionTextModern}>{businessData.description || "Sin descripción"}</p>
            )}
          </div>

          {!isEditing && <ScheduleDisplay schedule={schedule} />}

          <div className={styles.contactInfoModern}>
            <div className={styles.rowModern}>
              <Phone color="#333" size={18} />
              {isEditing ? (
                <div style={{ flex: 1 }}>
                  <input
                    type="tel"
                    value={draft.phone}
                    onChange={(e) => {
                      onPhoneChange(e);
                      onValidate("phone", e.target.value, { phone: true });
                    }}
                    className={`${styles.editInputModern} ${errors.phone ? styles.invalidModern : ""}`}
                    placeholder="(123) 456-7890"
                  />
                  {errors.phone && <span className={styles.errorMsgModern}>{errors.phone}</span>}
                </div>
              ) : (
                <span>{businessData.phone || "Sin teléfono"}</span>
              )}
            </div>

            <div className={styles.rowModern}>
              <Mail color="#333" size={18} />
              {isEditing ? (
                <div style={{ flex: 1 }}>
                  <input
                    type="email"
                    value={draft.email}
                    onChange={(e) => {
                      onInputChange("email")(e);
                      onValidate("email", e.target.value, { email: true });
                    }}
                    className={`${styles.editInputModern} ${errors.email ? styles.invalidModern : ""}`}
                    placeholder="ejemplo@dominio.com"
                    maxLength={60}
                  />
                  {errors.email && <span className={styles.errorMsgModern}>{errors.email}</span>}
                </div>
              ) : (
                <span>{businessData.email || "Sin email"}</span>
              )}
            </div>

            <div className={styles.rowModern}>
              <Link2 color="#333" size={18} />
              {isEditing ? (
                <input
                  type="url"
                  value={String(draft.link || "")}
                  onChange={onInputChange("link")}
                  className={styles.editInputModern}
                  placeholder="https://tusitio.com o @tured"
                  maxLength={200}
                />
              ) : (
                <span>{String(businessData.link || "") || "Sin link"}</span>
              )}
            </div>
          </div>

          {isEditing && <ScheduleEditor schedule={draftSchedule} onChange={handleScheduleChange} />}
        </div>

        <div className={styles.rightColumnModern}>
          <CoverImage 
            isEditing={isEditing}
            coverImage={isEditing ? draft.coverImage : businessData.coverImage}
            onFileChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                if (typeof draft.coverImage === 'string' && draft.coverImage.startsWith('blob:')) {
                  URL.revokeObjectURL(draft.coverImage);
                }
                setCoverImageFile(file);
                setDraft({ ...draft, coverImage: URL.createObjectURL(file) });
              }
            }}
          />
        </div>
      </div>
    </>
  );
};

export default BusinessInfo;