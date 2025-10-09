import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../../pages/UserContext";
import { getUserById, updateUser } from "../../Api/Api";
import styles from "./Profile.module.css";
import { User, Mail, Phone, Edit2, Save, X, Lock } from "lucide-react";

const Profile = () => {
  const { user, updateUserContext, logout } = useContext(UserContext);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingData, setLoadingData] = useState(true);

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
    const loadUserData = async () => {
      if (!user?.id_user) {
        setLoadingData(false);
        return;
      }

      try {
        const userData = await getUserById(user.id_user);
        setFormData({
          username: userData.username || "",
          name: userData.name || "",
          lastname: userData.lastname || "",
          email: userData.email || "",
          password: "", // No mostrar la contraseña
          recoveryEmail: userData.recovery_email || userData.recoveryEmail || "",
          phone: userData.phone || ""
        });
      } catch (err) {
        console.error("Error al cargar datos del usuario:", err);
        setError("No se pudieron cargar los datos del usuario");
      } finally {
        setLoadingData(false);
      }
    };

    loadUserData();
  }, [user]);

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

    // Validaciones
    if (!formData.username.trim()) {
      setError("El nombre de usuario es obligatorio");
      setLoading(false);
      return;
    }

    if (!formData.name.trim()) {
      setError("El nombre es obligatorio");
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError("El correo electrónico es obligatorio");
      setLoading(false);
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Por favor ingresa un email válido");
      setLoading(false);
      return;
    }

    try {
      // Preparar datos para enviar
      const dataToSend = {
        username: formData.username,
        name: formData.name,
        lastname: formData.lastname,
        email: formData.email,
        recoveryEmail: formData.recoveryEmail,
        phone: formData.phone
      };

      // Solo incluir password si se está cambiando
      if (formData.password && formData.password.trim() !== "") {
        dataToSend.password = formData.password;
      }

      console.log("Enviando datos:", dataToSend);

      // Llamar al endpoint de actualización
      const updatedUser = await updateUser(user.id_user, dataToSend);

      console.log("Usuario actualizado:", updatedUser);

      // Actualizar contexto con los nuevos datos
      if (updateUserContext) {
        updateUserContext({
          ...user,
          username: updatedUser.username,
          name: updatedUser.name,
          lastname: updatedUser.lastname,
          email: updatedUser.email,
          recovery_email: updatedUser.recovery_email || updatedUser.recoveryEmail,
          phone: updatedUser.phone
        });
      }

      setSuccess("✅ Datos actualizados correctamente");
      setIsEditing(false);
      
      // Limpiar el campo de contraseña
      setFormData(prev => ({ ...prev, password: "" }));

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error al actualizar usuario:", err);
      setError(err.message || "Error al actualizar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError("");
    setSuccess("");
    // Restaurar datos originales
    if (user?.id_user) {
      getUserById(user.id_user).then(userData => {
        setFormData({
          username: userData.username || "",
          name: userData.name || "",
          lastname: userData.lastname || "",
          email: userData.email || "",
          password: "",
          recoveryEmail: userData.recovery_email || userData.recoveryEmail || "",
          phone: userData.phone || ""
        });
      });
    }
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
      // Aquí deberías validar la contraseña actual con el backend
      // Por ahora, solo actualizamos con la nueva contraseña
      await updateUser(user.id_user, {
        ...formData,
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

  if (loadingData) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p style={{ textAlign: "center", padding: "2rem" }}>
            Cargando información del usuario...
          </p>
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
                disabled={loading}
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

        {/* Formulario de datos */}
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>
              <User size={18} />
              Nombre de usuario
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
                Solo completa este campo si deseas cambiar tu contraseña
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