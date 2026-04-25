import React, { useContext, useState, useEffect, useCallback, useMemo } from "react";
import { UserContext } from "../../pages/UserContext";
import { getMyUser, updateUser } from "../../Api/Api";
import styles from "./Profile.module.css";
import {
  User, Mail, Phone, Edit2, Save, X, Lock, Check, AlertCircle,
  Loader, Eye, EyeOff, RefreshCw, Shield, AtSign, RotateCcw, Info
} from "lucide-react";

/* ─────────────────────────────────────────
   Reglas de validación por campo
───────────────────────────────────────── */
const RULES = {
  name: {
    max: 45,
    validate: (v) => {
      if (!v) return null;
      if (v.length < 2)                                   return "Mínimo 2 caracteres";
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/.test(v))       return "Solo se permiten letras";
      return null;
    },
  },
  lastname: {
    max: 45,
    validate: (v) => {
      if (!v) return null;
      if (v.length < 2)                                   return "Mínimo 2 caracteres";
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/.test(v))       return "Solo se permiten letras";
      return null;
    },
  },
  username: {
    max: 25,
    validate: (v) => {
      if (!v) return null;
      if (v.length < 3)                                   return "Mínimo 3 caracteres";
      if (!/^[a-zA-Z0-9_.-]+$/.test(v))                  return "Solo letras, números, punto, guión o _";
      return null;
    },
  },
  email: {
    max: 100,
    required: true,
    validate: (v) => {
      if (!v)                                             return "El email es obligatorio";
      if (!/^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v))
                                                          return "Formato inválido (ej: vos@ejemplo.com)";
      return null;
    },
  },
  recoveryEmail: {
    max: 100,
    validate: (v, all) => {
      if (!v) return null;
      if (!/^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v))
                                                          return "Formato inválido (ej: recuperacion@ejemplo.com)";
      if (all && v.trim() === all.email?.trim())          return "Debe ser diferente al email principal";
      return null;
    },
  },
  phone: {
    max: 20,
    validate: (v) => {
      if (!v) return null;
      const digits = v.replace(/\D/g, "");
      if (digits.length < 7)                              return "Mínimo 7 dígitos";
      if (digits.length > 15)                             return "Máximo 15 dígitos";
      return null;
    },
  },
  password: {
    max: 100,
    validate: (v) => {
      if (!v) return null;
      if (v.length < 8)                                   return "Mínimo 8 caracteres";
      return null;
    },
    strength: (v) => {
      if (!v || v.length < 8) return { level: "weak",   label: "Muy débil" };
      const n = [/[A-Z]/.test(v), /[a-z]/.test(v), /\d/.test(v),
                 /[!@#$%^&*_+\-=[\]{};':",.<>/?]/.test(v), v.length >= 12]
                .filter(Boolean).length;
      if (n >= 4) return { level: "strong", label: "Fuerte" };
      if (n >= 2) return { level: "medium", label: "Media"  };
      return         { level: "weak",   label: "Débil"  };
    },
  },
};

/* ─────────────────────────────────────────
   Componente
───────────────────────────────────────── */
export default function Profile() {
  const { user, updateUserContext } = useContext(UserContext);

  const [isEditing,   setIsEditing]   = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [toast,       setToast]       = useState(null);

  const [originalData, setOriginalData] = useState(null);
  const [formData,     setFormData]     = useState({
    username: "", name: "", lastname: "",
    email: "", recoveryEmail: "", phone: "", password: "",
  });
  const [touched,   setTouched]   = useState({});
  const [pwVisible, setPwVisible] = useState(false);

  const [showPwSection, setShowPwSection] = useState(false);
  const [pwData,        setPwData]        = useState({ current: "", next: "", confirm: "" });
  const [pwVis,         setPwVis]         = useState({ current: false, next: false, confirm: false });

  const [confirmModal, setConfirmModal] = useState(null);

  /* ── Toast ── */
  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  /* ── Cargar datos ── */
  const loadUserData = useCallback(async () => {
    if (!user?.id_user) { setLoadingData(false); return; }
    setLoadingData(true);
    try {
      const d = await getMyUser();
      const norm = {
        username:      d.username       || "",
        name:          d.name           || "",
        lastname:      d.lastname       || "",
        email:         d.email          || "",
        recoveryEmail: d.recovery_email || "",
        phone:         d.phone          || "",
      };
      setOriginalData(norm);
      setFormData({ ...norm, password: "" });
    } catch {
      showToast("No se pudo cargar tu información. Intentá de nuevo.", "error");
    } finally {
      setLoadingData(false);
    }
  }, [user?.id_user, showToast]);

  useEffect(() => { loadUserData(); }, [loadUserData]);

  /* ── Errores en tiempo real ── */
  const errors = useMemo(() => {
    const e = {};
    Object.keys(RULES).forEach((k) => {
      if (k === "password" && !formData.password) return;
      const err = RULES[k].validate?.(formData[k]?.trim?.() ?? formData[k], formData);
      if (err) e[k] = err;
    });
    return e;
  }, [formData]);

  const isFormValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const hasUnsavedChanges = useMemo(() => {
    if (!originalData) return false;
    return Object.keys(originalData).some((k) => formData[k] !== originalData[k])
      || !!formData.password?.trim();
  }, [formData, originalData]);

  /* ── Handlers de inputs ── */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    const max = RULES[name]?.max;
    setFormData((p) => ({ ...p, [name]: max ? value.slice(0, max) : value }));
    setTouched((p) => ({ ...p, [name]: true }));
  }, []);

  const handleBlur = useCallback((e) => {
    setTouched((p) => ({ ...p, [e.target.name]: true }));
  }, []);

  const handleUndoField = useCallback((name) => {
    setFormData((p) => ({ ...p, [name]: originalData[name] }));
    setTouched((p) => ({ ...p, [name]: false }));
  }, [originalData]);

  const handleCancel = useCallback(() => {
    setFormData({ ...originalData, password: "" });
    setIsEditing(false);
    setTouched({});
  }, [originalData]);

  /* ── Guardar ── */
  const handleSave = useCallback(() => {
    const allTouched = {};
    Object.keys(RULES).forEach((k) => { allTouched[k] = true; });
    setTouched(allTouched);

    if (!isFormValid) {
      showToast("Corregí los errores marcados antes de guardar.", "error");
      return;
    }
    const dataToSend = {};
    Object.keys(originalData).forEach((k) => {
      const nv = formData[k]?.trim?.() ?? formData[k];
      if (nv !== originalData[k]) dataToSend[k] = nv;
    });
    if (formData.password?.trim()) dataToSend.password = formData.password.trim();
    if (!Object.keys(dataToSend).length) {
      showToast("No hay cambios para guardar.", "error"); return;
    }
    if (dataToSend.email) { setConfirmModal(dataToSend); return; }
    doSave(dataToSend);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, originalData, isFormValid, showToast]);

  // En doSave, filtrar campos que el backend no acepta
  const doSave = useCallback(async (data) => {
    setLoading(true);

    // Campos que acepta UserDto (única fuente de verdad del contrato)
    const ALLOWED_FIELDS = ['name', 'lastname', 'email', 'recoveryEmail', 'phone', 'password'];

    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => ALLOWED_FIELDS.includes(key))
    );

    try {
      const updated = await updateUser(filteredData); // ahora devuelve UserDto fresco
      if (updateUserContext) updateUserContext(updated);
      await loadUserData();
      setIsEditing(false);
      setTouched({});
      showToast("¡Perfil actualizado correctamente!");
    } catch {
      showToast("No se pudieron guardar los cambios. Intentá de nuevo.", "error");
    } finally {
      setLoading(false);
    }
  }, [user?.id_user, updateUserContext, loadUserData, showToast]);

  /* ── Cambio de contraseña ── */
  const handlePwChange = useCallback(async () => {
    if (!pwData.current || !pwData.next || !pwData.confirm) {
      showToast("Completá todos los campos de contraseña.", "error"); return;
    }
    if (pwData.next !== pwData.confirm) {
      showToast("Las contraseñas nuevas no coinciden.", "error"); return;
    }
    const err = RULES.password.validate(pwData.next);
    if (err) { showToast(err, "error"); return; }
    setLoading(true);
    try {
      await updateUser({ password: pwData.next });
      showToast("¡Contraseña actualizada correctamente!");
      setShowPwSection(false);
      setPwData({ current: "", next: "", confirm: "" });
    } catch {
      showToast("No se pudo cambiar la contraseña. Intentá de nuevo.", "error");
    } finally {
      setLoading(false);
    }
  }, [pwData, user?.id_user, showToast]);

  /* ── Guard: salir con cambios ── */
  useEffect(() => {
    const warn = (e) => {
      if (isEditing && hasUnsavedChanges) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isEditing, hasUnsavedChanges]);

  /* ── Helper estado visual de campo ── */
  const fState = (name) => {
    if (!touched[name]) return "idle";
    if (errors[name])   return "error";
    if (formData[name]) return "success";
    return "idle";
  };

  /* ── Estados de carga / sin sesión ── */
  if (loadingData) return (
    <div className={styles.page}>
      <div className={styles.centerScreen}>
        <div className={styles.spinner} />
        <p>Cargando tu perfil…</p>
      </div>
    </div>
  );

  if (!user) return (
    <div className={styles.page}>
      <div className={styles.centerScreen}>
        <AlertCircle size={36} style={{ color: "#B00020" }} />
        <p>No hay sesión activa. Por favor iniciá sesión.</p>
      </div>
    </div>
  );

  const displayName = [formData.name, formData.lastname].filter(Boolean).join(" ") || user?.name || "Mi cuenta";
  const initial = displayName.charAt(0).toUpperCase();

  /* ── Config de filas de campos ── */
  const FIELD_ROWS = [
    [
      { key: "name",     label: "Nombre",           icon: User,   type: "text",  ph: "Tu nombre",            req: false },
      { key: "lastname", label: "Apellido",          icon: User,   type: "text",  ph: "Tu apellido",          req: false },
    ],
    [
      { key: "username", label: "Nombre de usuario", icon: AtSign, type: "text",  ph: "ej: usuario_123",      req: false },
      { key: "phone",    label: "Teléfono",           icon: Phone,  type: "tel",   ph: "(364) 4123456",        req: false },
    ],
    [
      { key: "email",         label: "Email principal",       icon: Mail, type: "email", ph: "vos@ejemplo.com",          req: true  },
      { key: "recoveryEmail", label: "Email de recuperación", icon: Mail, type: "email", ph: "recuperacion@ejemplo.com", req: false },
    ],
  ];

  return (
    <div className={styles.page}>

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${styles["toast_" + toast.type]}`}>
          {toast.type === "success" ? <Check size={15} /> : <AlertCircle size={15} />}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className={styles.toastClose}><X size={13} /></button>
        </div>
      )}

      <div className={styles.layout}>

        {/* ════ SIDEBAR ════ */}
        <aside className={styles.sidebar}>
          <div className={styles.avatarRing}>
            <div className={styles.avatarCircle}>{initial}</div>
          </div>

          <h2 className={styles.sidebarName}>{displayName}</h2>
          <p  className={styles.sidebarEmail}>{user.email}</p>

          <div className={styles.sidebarBtns}>
            {!isEditing ? (
              <button className={styles.btnPrimary} onClick={() => setIsEditing(true)} disabled={loading}>
                <Edit2 size={14} /> Editar perfil
              </button>
            ) : (
              <>
                <button
                  className={styles.btnSave}
                  onClick={handleSave}
                  disabled={loading || !hasUnsavedChanges}
                >
                  {loading
                    ? <><Loader size={14} className={styles.spin} /> Guardando…</>
                    : <><Save   size={14} /> Guardar cambios</>
                  }
                </button>
                <button className={styles.btnCancel} onClick={handleCancel} disabled={loading}>
                  <X size={14} /> Descartar cambios
                </button>
              </>
            )}
          </div>

          {isEditing && hasUnsavedChanges && (
            <div className={styles.pendingBadge}>
              <span className={styles.pendingDot} />
              Cambios sin guardar
            </div>
          )}

          {isEditing && (
            <p className={styles.requiredHint}>
              <span className={styles.req}>*</span> campos obligatorios
            </p>
          )}
        </aside>

        {/* ════ MAIN ════ */}
        <main className={styles.main}>

          {/* Sección info personal */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <User size={16} />
              <h3>Información personal</h3>
            </div>

            <div className={styles.formBody}>
              {FIELD_ROWS.map((row, ri) => (
                <div key={ri} className={styles.fieldRow}>
                  {row.map(({ key, label, icon: Icon, type, ph, req }) => {
                    const state   = fState(key);
                    const val     = formData[key] || "";
                    const changed = isEditing && originalData?.[key] !== formData[key];

                    return (
                      <div key={key} className={styles.field}>
                        <label className={styles.label}>
                          <Icon size={12} />
                          {label}
                          {req && <span className={styles.req}>*</span>}
                          {isEditing && changed && <span className={styles.modDot} title="Modificado" />}
                        </label>

                        {isEditing ? (
                          <>
                            <div className={`${styles.inputWrap} ${styles["iw_" + state]}`}>
                              <input
                                type={type}
                                name={key}
                                value={val}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={styles.input}
                                placeholder={ph}
                                disabled={loading}
                                maxLength={RULES[key]?.max}
                                aria-required={req}
                                aria-invalid={state === "error"}
                              />
                              <span className={styles.stateIcon}>
                                {state === "success" && <Check       size={13} />}
                                {state === "error"   && <AlertCircle size={13} />}
                              </span>
                            </div>

                            {state === "error" && errors[key] && (
                              <p className={styles.fieldError} role="alert">
                                <AlertCircle size={11} /> {errors[key]}
                              </p>
                            )}

                            <div className={styles.fieldFooter}>
                              {RULES[key]?.max && (
                                <span className={`${styles.charCount} ${val.length >= RULES[key].max * 0.88 ? styles.charNear : ""}`}>
                                  {val.length}/{RULES[key].max}
                                </span>
                              )}
                              {changed && (
                                <button className={styles.undoBtn} onClick={() => handleUndoField(key)} type="button">
                                  <RotateCcw size={11} /> Restaurar
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className={`${styles.valueDisplay} ${!val ? styles.emptyVal : ""}`}>
                            {val || "Sin especificar"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Nueva contraseña — solo en edición */}
              {isEditing && (
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.label}>
                      <Lock size={12} />
                      Nueva contraseña
                      <span className={styles.optTag}>opcional</span>
                      {formData.password && <span className={styles.modDot} />}
                    </label>

                    <div className={`${styles.inputWrap} ${styles["iw_" + fState("password")]}`}>
                      <input
                        type={pwVisible ? "text" : "password"}
                        name="password"
                        value={formData.password || ""}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={styles.input}
                        placeholder="Mínimo 8 caracteres"
                        disabled={loading}
                        maxLength={100}
                        autoComplete="new-password"
                      />
                      <button type="button" className={styles.eyeBtn} onClick={() => setPwVisible((p) => !p)} tabIndex={-1}>
                        {pwVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>

                    {touched.password && errors.password && (
                      <p className={styles.fieldError} role="alert">
                        <AlertCircle size={11} /> {errors.password}
                      </p>
                    )}

                    {formData.password && (() => {
                      const s = RULES.password.strength(formData.password);
                      return (
                        <div className={styles.strengthRow}>
                          <div className={styles.strengthBar}>
                            <div className={`${styles.strengthFill} ${styles["sf_" + s.level]}`} />
                          </div>
                          <span className={`${styles.strengthLbl} ${styles["sl_" + s.level]}`}>{s.label}</span>
                        </div>
                      );
                    })()}

                    <div className={styles.fieldFooter}>
                      {formData.password && (
                        <button className={styles.undoBtn} onClick={() => {
                          setFormData((p) => ({ ...p, password: "" }));
                          setTouched((p) => ({ ...p, password: false }));
                        }} type="button">
                          <X size={11} /> Limpiar
                        </button>
                      )}
                    </div>
                  </div>
                  <div className={styles.field} /> {/* celda vacía grid 2-col */}
                </div>
              )}
            </div>
          </section>

          {/* Sección seguridad — solo vista */}
          {!isEditing && (
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <Shield size={16} />
                <h3>Seguridad</h3>
              </div>

              {!showPwSection ? (
                <button className={styles.btnOutline} onClick={() => setShowPwSection(true)}>
                  <Lock size={13} /> Cambiar contraseña
                </button>
              ) : (
                <div className={styles.pwForm}>
                  {[
                    { key: "current", label: "Contraseña actual"          },
                    { key: "next",    label: "Nueva contraseña"           },
                    { key: "confirm", label: "Confirmar nueva contraseña" },
                  ].map(({ key, label }) => (
                    <div key={key} className={styles.field}>
                      <label className={styles.label}>
                        <Lock size={12} /> {label} <span className={styles.req}>*</span>
                      </label>
                      <div className={styles.inputWrap}>
                        <input
                          type={pwVis[key] ? "text" : "password"}
                          value={pwData[key]}
                          onChange={(e) => setPwData((p) => ({ ...p, [key]: e.target.value }))}
                          className={styles.input}
                          placeholder={label}
                          maxLength={100}
                          autoComplete={key === "current" ? "current-password" : "new-password"}
                        />
                        <button type="button" className={styles.eyeBtn}
                          onClick={() => setPwVis((p) => ({ ...p, [key]: !p[key] }))} tabIndex={-1}>
                          {pwVis[key] ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>
                  ))}

                  {pwData.confirm && (
                    <div className={`${styles.pwMatch} ${pwData.next === pwData.confirm ? styles.pwOk : styles.pwFail}`}>
                      {pwData.next === pwData.confirm
                        ? <><Check size={12} /> Las contraseñas coinciden</>
                        : <><X     size={12} /> Las contraseñas no coinciden</>
                      }
                    </div>
                  )}

                  {pwData.next && (() => {
                    const s = RULES.password.strength(pwData.next);
                    return (
                      <div className={styles.strengthRow}>
                        <div className={styles.strengthBar}>
                          <div className={`${styles.strengthFill} ${styles["sf_" + s.level]}`} />
                        </div>
                        <span className={`${styles.strengthLbl} ${styles["sl_" + s.level]}`}>{s.label}</span>
                      </div>
                    );
                  })()}

                  <div className={styles.pwActions}>
                    <button className={styles.btnSave} onClick={handlePwChange} disabled={loading}>
                      {loading
                        ? <><Loader size={13} className={styles.spin} /> Guardando…</>
                        : <><Check  size={13} /> Actualizar contraseña</>
                      }
                    </button>
                    <button className={styles.btnCancel} disabled={loading}
                      onClick={() => { setShowPwSection(false); setPwData({ current: "", next: "", confirm: "" }); }}>
                      <X size={13} /> Cancelar
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* Modal confirmación cambio de email */}
      {confirmModal && (
        <div className={styles.overlay} onClick={() => setConfirmModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIconWrap}><AlertCircle size={28} /></div>
            <h3 className={styles.modalTitle}>Confirmá el cambio de email</h3>
            <p className={styles.modalDesc}>
              Tu email es tu clave de acceso. Asegurate de tener acceso al nuevo antes de confirmar.
            </p>

            <div className={styles.emailDiff}>
              <div className={styles.emailBox}>
                <span className={styles.emailTag}>Actual</span>
                <span className={styles.emailOld}>{originalData?.email}</span>
              </div>
              <RefreshCw size={15} className={styles.emailArrow} />
              <div className={styles.emailBox}>
                <span className={styles.emailTag}>Nuevo</span>
                <span className={styles.emailNew}>{confirmModal?.email}</span>
              </div>
            </div>

            <div className={styles.infoBox}>
              <Info size={15} />
              <p>A partir del cambio usarás el nuevo email para iniciar sesión.</p>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnSave} onClick={() => { const d = confirmModal; setConfirmModal(null); doSave(d); }}>
                <Check size={14} /> Confirmar cambio
              </button>
              <button className={styles.btnCancel} onClick={() => setConfirmModal(null)}>
                <X size={14} /> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}