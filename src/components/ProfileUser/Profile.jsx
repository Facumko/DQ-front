import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../../pages/UserContext";
import { getUserById, updateUser } from "../../Api/Api";
import styles from "./Profile.module.css";
import { User, Mail, Phone, Edit2, Save, X, Lock, Check } from "lucide-react";

const Profile = () => {
  const { user, updateUserContext, logout } = useContext(UserContext);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingData, setLoadingData] = useState(true);

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

  // Estado para cambiar contraseña
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    loadUserData();
  }, [user?.id_user]);

  const loadUserData = async () => {
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

      const normalizedData = {
        username: userData.username || "",
        name: userData.name || "",
        lastname: userData.lastname || "",
        email: userData.email || "",
        recoveryEmail: userData.recovery_email || userData.recoveryEmail || "",
        phone: userData.phone || ""
      };

      console.log("📋 Datos normalizados:", normalizedData);

      // Guardar tanto en original como en form
      setOriginalData(normalizedData);
      setFormData({
        ...normalizedData,
        password: "" // Nunca mostramos la contraseña
      });

    } catch (err) {
      console.error("❌ Error al cargar datos:", err);
      setError(err.message || "No se pudieron cargar los datos del usuario");
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar mensajes al editar
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // ✅ Preparar solo los campos que cambiaron
      const dataToSend = {};
      let hasChanges = false;

      // Comparar cada campo con el original
      Object.keys(originalData).forEach(key => {
        if (formData[key] !== originalData[key] && formData[key].trim() !== "") {
          dataToSend[key] = formData[key];
          hasChanges = true;
        }
      });

      // Si se ingresó una nueva contraseña
      if (formData.password && formData.password.trim() !== "") {
        if (formData.password.length < 6) {
          setError("La contraseña debe tener al menos 6 caracteres");
          setLoading(false);
          return;
        }
        dataToSend.password = formData.password;
        hasChanges = true;
      }

      // Validar que al menos un campo haya cambiado
      if (!hasChanges) {
        setError("No se detectaron cambios para guardar");
        setLoading(false);
        return;
      }

      // Validaciones de campos obligatorios si se están editando
      if (dataToSend.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(dataToSend.email)) {
          setError("Por favor ingresa un email válido");
          setLoading(false);
          return;
        }
      }

      if (dataToSend.recoveryEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(dataToSend.recoveryEmail)) {
          setError("Por favor ingresa un email de recuperación válido");
          setLoading(false);
          return;
        }
      }

      console.log("📤 Enviando solo campos modificados:", dataToSend);

      // Llamar al endpoint de actualización
      const updatedUser = await updateUser(user.id_user, dataToSend);
      console.log("✅ Usuario actualizado:", updatedUser);

      // Actualizar contexto con los nuevos datos
      if (updateUserContext) {
        updateUserContext(updatedUser);
      }

      // Recargar datos del backend para asegurar sincronización
      await loadUserData();

      setSuccess("✅ Datos actualizados correctamente");
      setIsEditing(false);
      
      // Limpiar el campo de contraseña
      setFormData(prev => ({ ...prev, password: "" }));

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(""), 3000);

    } catch (err) {
      console.error("❌ Error al actualizar usuario:", err);
      setError(err.message || "Error al actualizar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Restaurar datos originales
    setFormData({
      ...originalData,
      password: ""
    });
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

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

    if (passwordData.newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      // TODO: Aquí deberías tener un endpoint específico para cambiar contraseña
      // que valide la contraseña actual. Por ahora solo actualizamos.
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

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error al cambiar contraseña:", err);
      setError(err.message || "Error al cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  // Verificar si hay cambios pendientes
  const hasUnsavedChanges = () => {
    return Object.keys(originalData).some(key => 
      formData[key] !== originalData[key]
    ) || (formData.password && formData.password.trim() !== "");
  };

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
                <Save size={18} />
                {loading ? "Guardando..." : "Guardar"}
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
            {error}
          </div>
        )}

        {success && (
          <div className={styles.successMessage}>
            {success}
          </div>
        )}

        {/* Indicador de cambios pendientes */}
        {isEditing && hasUnsavedChanges() && (
          <div className={styles.infoMessage}>
            <Check size={18} />
            Tienes cambios sin guardar
          </div>
        )}

        {/* Formulario de datos */}
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>
              <User size={18} />
              Nombre de usuario
              {isEditing && originalData.username !== formData.username && (
                <span className={styles.changedBadge}>Modificado</span>
              )}
            </label>
            {isEditing ? (
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Ingresa tu nombre de usuario"
                disabled={loading}
              />
            ) : (
              <p className={styles.value}>{formData.username || "No especificado"}</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              <User size={18} />
              Nombre
              {isEditing && originalData.name !== formData.name && (
                <span className={styles.changedBadge}>Modificado</span>
              )}
            </label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Ingresa tu nombre"
                disabled={loading}
              />
            ) : (
              <p className={styles.value}>{formData.name || "No especificado"}</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              <User size={18} />
              Apellido
              {isEditing && originalData.lastname !== formData.lastname && (
                <span className={styles.changedBadge}>Modificado</span>
              )}
            </label>
            {isEditing ? (
              <input
                type="text"
                name="lastname"
                value={formData.lastname}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Ingresa tu apellido"
                disabled={loading}
              />
            ) : (
              <p className={styles.value}>{formData.lastname || "No especificado"}</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              <Mail size={18} />
              Correo electrónico
              {isEditing && originalData.email !== formData.email && (
                <span className={styles.changedBadge}>Modificado</span>
              )}
            </label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Ingresa tu correo"
                disabled={loading}
              />
            ) : (
              <p className={styles.value}>{formData.email || "No especificado"}</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              <Mail size={18} />
              Correo de recuperación
              {isEditing && originalData.recoveryEmail !== formData.recoveryEmail && (
                <span className={styles.changedBadge}>Modificado</span>
              )}
            </label>
            {isEditing ? (
              <input
                type="email"
                name="recoveryEmail"
                value={formData.recoveryEmail}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Ingresa tu correo de recuperación"
                disabled={loading}
              />
            ) : (
              <p className={styles.value}>{formData.recoveryEmail || "No especificado"}</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              <Phone size={18} />
              Teléfono
              {isEditing && originalData.phone !== formData.phone && (
                <span className={styles.changedBadge}>Modificado</span>
              )}
            </label>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Ingresa tu teléfono"
                disabled={loading}
              />
            ) : (
              <p className={styles.value}>{formData.phone || "No especificado"}</p>
            )}
          </div>

          {isEditing && (
            <div className={styles.field}>
              <label className={styles.label}>
                <Lock size={18} />
                Nueva contraseña (opcional)
                {formData.password && formData.password.trim() !== "" && (
                  <span className={styles.changedBadge}>Modificado</span>
                )}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Deja en blanco para mantener la actual"
                disabled={loading}
              />
              <p className={styles.hint}>
                Solo completa este campo si deseas cambiar tu contraseña (mínimo 6 caracteres)
              </p>
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
                    margin: "0"
                  }}>
                    {passwordData.newPassword === passwordData.confirmPassword 
                      ? "✓ Las contraseñas coinciden" 
                      : "✗ Las contraseñas no coinciden"}
                  </p>
                )}

                <div className={styles.editActions}>
                  <button 
                    className={styles.saveButton}
                    onClick={handlePasswordChange}
                    disabled={loading}
                  >
                    {loading ? "Cambiando..." : "Cambiar contraseña"}
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
      </div>
    </div>
  );
};

export default Profile;