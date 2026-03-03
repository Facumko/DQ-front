import React from "react";
import { Link } from "react-router-dom";
import styles from "./Footer.module.css";
import { FaFacebook, FaInstagram, FaMapMarkerAlt, FaEnvelope } from "react-icons/fa";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      {/* Franja superior con degradado */}
      <div className={styles.footerTop}>

        {/* Columna 1: Marca */}
        <div className={styles.col}>
          <div className={styles.brand}>
            <img src="/logoDQ.png" alt="Dónde Queda?" className={styles.brandLogo} />
            <span className={styles.brandName}>Dónde Queda?</span>
          </div>
          <p className={styles.brandTagline}>
            El directorio digital de tu ciudad. Encontrá negocios, servicios,
            eventos y todo lo que necesitás, en un solo lugar.
          </p>
          <div className={styles.location}>
            <FaMapMarkerAlt className={styles.locationIcon} />
            <span>Presidencia Roque Sáenz Peña, Chaco, Argentina</span>
          </div>
        </div>

        {/* Columna 2: Legal */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Información</h4>
          <ul className={styles.linkList}>
            <li>
              <Link to="/legal/terminos-de-uso" className={styles.footerLink}>
                Términos de uso
              </Link>
            </li>
            <li>
              <Link to="/legal/politica-de-privacidad" className={styles.footerLink}>
                Política de privacidad
              </Link>
            </li>
            <li>
              <Link to="/planes" className={styles.footerLink}>
                Planes de suscripción
              </Link>
            </li>
          </ul>
        </div>

        {/* Columna 3: Servicio al cliente */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Servicio al cliente</h4>
          <ul className={styles.linkList}>
            <li>
              <Link to="/contacto" className={styles.footerLink}>
                Contacto
              </Link>
            </li>
            <li>
              <Link to="/preguntas-frecuentes" className={styles.footerLink}>
                Preguntas frecuentes
              </Link>
            </li>
            <li>
              <Link to="/como-funciona" className={styles.footerLink}>
                ¿Cómo funciona?
              </Link>
            </li>
            <li>
              <a href="mailto:desarrollomf.arg@gmail.com" className={styles.footerLink}>
                <FaEnvelope className={styles.inlineIcon} />
                desarrollomf.arg@gmail.com
              </a>
            </li>
          </ul>
        </div>

        {/* Columna 4: Redes sociales */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Seguinos en</h4>
          <div className={styles.socialLinks}>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.socialBtn} ${styles.facebook}`}
              aria-label="Facebook"
            >
              <FaFacebook className={styles.socialIcon} />
              <span>Facebook</span>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.socialBtn} ${styles.instagram}`}
              aria-label="Instagram"
            >
              <FaInstagram className={styles.socialIcon} />
              <span>Instagram</span>
            </a>
          </div>

          {/* Botón de arrepentimiento destacado */}
          <div className={styles.arrepentimientoBox}>
            <Link to="/legal/arrepentimiento" className={styles.arrepentimientoBtn}>
              <span className={styles.arrepentimientoIcon}>↩</span>
              Botón de arrepentimiento
            </Link>
            <p className={styles.arrepentimientoNote}>
              Ley 24.240 – Defensa del Consumidor
            </p>
          </div>
        </div>
      </div>

      {/* Franja inferior: copyright */}
      <div className={styles.footerBottom}>
        <p className={styles.copyright}>
          © {currentYear} Dónde Queda? — Todos los derechos reservados.
        </p>
        <p className={styles.copyrightSub}>
          Hecho en Chaco, Argentina &nbsp;🇦🇷
        </p>
      </div>
    </footer>
  );
};

export default Footer;