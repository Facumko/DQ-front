import React, { useState } from "react";
import styles from "./Contacto.module.css";
import { FaEnvelope, FaWhatsapp, FaMapMarkerAlt, FaClock } from "react-icons/fa";

const LIMITS = { nombre: 60, email: 60, asunto: 100, mensaje: 500 };
const NOMBRE_INVALIDO = /[^\p{L}\s]/gu;

const validate = (form) => {
  const errors = {};

  if (!form.nombre.trim()) errors.nombre = "Ingresá tu nombre";
  else if (form.nombre.trim().length < 2) errors.nombre = "El nombre es demasiado corto";

  if (!form.email.trim()) errors.email = "Ingresá tu email";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Ingresá un email válido";

  if (!form.asunto.trim()) errors.asunto = "Contanos el asunto";
  else if (form.asunto.trim().length < 3) errors.asunto = "El asunto es demasiado corto";

  if (!form.mensaje.trim()) errors.mensaje = "Escribí tu mensaje";
  else if (form.mensaje.trim().length < 10) errors.mensaje = "Contanos un poco más (mínimo 10 caracteres)";

  return errors;
};

const Contacto = () => {
  const [form, setForm] = useState({ nombre: "", email: "", asunto: "", mensaje: "" });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const clean = name === "nombre" ? value.replace(NOMBRE_INVALIDO, "") : value;
    if (clean.length > LIMITS[name]) return;
    setForm({ ...form, [name]: clean });
    if (errors[name]) setErrors({ ...errors, [name]: undefined });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const foundErrors = validate(form);
    if (Object.keys(foundErrors).length > 0) {
      setErrors(foundErrors);
      return;
    }
    // TODO: conectar con backend
    setSent(true);
    window.scrollTo(0, 0);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <div className={styles.header}>
          <h1 className={styles.title}>Contacto</h1>
          <p className={styles.subtitle}>
            ¿Tenés alguna consulta, sugerencia o problema? Escribinos y te respondemos a la brevedad.
          </p>
        </div>

        <div className={styles.grid}>

          {/* Info de contacto */}
          <div className={styles.infoCol}>
            <div className={styles.infoCard}>
              <div className={styles.infoItem}>
                <div className={styles.infoIcon}><FaEnvelope /></div>
                <div>
                  <span className={styles.infoLabel}>Email</span>
                  <a href="mailto:desarrollomf.ar@gmail.com" className={styles.infoValue}>
                    desarrollomf.ar@gmail.com
                  </a>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoIcon} style={{ background: "#25d366" }}><FaWhatsapp /></div>
                <div>
                  <span className={styles.infoLabel}>WhatsApp</span>
                  <a
                    href="https://wa.me/5493644504100"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.infoValue}
                  >
                    +54 9 364 450-4100
                  </a>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoIcon} style={{ background: "#2980b9" }}><FaMapMarkerAlt /></div>
                <div>
                  <span className={styles.infoLabel}>Ubicación</span>
                  <span className={styles.infoValue}>Presidencia Roque Sáenz Peña, Chaco, Argentina</span>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoIcon} style={{ background: "#27ae60" }}><FaClock /></div>
                <div>
                  <span className={styles.infoLabel}>Tiempo de respuesta</span>
                  <span className={styles.infoValue}>Dentro de las 48 hs hábiles</span>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className={styles.formCol}>
            {sent ? (
              <div className={styles.successBox}>
                <div className={styles.successIcon}>✓</div>
                <h2>¡Mensaje enviado!</h2>
                <p>Recibimos tu consulta. Te responderemos a la brevedad en el email que indicaste.</p>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Nombre *</label>
                    <input name="nombre" value={form.nombre} onChange={handleChange}
                      placeholder="Tu nombre" maxLength={LIMITS.nombre} required />
                    {errors.nombre && <small className={styles.errorMessage}>{errors.nombre}</small>}
                  </div>
                  <div className={styles.formGroup}>
                    <label>Email *</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange}
                      placeholder="tu@email.com" maxLength={LIMITS.email} required />
                    {errors.email && <small className={styles.errorMessage}>{errors.email}</small>}
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Asunto *</label>
                  <input name="asunto" value={form.asunto} onChange={handleChange}
                    placeholder="¿En qué te podemos ayudar?" maxLength={LIMITS.asunto} required />
                  {errors.asunto && <small className={styles.errorMessage}>{errors.asunto}</small>}
                </div>
                <div className={styles.formGroup}>
                  <label>Mensaje *</label>
                  <textarea name="mensaje" value={form.mensaje} onChange={handleChange}
                    rows={5} placeholder="Escribí tu mensaje acá..." maxLength={LIMITS.mensaje} required />
                  <small className={styles.charCount}>{form.mensaje.length}/{LIMITS.mensaje}</small>
                  {errors.mensaje && <small className={styles.errorMessage}>{errors.mensaje}</small>}
                </div>
                <button type="submit" className={styles.submitBtn}>
                  Enviar mensaje
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contacto;