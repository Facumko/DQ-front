import React, { useContext, useState, useEffect, useCallback, useMemo } from "react";
import { UserContext } from "../../pages/UserContext";
import { getUserById, updateUser } from "../../Api/Api";
import styles from "./Profile.module.css";
import { 
  User, Mail, Phone, Edit2, Save, X, Lock, Check, AlertCircle, 
  Loader, Eye, EyeOff, RefreshCw, Shield, Info 
} from "lucide-react";

const Profile = () => {
  const { user, updateUserContext, logout } = useContext(UserContext);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); // VUELTO: Mensaje de error inline
  const [success, setSuccess] = useState(""); // VUELTO: Mensaje de éxito inline
  const [loadingData, setLoadingData] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Estados de datos
  const [originalData, setOriginalData] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    lastname: "",
    email: "",
    recoveryEmail: "",
    phone: "",
    password: ""
  });

  // Estado de validación
  const [validationStatus, setValidationStatus] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Estado contraseña
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(null);

  // ============================================
  // VALIDACIONES
  // ============================================

  const VALIDATIONS = useMemo(() => ({
    email: {
      min: 5,
      max: 100,
      pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: 'Email inválido (ej: usuario@ejemplo.com)',
      required: true
    },
    recoveryEmail: {
      min: 5,
      max: 100,
      pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: 'Formato de email inválido',
      required: false,
      customValidation: (value, allData) => {
        if (value && value === allData.email) {
          return 'Debe ser diferente al email principal';
        }
        return null;
      }
    },
    username: {
      min: 3,
      max: 25,
      pattern: /^[a-zA-Z0-9_-]+$/,
      message: '3-25 caracteres (letras, números, _ y -)',
      required: false
    },
    name: {
      min: 2,
      max: 45,
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      message: '2-45 caracteres (solo letras)',
      required: false
    },
    lastname: {
      min: 2,
      max: 45,
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      message: '2-45 caracteres (solo letras)',
      required: false
    },
    phone: {
      min: 10,
      max: 10,
      pattern: /^[\d\s+()-]+$/,
      message: '10 caracteres (ej: (364) 4123456)',
      required: false
    },
    password: {
      min: 8,
      max: 100,
      message: 'Mínimo 8 caracteres',
      required: false,
      validateStrength: (value) => {
        if (!value) return null;
        const hasUpper = /[A-Z]/.test(value);
        const hasLower = /[a-z]/.test(value);
        const hasNumber = /\d/.test(value);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
        
        if (value.length < 8) return { level: 'weak', message: 'Muy débil: mínimo 8 caracteres' };
        if (hasUpper && hasLower && hasNumber && hasSpecial && value.length >= 12) {
          return { level: 'strong', message: 'Muy fuerte' };
        }
        if ((hasUpper || hasLower) && hasNumber && value.length >= 8) {
          return { level: 'medium', message: 'Media' };
        }
        return { level: 'weak', message: 'Débil: usa mayúsculas, números y símbolos' };
      }
    }
  }), []);

  // Validar campo individual
  const validateField = useCallback((fieldName, value, allFormData) => {
    const rules = VALIDATIONS[fieldName];
    if (!rules) return { isValid: true, error: null, status: 'valid' };

    const trimmedValue = value?.trim() || '';
    let error = null;
    
    // Campo obligatorio
    if (rules.required && trimmedValue === '') {
      error = `El campo es requerido`;
    }
    
    // Validación personalizada
    if (!error && rules.customValidation && allFormData) {
      error = rules.customValidation(trimmedValue, allFormData);
    }
    
    // Longitud mínima
    if (!error && rules.min && trimmedValue.length < rules.min) {
      error = `Mínimo ${rules.min} caracteres`;
    }
    
    // Longitud máxima (ya no debería pasar por el truncado, pero lo mantenemos)
    if (!error && rules.max && trimmedValue.length > rules.max) {
      error = `Máximo ${rules.max} caracteres`;
    }
    
    // Patrón
    if (!error && rules.pattern && trimmedValue && !rules.pattern.test(trimmedValue)) {
      error = rules.message;
    }

    // Fortaleza contraseña
    let strength = null;
    if (!error && rules.validateStrength && trimmedValue) {
      strength = rules.validateStrength(trimmedValue);
    }

    return {
      isValid: !error,
      error,
      status: error ? 'error' : trimmedValue ? 'success' : 'idle',
      strength
    };
  }, [VALIDATIONS]);

  // Validar todos los campos
  const validateAllFields = useCallback((data) => {
    const results = {};
    let isValid = true;

    Object.keys(data).forEach(key => {
      if (key === 'password' && !data[key]) return;
      const result = validateField(key, data[key], data);
      results[key] = result;
      if (!result.isValid) isValid = false;
    });

    return { results, isValid };
  }, [validateField]);

  // ============================================
  // CARGAR DATOS
  // ============================================

  const showNotification = useCallback((message, type = 'error') => {
    // VUELTO: Usar el sistema de notificación inline original
    if (type === 'success') {
      setSuccess(message);
      setError(""); // Limpiar error si hay éxito
      setTimeout(() => setSuccess(""), 4000);
    } else {
      setError(message);
      setSuccess(""); // Limpiar éxito si hay error
      setTimeout(() => setError(""), 4000);
    }
  }, []);

  const loadUserData = useCallback(async (isRetry = false) => {
    if (!user?.id_user) {
      setLoadingData(false);
      setError("No hay usuario autenticado");
      return;
    }

    setLoadingData(true);
    setError(""); // Limpiar errores al cargar

    try {
      const userData = await getUserById(user.id_user);
      
      if (!userData.email) throw new Error("Datos incompletos del servidor");

      const normalized = {
        username: userData.username || "",
        name: userData.name || "",
        lastname: userData.lastname || "",
        email: userData.email || "",
        recoveryEmail: userData.recovery_email || "",
        phone: userData.phone || ""
      };

      setOriginalData(normalized);
      setFormData({ ...normalized, password: "" });
      if (isRetry) setRetryCount(0);
      
    } catch (err) {
      console.error("Error al cargar:", err);
      setError("Error al cargar datos. Intenta nuevamente.");
    } finally {
      setLoadingData(false);
    }
  }, [user?.id_user]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // ============================================
  // MANEJO DE INPUTS
  // ============================================

  // NUEVO: Función para truncar automáticamente al máximo
  const truncateValue = (fieldName, value) => {
    const rules = VALIDATIONS[fieldName];
    if (!rules || !value) return value;
    
    // Si el valor excede el máximo, truncarlo
    if (rules.max && value.length > rules.max) {
      return value.substring(0, rules.max);
    }
    return value;
  };

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // NUEVO: Truncar automáticamente si excede el máximo
    const truncatedValue = truncateValue(name, value);
    
    setFormData(prev => {
      const newData = { ...prev, [name]: truncatedValue };
      
      // Validar con debounce
      setTimeout(() => {
        const result = validateField(name, truncatedValue, newData);
        setValidationStatus(prev => ({ ...prev, [name]: result }));
        setFieldErrors(prev => ({ ...prev, [name]: result.error }));
      }, 300);

      return newData;
    });

    // Limpiar mensajes al editar
    if (error) setError("");
    if (success) setSuccess("");
  }, [validateField, error, success]);

  const handleUndoField = useCallback((fieldName) => {
    setFormData(prev => ({ ...prev, [fieldName]: originalData[fieldName] }));
    setValidationStatus(prev => ({ ...prev, [fieldName]: { isValid: true, error: null, status: 'idle' } }));
    setFieldErrors(prev => ({ ...prev, [fieldName]: null }));
  }, [originalData]);

  // ============================================
  // GUARDAR CAMBIOS
  // ============================================

  const hasUnsavedChanges = useMemo(() => {
    if (!originalData) return false;
    return Object.keys(originalData).some(key => 
      formData[key] !== originalData[key]
    ) || (formData.password && formData.password.trim() !== "");
  }, [formData, originalData]);

  const handleSave = useCallback(async () => {
    if (!originalData) return;

    // Validar todos los campos
    const validation = validateAllFields(formData);
    setValidationStatus(validation.results);
    
    if (!validation.isValid) {
      setError("Corrige los errores antes de guardar");
      return;
    }

    // Preparar datos modificados
    const dataToSend = {};
    let hasChanges = false;

    Object.keys(originalData).forEach(key => {
      const newValue = formData[key]?.trim();
      if (newValue !== originalData[key] && newValue) {
        dataToSend[key] = newValue;
        hasChanges = true;
      }
    });

    if (formData.password?.trim()) {
      dataToSend.password = formData.password;
      hasChanges = true;
    }

    if (!hasChanges) {
      setError("No hay cambios para guardar");
      return;
    }

    // Confirmación especial para email
    if (dataToSend.email) {
      setPendingChanges(dataToSend);
      setShowConfirmModal(true);
      return;
    }

    await saveChanges(dataToSend);
  }, [formData, originalData, validateAllFields]);

  const saveChanges = useCallback(async (dataToSend) => {
    setLoading(true);
    try {
      const updatedUser = await updateUser(user.id_user, dataToSend);
      
      if (updateUserContext) updateUserContext(updatedUser);
      
      await loadUserData();
      setIsEditing(false);
      setFormData(prev => ({ ...prev, password: "" }));
      setValidationStatus({});
      setSuccess("✅ Datos actualizados correctamente"); // VUELTO: Mensaje inline
      
    } catch (err) {
      console.error("Error al actualizar:", err);
      setError("Error al guardar. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [user.id_user, updateUserContext, loadUserData]);

  const confirmSave = useCallback(() => {
    setShowConfirmModal(false);
    saveChanges(pendingChanges);
    setPendingChanges(null);
  }, [pendingChanges, saveChanges]);

  const cancelSave = useCallback(() => {
    setShowConfirmModal(false);
    setPendingChanges(null);
  }, []);

  const handleCancel = useCallback(() => {
    setFormData({ ...originalData, password: "" });
    setIsEditing(false);
    setValidationStatus({});
    setFieldErrors({});
    setError("");
    setSuccess("");
  }, [originalData]);

  // ============================================
  // CONTRASEÑA
  // ============================================

  const handlePasswordChange = useCallback(async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Todos los campos son obligatorios");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }

    const result = validateField('password', newPassword);
    if (!result.isValid) {
      setError(result.error);
      return;
    }

    setLoading(true);
    try {
      await updateUser(user.id_user, { password: newPassword });
      setSuccess("✅ Contraseña actualizada correctamente");
      setShowPasswordChange(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError("Error al cambiar contraseña");
    } finally {
      setLoading(false);
    }
  }, [passwordData, user.id_user, validateField]);

  // Alerta al salir con cambios
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isEditing && hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditing, hasUnsavedChanges]);

  // ============================================
  // RENDER
  // ============================================

  if (loadingData) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div className={styles.spinner}></div>
            <p style={{ marginTop: "1rem", color: "#666" }}>
              Cargando información del usuario...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ color: "#dc2626", fontSize: "1.1rem" }}>
              No hay sesión activa. Por favor inicia sesión.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getFieldStatus = (fieldName) => {
    const status = validationStatus[fieldName]?.status;
    if (status === 'success') return styles.inputSuccess;
    if (status === 'error') return styles.inputError;
    return '';
  };

  const getFieldIcon = (fieldName) => {
    const status = validationStatus[fieldName]?.status;
    if (status === 'success') return <Check size={18} className={styles.successIcon} />;
    if (status === 'error') return <AlertCircle size={18} className={styles.errorIcon} />;
    return null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>
              <User size={48} />
            </div>
            <div className={styles.userInfo}>
              <h1 className={styles.title}>Mi Cuenta</h1>
              <p className={styles.subtitle}>Gestiona tu información personal</p>
            </div>
          </div>
          
          {!isEditing ? (
            <button 
              className={styles.editButton} 
              onClick={() => setIsEditing(true)}
              disabled={loading}
            >
              <Edit2 size={18} />
              Editar
            </button>
          ) : (
            <div className={styles.editActions}>
              <button 
                className={`${styles.saveButton} ${!hasUnsavedChanges ? styles.disabled : ''}`}
                onClick={handleSave}
                disabled={loading || !hasUnsavedChanges}
              >
                {loading ? <Loader size={18} className={styles.spinnerIcon} /> : <Save size={18} />}
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
              <button 
                className={styles.cancelButton} 
                onClick={handleCancel}
                disabled={loading}
              >
                <X size={18} />
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Mensajes de error y éxito (VUELTO AL SISTEMA ORIGINAL) */}
        {error && (
          <div className={styles.errorMessage}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className={styles.successMessage}>
            <Check size={18} />
            {success}
          </div>
        )}

        {/* Indicador de cambios */}
        {isEditing && hasUnsavedChanges && (
          <div className={styles.infoMessage}>
            <AlertCircle size={18} />
            Tienes cambios sin guardar
          </div>
        )}

        {/* Formulario */}
        <div className={styles.form}>
          {[
            { key: 'username', label: 'Nombre de usuario', icon: User, type: 'text', placeholder: 'Ej: usuario123' },
            { key: 'name', label: 'Nombre', icon: User, type: 'text', placeholder: 'Ej: Juan' },
            { key: 'lastname', label: 'Apellido', icon: User, type: 'text', placeholder: 'Ej: Pérez' },
            { key: 'email', label: 'Correo electrónico', icon: Mail, type: 'email', placeholder: 'Ej: usuario@ejemplo.com', required: true },
            { key: 'recoveryEmail', label: 'Correo de recuperación', icon: Mail, type: 'email', placeholder: 'Ej: recuperacion@ejemplo.com' },
            { key: 'phone', label: 'Teléfono', icon: Phone, type: 'tel', placeholder: 'Ej: +34 123 456 789' }
          ].map(field => (
            <div key={field.key} className={styles.field}>
              <label className={styles.label}>
                <field.icon size={18} />
                {field.label}
                {field.required && <span className={styles.requiredBadge}>*</span>}
                {isEditing && (
                  <span className={styles.charCount}>
                    {formData[field.key]?.length || 0}/{VALIDATIONS[field.key].max}
                  </span>
                )}
                {isEditing && originalData?.[field.key] !== formData[field.key] && formData[field.key] && (
                  <span className={styles.modifiedDot}>●</span>
                )}
              </label>
              
              {isEditing ? (
                <div className={styles.inputWrapper}>
                  <input
                    type={field.type}
                    name={field.key}
                    value={formData[field.key] || ''}
                    onChange={handleInputChange}
                    className={`${styles.input} ${getFieldStatus(field.key)}`}
                    placeholder={field.placeholder}
                    disabled={loading}
                    aria-invalid={validationStatus[field.key]?.status === 'error'}
                    aria-describedby={`${field.key}-error`}
                    maxLength={VALIDATIONS[field.key].max} // NUEVO: Límite estricto
                  />
                  {getFieldIcon(field.key)}
                </div>
              ) : (
                <p className={`${styles.value} ${!formData[field.key] ? styles.empty : ''}`}>
                  {formData[field.key] || "Sin especificar"}
                </p>
              )}

              {isEditing && validationStatus[field.key]?.error && (
                <span id={`${field.key}-error`} className={styles.fieldError}>
                  {validationStatus[field.key].error}
                </span>
              )}

              {isEditing && originalData?.[field.key] !== formData[field.key] && formData[field.key] && (
                <button 
                  className={styles.undoButton}
                  onClick={() => handleUndoField(field.key)}
                  type="button"
                >
                  <RefreshCw size={14} />
                  Restaurar
                </button>
              )}
            </div>
          ))}

          {/* Campo de contraseña (solo edición) */}
          {isEditing && (
            <div className={styles.field}>
              <label className={styles.label}>
                <Lock size={18} />
                Nueva contraseña (opcional)
                {formData.password && formData.password.trim() !== "" && (
                  <span className={styles.modifiedDot}>●</span>
                )}
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type="password"
                  name="password"
                  value={formData.password || ''}
                  onChange={handleInputChange}
                  className={`${styles.input} ${getFieldStatus('password')}`}
                  placeholder="Mínimo 8 caracteres"
                  disabled={loading}
                  maxLength={VALIDATIONS.password.max} // NUEVO: Límite estricto
                />
                {formData.password && (
                  <span className={`${styles.strengthBadge} ${styles[validationStatus.password?.strength?.level]}`}>
                    {validationStatus.password?.strength?.message}
                  </span>
                )}
              </div>
              {validationStatus.password?.error && (
                <span className={styles.fieldError}>
                  {validationStatus.password.error}
                </span>
              )}
              {originalData && formData.password && (
                <button 
                  className={styles.undoButton}
                  onClick={() => handleUndoField('password')}
                  type="button"
                >
                  <X size={14} />
                  Limpiar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sección de seguridad */}
        {!isEditing && (
          <div className={styles.securitySection}>
            <h2 className={styles.sectionTitle}>
              <Shield size={22} />
              Seguridad
            </h2>
            
            {!showPasswordChange ? (
              <button 
                className={styles.changePasswordButton}
                onClick={() => setShowPasswordChange(true)}
              >
                <Lock size={18} />
                Cambiar contraseña
              </button>
            ) : (
              <div className={styles.passwordForm}>
                {['currentPassword', 'newPassword', 'confirmPassword'].map((field, idx) => {
                  const labels = {
                    currentPassword: 'Contraseña actual',
                    newPassword: 'Nueva contraseña',
                    confirmPassword: 'Confirmar nueva contraseña'
                  };
                  const isVisible = passwordVisibility[field.replace('Password', '')];
                  
                  return (
                    <div key={field} className={styles.field}>
                      <label className={styles.label}>{labels[field]}</label>
                      <div className={styles.inputWrapper}>
                        <input
                          type={isVisible ? 'text' : 'password'}
                          value={passwordData[field]}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, [field]: e.target.value }))}
                          className={styles.input}
                          placeholder={labels[field]}
                          maxLength={VALIDATIONS.password.max} // NUEVO: Límite estricto
                        />
                        <button
                          type="button"
                          className={styles.togglePassword}
                          onClick={() => setPasswordVisibility(prev => ({ 
                            ...prev, 
                            [field.replace('Password', '')]: !prev[field.replace('Password', '')] 
                          }))}
                        >
                          {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {passwordData.confirmPassword && (
                  <div className={`${styles.passwordMatch} ${
                    passwordData.newPassword === passwordData.confirmPassword ? styles.match : styles.mismatch
                  }`}>
                    {passwordData.newPassword === passwordData.confirmPassword ? (
                      <><Check size={16} /> Las contraseñas coinciden</>
                    ) : (
                      <><X size={16} /> Las contraseñas no coinciden</>
                    )}
                  </div>
                )}

                <div className={styles.passwordActions}>
                  <button 
                    className={styles.saveButton}
                    onClick={handlePasswordChange}
                    disabled={loading}
                  >
                    {loading ? <Loader size={18} className={styles.spinnerIcon} /> : 'Actualizar contraseña'}
                  </button>
                  <button 
                    className={styles.cancelButton}
                    onClick={() => {
                      setShowPasswordChange(false);
                      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                    }}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div className={styles.modalOverlay} onClick={cancelSave}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.warningIcon}>
                <AlertCircle size={32} />
              </div>
              <h3>Cambio de email requiere confirmación</h3>
            </div>
            
            <div className={styles.modalBody}>
              <p>Estás a punto de cambiar tu email principal:</p>
              
              <div className={styles.emailComparison}>
                <div className={styles.emailBox}>
                  <span className={styles.emailLabel}>Actual</span>
                  <span className={styles.oldEmail}>{originalData?.email}</span>
                </div>
                <div className={styles.arrowIcon}>
                  <RefreshCw size={20} />
                </div>
                <div className={styles.emailBox}>
                  <span className={styles.emailLabel}>Nuevo</span>
                  <span className={styles.newEmail}>{pendingChanges?.email}</span>
                </div>
              </div>

              <div className={styles.alertBox}>
                <Info size={20} />
                <p>
                  <strong>Importante:</strong> Usarás este nuevo email para iniciar sesión. 
                  Asegúrate de tener acceso a él.
                </p>
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button className={styles.confirmButton} onClick={confirmSave}>
                <Check size={18} />
                Confirmar cambio
              </button>
              <button className={styles.cancelModalButton} onClick={cancelSave}>
                <X size={18} />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;