import React, { useContext, useState } from "react";
import { UserContext } from "../../pages/UserContext";
import styles from "./Profile.module.css";
import { User, Mail, Phone, MapPin, Edit2, Save, X } from "lucide-react";

const Profile = () => {
  const { user, updateUser } = useContext(UserContext);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "Usuario",
    email: user?.email || "usuario@ejemplo.com",
    phone: "+54 123 456 7890",
    address: "Presidencia Roque Sáenz Peña, Chaco",
    username: user?.username || "usuario123"
  });

  const handleSave = () => {
    // Aquí llamarías a tu API para actualizar el usuario
    console.log("Guardando datos:", formData);
    updateUser(formData);
    setIsEditing(false);
    // TODO: Implementar llamada al backend
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Restaurar datos originales
    setFormData({
      name: user?.name || "Usuario",
      email: user?.email || "usuario@ejemplo.com",
      phone: "+54 123 456 7890",
      address: "Presidencia Roque Sáenz Peña, Chaco",
      username: user?.username || "usuario123"
    });
  };

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
            <button className={styles.editButton} onClick={() => setIsEditing(true)}>
              <Edit2 size={18} />
              Editar
            </button>
          ) : (
            <div className={styles.editActions}>
              <button className={styles.saveButton} onClick={handleSave}>
                <Save size={18} />
                Guardar
              </button>
              <button className={styles.cancelButton} onClick={handleCancel}>
                <X size={18} />
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Formulario de datos */}
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>
              <User size={18} />
              Nombre completo
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={styles.input}
              />
            ) : (
              <p className={styles.value}>{formData.name}</p>
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
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={styles.input}
              />
            ) : (
              <p className={styles.value}>{formData.email}</p>
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
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className={styles.input}
              />
            ) : (
              <p className={styles.value}>{formData.phone}</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              <MapPin size={18} />
              Dirección
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className={styles.input}
              />
            ) : (
              <p className={styles.value}>{formData.address}</p>
            )}
          </div>
        </div>

        {/* Sección de seguridad */}
        <div className={styles.securitySection}>
          <h2 className={styles.sectionTitle}>Seguridad</h2>
          <button className={styles.changePasswordButton}>
            Cambiar contraseña
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;