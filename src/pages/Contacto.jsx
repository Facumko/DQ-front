import React, { useState } from "react";
import styles from "./Contacto.module.css";
import { FaEnvelope, FaWhatsapp, FaMapMarkerAlt, FaClock } from "react-icons/fa";

const Contacto = () => {
  const [form, setForm] = useState({ nombre: "", email: "", asunto: "", mensaje: "" });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
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
                      placeholder="Tu nombre" required />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Email *</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange}
                      placeholder="tu@email.com" required />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Asunto *</label>
                  <input name="asunto" value={form.asunto} onChange={handleChange}
                    placeholder="¿En qué te podemos ayudar?" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Mensaje *</label>
                  <textarea name="mensaje" value={form.mensaje} onChange={handleChange}
                    rows={5} placeholder="Escribí tu mensaje acá..." required />
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