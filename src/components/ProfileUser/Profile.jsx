import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../../pages/UserContext";
import { getUserById, updateUser } from "../../Api/Api";
import styles from "./Profile.module.css";
import { User, Mail, Phone, Edit2, Save, X, Lock, Check, AlertCircle, Loader } from "lucide-react";

const Profile = () => {
  const { user, updateUserContext, logout } = useContext(UserContext);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Estado para los datos originales del usuario
  const [originalData, setOriginalData] = useState({
    username: "",
    name: "",
    lastname: "",
    email: "",
    recoveryEmail: "",
    phone: ""
  });

  // Estado para el formulario (datos editables)
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    lastname: "",
    email: "",
    password: "",
    recoveryEmail: "",
    phone: ""
  });

  // Estado para errores de validación por campo
  const [fieldErrors, setFieldErrors] = useState({
    username: "",
    name: "",
    lastname: "",
    email: "",
    recoveryEmail: "",
    phone: "",
    password: ""
  });

  // Estado para cambiar contraseña
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Estado para modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(null);

  // Timer para validación con delay
  const [inputTimer, setInputTimer] = useState(null);

  // ============================================
  // VALIDACIONES
  // ============================================

  const VALIDATIONS = {
    email: {
      max: 100,
      pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
      message: 'Email inválido (máximo 100 caracteres)',
      required: true
    },
    
    recoveryEmail: {
      max: 100,
      pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
      message: 'Email de recuperación inválido (máximo 100 caracteres)',
      required: false,
      customValidation: (value, allFormData) => {
        if (value && value.trim() !== '' && value === allFormData.email) {
          return 'El email de recuperación debe ser diferente al email principal';
        }
        return null;
      }
    },
    
    username: {
      min: 3,
      max: 25,
      pattern: /^[a-zA-Z0-9_-]+$/,
      message: 'Usuario: 3-25 caracteres (letras, números, _ y -)',
      required: false
    },
    
    name: {
      min: 2,
      max: 45,
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      message: 'Nombre: 2-45 caracteres (solo letras)',
      required: false
    },
    
    lastname: {
      min: 2,
      max: 45,
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      message: 'Apellido: 2-45 caracteres (solo letras)',
      required: false
    },
    
    phone: {
      min: 10,
      max: 20,
      pattern: /^[\d\s+()-]+$/,
      message: 'Teléfono: 10-20 caracteres (números, +, -, espacios)',
      required: false
    },
    
    password: {
      min: 8,
      max: 100,
      message: 'Contraseña: mínimo 8 caracteres',
      required: false
    }
  };

  /**
   * Validar un campo individual
   */
  const validateField = (fieldName, value, allFormData = null) => {
    const rules = VALIDATIONS[fieldName];
    if (!rules) return null;
    
    const trimmedValue = value ? value.trim() : '';
    
    // Campo obligatorio vacío
    if (rules.required && trimmedValue === '') {
      return `El ${fieldName === 'email' ? 'email' : 'campo'} no puede estar vacío`;
    }
    
    // Campo opcional vacío = OK
    if (!rules.required && trimmedValue === '') {
      return null;
    }
    
    // Validación personalizada (recovery_email)
    if (rules.customValidation && allFormData) {
      const customError = rules.customValidation(trimmedValue, allFormData);
      if (customError) return customError;
    }
    
    // Validar longitud mínima
    if (rules.min && trimmedValue.length < rules.min) {
      return rules.message;
    }
    
    // Validar longitud máxima
    if (rules.max && trimmedValue.length > rules.max) {
      return rules.message;
    }
    
    // Validar patrón
    if (rules.pattern && !rules.pattern.test(trimmedValue)) {
      return rules.message;
    }
    
    return null;
  };

  /**
   * Parsear errores de la base de datos
   */
  const parseDatabaseError = (errorMessage) => {
    const message = errorMessage.toLowerCase();
    
    // Errores de duplicados (UNIQUE constraint)
    if (message.includes('duplicate') || message.includes('unique')) {
      if (message.includes('username')) {
        return 'El nombre de usuario ya está en uso. Por favor elige otro.';
      }
      if (message.includes('email')) {
        return 'El email ya está registrado. Por favor usa otro.';
      }
      return 'Ya existe un registro con estos datos.';
    }
    
    // Errores de longitud
    if (message.includes('too long') || message.includes('length')) {
      return 'Uno o más campos exceden la longitud permitida.';
    }
    
    // Errores de NOT NULL
    if (message.includes('null') || message.includes('required')) {
      return 'Faltan campos obligatorios. Por favor completa todos los datos requeridos.';
    }
    
    // Errores de tipo ENUM (role)
    if (message.includes('enum') || message.includes('role')) {
      return 'Valor de rol inválido.';
    }
    
    // Errores de foreign key
    if (message.includes('foreign key') || message.includes('subscription')) {
      return 'Error de suscripción. Contacta al administrador.';
    }
    
    return errorMessage;
  };

  /**
   * Normalizar datos antes de enviar
   */
  const normalizeData = (data) => {
    const normalized = {};
    
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string') {
        // Trim + remover espacios múltiples
        normalized[key] = data[key].trim().replace(/\s+/g, ' ');
      } else {
        normalized[key] = data[key];
      }
    });
    
    return normalized;
  };

  // ============================================
  // CARGAR DATOS DEL USUARIO
  // ============================================

  useEffect(() => {
    loadUserData();
  }, [user?.id_user]);

  const loadUserData = async (isRetry = false) => {
    if (!user?.id_user) {
      setLoadingData(false);
      setError("No hay usuario autenticado");
      return;
    }

    setLoadingData(true);
    setError("");

    try {
      console.log("📥 Cargando datos del usuario:", user.id_user);
      const userData = await getUserById(user.id_user);
      console.log("✅ Datos recibidos del backend:", userData);

      // Validar que vengan datos importantes
      if (!userData.email) {
        throw new Error("Datos incompletos recibidos del servidor");
      }

      const normalizedData = {
        username: userData.username || "",
        name: userData.name || "",
        lastname: userData.lastname || "",
        email: userData.email || "",
        recoveryEmail: userData.recovery_email || userData.recoveryEmail || "",
        phone: userData.phone || ""
      };

      console.log("📋 Datos normalizados:", normalizedData);

      setOriginalData(normalizedData);
      setFormData({
        ...normalizedData,
        password: ""
      });
      
      // Reset retry count on success
      if (isRetry) setRetryCount(0);

    } catch (err) {
      console.error("❌ Error al cargar datos:", err);
      const friendlyError = parseDatabaseError(err.message || "No se pudieron cargar los datos del usuario");
      setError(friendlyError);
    } finally {
      setLoadingData(false);
    }
  };

  /**
   * Reintentar carga de datos
   */
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    loadUserData(true);
  };

  // ============================================
  // MANEJO DE INPUTS
  // ============================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Actualizar valor
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar timer anterior
    if (inputTimer) clearTimeout(inputTimer);
    
    // Validar después de 500ms de que dejó de escribir
    const timer = setTimeout(() => {
      const error = validateField(name, value, { ...formData, [name]: value });
      setFieldErrors(prev => ({
        ...prev,
        [name]: error || ""
      }));
    }, 500);
    
    setInputTimer(timer);
    
    // Limpiar mensajes generales al editar
    if (error) setError("");
    if (success) setSuccess("");
  };

  /**
   * Deshacer cambio en un campo específico
   */
  const handleUndoField = (fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: originalData[fieldName]
    }));
    
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: ""
    }));
  };

  // ============================================
  // GUARDAR CAMBIOS
  // ============================================

  const handleSave = async () => {
    setError("");
    setSuccess("");
    
    // 1. Validar todos los campos editados
    const errors = {};
    let hasValidationErrors = false;
    
    Object.keys(formData).forEach(key => {
      if (key === 'password') return; // Validar password aparte
      
      const error = validateField(key, formData[key], formData);
      if (error) {
        errors[key] = error;
        hasValidationErrors = true;
      }
    });
    
    // Validar password si hay valor
    if (formData.password && formData.password.trim() !== "") {
      const passwordError = validateField('password', formData.password);
      if (passwordError) {
        errors.password = passwordError;
        hasValidationErrors = true;
      }
    }
    
    // Si hay errores de validación, mostrarlos
    if (hasValidationErrors) {
      setFieldErrors(errors);
      setError("Por favor corrige los errores antes de guardar");
      return;
    }
    
    // 2. Preparar solo los campos que cambiaron
    const dataToSend = {};
    let hasChanges = false;

    Object.keys(originalData).forEach(key => {
      const newValue = formData[key].trim();
      const oldValue = originalData[key];
      
      if (newValue !== oldValue && newValue !== "") {
        dataToSend[key] = newValue;
        hasChanges = true;
      }
    });

    // Si hay nueva contraseña
    if (formData.password && formData.password.trim() !== "") {
      dataToSend.password = formData.password;
      hasChanges = true;
    }

    // Validar que haya cambios
    if (!hasChanges) {
      setError("No hay cambios para guardar");
      return;
    }

    // 3. Normalizar datos
    const normalizedData = normalizeData(dataToSend);

    // 4. Si cambió el email, pedir confirmación
    if (normalizedData.email && normalizedData.email !== originalData.email) {
      setPendingChanges(normalizedData);
      setShowConfirmModal(true);
      return;
    }

    // 5. Guardar directamente si no cambió email
    await saveChanges(normalizedData);
  };

  /**
   * Guardar cambios (después de validaciones/confirmaciones)
   */
  const saveChanges = async (dataToSend) => {
    setLoading(true);

    try {
      console.log("📤 Enviando solo campos modificados:", dataToSend);

      const updatedUser = await updateUser(user.id_user, dataToSend);
      console.log("✅ Usuario actualizado:", updatedUser);

      // Actualizar contexto
      if (updateUserContext) {
        updateUserContext(updatedUser);
      }

      // Recargar datos del backend
      await loadUserData();

      setSuccess("✅ Datos actualizados correctamente");
      setIsEditing(false);
      
      // Limpiar contraseña
      setFormData(prev => ({ ...prev, password: "" }));
      setFieldErrors({});

      setTimeout(() => setSuccess(""), 4000);

    } catch (err) {
      console.error("❌ Error al actualizar usuario:", err);
      const friendlyError = parseDatabaseError(err.message);
      setError(friendlyError || "Error al actualizar los datos. Por favor intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Confirmar guardado (desde modal)
   */
  const confirmSave = async () => {
    setShowConfirmModal(false);
    await saveChanges(pendingChanges);
    setPendingChanges(null);
  };

  /**
   * Cancelar guardado (desde modal)
   */
  const cancelSave = () => {
    setShowConfirmModal(false);
    setPendingChanges(null);
  };

  /**
   * Cancelar edición
   */
  const handleCancel = () => {
    setFormData({
      ...originalData,
      password: ""
    });
    setIsEditing(false);
    setError("");
    setSuccess("");
    setFieldErrors({});
  };

  // ============================================
  // CAMBIO DE CONTRASEÑA
  // ============================================

  const handlePasswordChange = async () => {
    setError("");
    setSuccess("");

    // Validaciones
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError("Todos los campos de contraseña son obligatorios");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }

    const passwordError = validateField('password', passwordData.newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      // TODO: Endpoint específico para cambiar contraseña que valide la actual
      await updateUser(user.id_user, {
        password: passwordData.newPassword
      });

      setSuccess("✅ Contraseña cambiada correctamente");
      setShowPasswordChange(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error("❌ Error al cambiar contraseña:", err);
      const friendlyError = parseDatabaseError(err.message);
      setError(friendlyError || "Error al cambiar la contraseña. Verifica tu contraseña actual.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Verificar si hay cambios pendientes
   */
  const hasUnsavedChanges = () => {
    return Object.keys(originalData).some(key => 
      formData[key] !== originalData[key]
    ) || (formData.password && formData.password.trim() !== "");
  };

  /**
   * Alerta al salir con cambios sin guardar
   */
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isEditing && hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditing, formData, originalData]);

  // ============================================
  // RENDERIZADO
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

  if (error && !loadingData) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <AlertCircle size={48} color="#dc2626" style={{ marginBottom: "1rem" }} />
            <p style={{ color: "#dc2626", fontSize: "1.1rem", marginBottom: "1rem" }}>
              {error}
            </p>
            <button 
              className={styles.retryButton}
              onClick={handleRetry}
            >
              🔄 Reintentar ({retryCount > 0 ? `Intento ${retryCount + 1}` : 'Cargar datos'})
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header con botón de editar */}
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
                className={styles.saveButton} 
                onClick={handleSave}
                disabled={loading || !hasUnsavedChanges()}
                title={!hasUnsavedChanges() ? "No hay cambios para guardar" : ""}
              >
                {loading ? (
                  <>
                    <Loader size={18} className={styles.spinnerIcon} />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Guardar
                  </>
                )}
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

        {/* Mensajes de error y éxito */}
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

        {/* Indicador de cambios pendientes */}
        {isEditing && hasUnsavedChanges() && (
          <div className={styles.infoMessage}>
            <AlertCircle size={18} />
            Tienes cambios sin guardar
          </div>
        )}

        {/* Formulario de datos */}
        <div className={styles.form}>
          {/* Username */}
          <div className={styles.field}>
            <label className={styles.label}>
              <User size={18} />
              Nombre de usuario
              {isEditing && (
                <span className={styles.charCount}>
                  {formData.username.length}/25
                </span>
              )}
              {isEditing && originalData.username !== formData.username && (
                <span className={styles.modifiedDot}>●</span>
              )}
            </label>
            {isEditing ? (
              <>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`${styles.input} ${fieldErrors.username ? styles.inputError : ''}`}
                  placeholder="Ingresa tu nombre de usuario"
                  disabled={loading}
                />
                {fieldErrors.username && (
                  <span className={styles.fieldError}>{fieldErrors.username}</span>
                )}
                {originalData.username !== formData.username && formData.username && (
                  <button 
                    className={styles.undoButton}
                    onClick={() => handleUndoField('username')}
                    type="button"
                  >
                    <X size={14} /> Deshacer
                  </button>
                )}
              </>
            ) : (
              <p className={styles.value} data-empty={!formData.username}>
                {formData.username || "Sin especificar"}
              </p>
            )}
          </div>

          {/* Name */}
          <div className={styles.field}>
            <label className={styles.label}>
              <User size={18} />
              Nombre
              {isEditing && (
                <span className={styles.charCount}>
                  {formData.name.length}/45
                </span>
              )}
              {isEditing && originalData.name !== formData.name && (
                <span className={styles.modifiedDot}>●</span>
              )}
            </label>
            {isEditing ? (
              <>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`${styles.input} ${fieldErrors.name ? styles.inputError : ''}`}
                  placeholder="Ingresa tu nombre"
                  disabled={loading}
                />
                {fieldErrors.name && (
                  <span className={styles.fieldError}>{fieldErrors.name}</span>
                )}
                {originalData.name !== formData.name && formData.name && (
                  <button 
                    className={styles.undoButton}
                    onClick={() => handleUndoField('name')}
                    type="button"
                  >
                    <X size={14} /> Deshacer
                  </button>
                )}
              </>
            ) : (
              <p className={styles.value} data-empty={!formData.name}>
                {formData.name || "Sin especificar"}
              </p>
            )}
          </div>

          {/* Lastname */}
          <div className={styles.field}>
            <label className={styles.label}>
              <User size={18} />
              Apellido
              {isEditing && (
                <span className={styles.charCount}>
                  {formData.lastname.length}/45
                </span>
              )}
              {isEditing && originalData.lastname !== formData.lastname && (
                <span className={styles.modifiedDot}>●</span>
              )}
            </label>
            {isEditing ? (
              <>
                <input
                  type="text"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleInputChange}
                  className={`${styles.input} ${fieldErrors.lastname ? styles.inputError : ''}`}
                  placeholder="Ingresa tu apellido"
                  disabled={loading}
                />
                {fieldErrors.lastname && (
                  <span className={styles.fieldError}>{fieldErrors.lastname}</span>
                )}
                {originalData.lastname !== formData.lastname && formData.lastname && (
                  <button 
                    className={styles.undoButton}
                    onClick={() => handleUndoField('lastname')}
                    type="button"
                  >
                    <X size={14} /> Deshacer
                  </button>
                )}
              </>
            ) : (
              <p className={styles.value} data-empty={!formData.lastname}>
                {formData.lastname || "Sin especificar"}
              </p>
            )}
          </div>

          {/* Email */}
          <div className={styles.field}>
            <label className={styles.label}>
              <Mail size={18} />
              Correo electrónico
              <span className={styles.requiredBadge}>*</span>
              {isEditing && (
                <span className={styles.charCount}>
                  {formData.email.length}/100
                </span>
              )}
              {isEditing && originalData.email !== formData.email && (
                <span className={styles.modifiedDot}>●</span>
              )}
            </label>
            {isEditing ? (
              <>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
                  placeholder="Ingresa tu correo"
                  disabled={loading}
                />
                {fieldErrors.email && (
                  <span className={styles.fieldError}>{fieldErrors.email}</span>
                )}
                {originalData.email !== formData.email && formData.email && (
                  <button 
                    className={styles.undoButton}
                    onClick={() => handleUndoField('email')}
                    type="button"
                  >
                    <X size={14} /> Deshacer
                  </button>
                )}
              </>
            ) : (
              <p className={styles.value}>{formData.email}</p>
            )}
          </div>

          {/* Recovery Email */}
          <div className={styles.field}>
            <label className={styles.label}>
              <Mail size={18} />
              Correo de recuperación
              {isEditing && (
                <span className={styles.charCount}>
                  {formData.recoveryEmail.length}/100
                </span>
              )}
              {isEditing && originalData.recoveryEmail !== formData.recoveryEmail && (
                <span className={styles.modifiedDot}>●</span>
              )}
            </label>
            {isEditing ? (
              <>
                <input
                  type="email"
                  name="recoveryEmail"
                  value={formData.recoveryEmail}
                  onChange={handleInputChange}
                  className={`${styles.input} ${fieldErrors.recoveryEmail ? styles.inputError : ''}`}
                  placeholder="Ingresa tu correo de recuperación"
                  disabled={loading}
                />
                {fieldErrors.recoveryEmail && (
                  <span className={styles.fieldError}>{fieldErrors.recoveryEmail}</span>
                )}
                {originalData.recoveryEmail !== formData.recoveryEmail && formData.recoveryEmail && (
                  <button 
                    className={styles.undoButton}
                    onClick={() => handleUndoField('recoveryEmail')}
                    type="button"
                  >
                    <X size={14} /> Deshacer
                  </button>
                )}
              </>
            ) : (
              <p className={styles.value} data-empty={!formData.recoveryEmail}>
                {formData.recoveryEmail || "Sin especificar"}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className={styles.field}>
            <label className={styles.label}>
              <Phone size={18} />
              Teléfono
              {isEditing && (
                <span className={styles.charCount}>
                  {formData.phone.length}/20
                </span>
              )}
              {isEditing && originalData.phone !== formData.phone && (
                <span className={styles.modifiedDot}>●</span>
              )}
            </label>
            {isEditing ? (
              <>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`${styles.input} ${fieldErrors.phone ? styles.inputError : ''}`}
                  placeholder="Ingresa tu teléfono"
                  disabled={loading}
                />
                {fieldErrors.phone && (
                  <span className={styles.fieldError}>{fieldErrors.phone}</span>
                )}
                {originalData.phone !== formData.phone && formData.phone && (
                  <button 
                    className={styles.undoButton}
                    onClick={() => handleUndoField('phone')}
                    type="button"
                  >
                    <X size={14} /> Deshacer
                  </button>
                )}
              </>
            ) : (
              <p className={styles.value} data-empty={!formData.phone}>
                {formData.phone || "Sin especificar"}
              </p>
            )}
          </div>

          {/* Password (solo en edición) */}
          {isEditing && (
            <div className={styles.field}>
              <label className={styles.label}>
                <Lock size={18} />
                Nueva contraseña (opcional)
                {formData.password && formData.password.trim() !== "" && (
                  <span className={styles.modifiedDot}>●</span>
                )}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`${styles.input} ${fieldErrors.password ? styles.inputError : ''}`}
                placeholder="Deja en blanco para mantener la actual"
                disabled={loading}
              />
              {fieldErrors.password && (
                <span className={styles.fieldError}>{fieldErrors.password}</span>
              )}
              <p className={styles.hint}>
                Solo completa este campo si deseas cambiar tu contraseña (mínimo 8 caracteres)
              </p>
              {formData.password && formData.password.trim() !== "" && (
                <button 
                  className={styles.undoButton}
                  onClick={() => handleUndoField('password')}
                  type="button"
                >
                  <X size={14} /> Limpiar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sección de seguridad */}
        {!isEditing && (
          <div className={styles.securitySection}>
            <h2 className={styles.sectionTitle}>Seguridad</h2>
            
            {!showPasswordChange ? (
              <button 
                className={styles.changePasswordButton}
                onClick={() => setShowPasswordChange(true)}
              >
                <Lock size={18} />
                Cambiar contraseña
              </button>
            ) : (
              <div className={styles.passwordChangeForm}>
                <div className={styles.warningBox}>
                  <AlertCircle size={18} />
                  <p>
                    ⚠️ Nota: Por el momento no se valida la contraseña actual en el backend. 
                    Asegúrate de recordar tu nueva contraseña.
                  </p>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Contraseña actual</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className={styles.input}
                    placeholder="Ingresa tu contraseña actual"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Nueva contraseña</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className={styles.input}
                    placeholder="Ingresa tu nueva contraseña"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className={styles.input}
                    placeholder="Confirma tu nueva contraseña"
                  />
                </div>

                {passwordData.confirmPassword && (
                  <p style={{ 
                    color: passwordData.newPassword === passwordData.confirmPassword ? "#10b981" : "#dc2626", 
                    fontSize: "0.9rem",
                    margin: "0",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    {passwordData.newPassword === passwordData.confirmPassword 
                      ? <><Check size={16} /> Las contraseñas coinciden</> 
                      : <><X size={16} /> Las contraseñas no coinciden</>}
                  </p>
                )}

                <div className={styles.editActions}>
                  <button 
                    className={styles.saveButton}
                    onClick={handlePasswordChange}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader size={18} className={styles.spinnerIcon} />
                        Cambiando...
                      </>
                    ) : (
                      "Cambiar contraseña"
                    )}
                  </button>
                  <button 
                    className={styles.cancelButton}
                    onClick={() => {
                      setShowPasswordChange(false);
                      setPasswordData({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: ""
                      });
                      setError("");
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

        {/* Modal de confirmación */}
        {showConfirmModal && (
          <div className={styles.modalOverlay} onClick={cancelSave}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <AlertCircle size={32} color="#f59e0b" />
                <h3>⚠️ Confirmar cambio de email</h3>
              </div>
              
              <div className={styles.modalBody}>
                <p>
                  Estás cambiando tu email principal de:
                </p>
                <div className={styles.emailComparison}>
                  <span className={styles.oldEmail}>{originalData.email}</span>
                  <span className={styles.arrow}>→</span>
                  <span className={styles.newEmail}>{pendingChanges?.email}</span>
                </div>
                <p className={styles.modalWarning}>
                  <strong>Importante:</strong> Necesitarás este nuevo email para iniciar sesión en el futuro.
                </p>
              </div>
              
              <div className={styles.modalActions}>
                <button 
                  className={styles.confirmButton}
                  onClick={confirmSave}
                >
                  <Check size={18} />
                  Confirmar cambio
                </button>
                <button 
                  className={styles.cancelModalButton}
                  onClick={cancelSave}
                >
                  <X size={18} />
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;