import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Arrepentimiento.module.css";

const Arrepentimiento = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    tipoOperacion: "",
    descripcion: "",
    fecha: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: conectar con backend
    setSubmitted(true);
    window.scrollTo(0, 0);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Encabezado */}
        <div className={styles.header}>
          <div className={styles.iconWrap}>↩</div>
          <h1 className={styles.title}>Botón de arrepentimiento</h1>
          <p className={styles.subtitle}>
            Derecho a revocación — Ley 24.240 de Defensa del Consumidor
          </p>
        </div>

        {/* Información legal */}
        <div className={styles.legalBox}>
          <h2 className={styles.legalTitle}>¿Qué es el derecho de arrepentimiento?</h2>
          <p>
            De acuerdo al <strong>Artículo 34 de la Ley 24.240</strong> y sus modificatorias
            (Ley 26.361), los consumidores que hayan contratado un servicio o realizado
            una compra a distancia (por internet, teléfono, etc.) tienen el derecho de
            revocar la aceptación de la oferta <strong>dentro de los 10 días corridos</strong> contados
            desde la contratación o desde que recibieron el producto o servicio.
          </p>
          <p>
            Si ejercés este derecho, la empresa está obligada a reintegrarte el dinero
            abonado sin penalidades y sin necesidad de que justifiques el motivo.
          </p>
          <ul className={styles.legalList}>
            <li>✅ Sin penalidades ni cargos adicionales.</li>
            <li>✅ Sin necesidad de justificar el motivo.</li>
            <li>✅ El reintegro se realiza por el mismo medio de pago utilizado.</li>
            <li>✅ Plazo máximo para el reintegro: 10 días hábiles desde la solicitud.</li>
          </ul>
        </div>

        {submitted ? (
          /* Confirmación */
          <div className={styles.successBox}>
            <div className={styles.successIcon}>✓</div>
            <h2>Solicitud recibida</h2>
            <p>
              Recibimos tu solicitud de arrepentimiento. Nos comunicaremos
              con vos dentro de las <strong>48 horas hábiles</strong> al email
              que indicaste para coordinar el reintegro.
            </p>
            <p className={styles.successNote}>
              Guardá este número de caso como comprobante:{" "}
              <strong>ARR-{Date.now().toString().slice(-8)}</strong>
            </p>
            <button className={styles.backBtn} onClick={() => navigate("/")}>
              Volver al inicio
            </button>
          </div>
        ) : (
          /* Formulario */
          <form className={styles.form} onSubmit={handleSubmit}>
            <h2 className={styles.formTitle}>Completá el formulario de solicitud</h2>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Nombre y apellido *</label>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Juan Pérez"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email de contacto *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="tucorreo@ejemplo.com"
                  required
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="+54 9 362 000-0000"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Fecha de la operación *</label>
                <input
                  type="date"
                  name="fecha"
                  value={form.fecha}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Tipo de operación *</label>
              <select
                name="tipoOperacion"
                value={form.tipoOperacion}
                onChange={handleChange}
                required
              >
                <option value="">Seleccioná una opción</option>
                <option value="plan_basico">Contratación plan Básico</option>
                <option value="plan_intermedio">Contratación plan Intermedio</option>
                <option value="plan_premium">Contratación plan Premium</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Descripción de la operación *</label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows={4}
                placeholder="Describí brevemente la operación que querés revocar..."
                required
              />
            </div>

            <div className={styles.formFooter}>
              <p className={styles.formNote}>
                * Campos obligatorios. Tu solicitud será procesada dentro de las{" "}
                <strong>48 horas hábiles</strong>.
              </p>
              <button type="submit" className={styles.submitBtn}>
                Enviar solicitud de arrepentimiento
              </button>
            </div>
          </form>
        )}

        <div className={styles.contactInfo}>
          <p>
            También podés enviarnos un email directamente a{" "}
            <a href="mailto:desarrollomf.arg@gmail.com">desarrollomf.arg@gmail.com</a>{" "}
            indicando en el asunto <em>"Solicitud de arrepentimiento"</em>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Arrepentimiento;