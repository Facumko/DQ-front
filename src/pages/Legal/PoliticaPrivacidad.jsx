import { useEffect } from "react";
import { Link } from "react-router-dom";
import "./LegalPage.css";

export default function PoliticaPrivacidad() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Política de Privacidad – Dónde Queda?";
  }, []);

  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link to="/" className="legal-logo">
          <img src="/logoDQ.png" alt="Dónde Queda?" />
          <span>Dónde Queda?</span>
        </Link>
        <h1>Política de Privacidad</h1>
        <p className="legal-subtitle">Última actualización: febrero de 2026</p>
      </header>

      <div className="legal-container">
        <div className="legal-intro">
          <p>En <strong>Dónde Queda?</strong> nos tomamos muy en serio la privacidad de nuestros usuarios. Este documento explica de manera clara qué datos recopilamos, cómo los usamos y cómo los protegemos. Al registrarte o utilizar nuestra plataforma, aceptás los términos descritos a continuación.</p>
        </div>

        <Section n="1" title="Responsable del tratamiento de datos">
          <p><strong>Dónde Queda?</strong> es el responsable del tratamiento de los datos personales de los usuarios de esta plataforma, con operación en la República Argentina. Podés contactarnos ante cualquier consulta o solicitud relacionada con tus datos personales a través de los canales de contacto disponibles en la plataforma.</p>
        </Section>

        <Section n="2" title="Datos que recopilamos">
          <p>Al crear una cuenta en Dónde Queda?, recopilamos los siguientes datos personales:</p>
          <div className="legal-table-wrapper">
            <table className="legal-table">
              <thead><tr><th>Dato</th><th>Obligatorio</th><th>Finalidad</th></tr></thead>
              <tbody>
                <tr><td>Correo electrónico</td><td>Sí</td><td>Identificación, inicio de sesión y comunicaciones</td></tr>
                <tr><td>Contraseña</td><td>Sí</td><td>Autenticación segura (almacenada de forma cifrada)</td></tr>
                <tr><td>Nombre y apellido</td><td>Sí</td><td>Personalización del perfil</td></tr>
                <tr><td>Nombre de usuario</td><td>Sí</td><td>Identificación pública dentro de la plataforma</td></tr>
                <tr><td>Foto de perfil</td><td>No</td><td>Personalización visual del perfil</td></tr>
                <tr><td>Número de teléfono</td><td>No</td><td>Contacto y verificación opcional</td></tr>
                <tr><td>Fecha de nacimiento</td><td>No</td><td>Verificación de edad mínima</td></tr>
                <tr><td>Dirección</td><td>No</td><td>Datos de perfil opcionales</td></tr>
              </tbody>
            </table>
          </div>
          <p>También podemos recopilar, de forma automática, datos de uso de la plataforma como páginas visitadas, búsquedas realizadas, comercios consultados y preferencias de navegación, con el fin de mejorar la experiencia del usuario.</p>
        </Section>

        <Section n="3" title="Uso de los datos personales">
          <p>Los datos recopilados se utilizan exclusivamente para los siguientes fines:</p>
          <ul className="legal-list">
            <li>Permitir el registro, acceso y uso de la plataforma.</li>
            <li>Personalizar la experiencia del usuario (favoritos, publicaciones guardadas, historial).</li>
            <li>Gestionar suscripciones y procesar pagos a través de Mercado Pago y Rapipago/Pago Fácil.</li>
            <li>Enviar notificaciones relacionadas con la cuenta, eventos guardados o actualizaciones importantes.</li>
            <li>Mejorar el funcionamiento y los contenidos de la plataforma.</li>
            <li>Atender consultas, reclamos o solicitudes de soporte.</li>
          </ul>
          <div className="legal-highlight">
            <strong>Compromiso de privacidad</strong>
            Tus datos personales <strong>no serán vendidos, cedidos ni compartidos</strong> con terceros con fines comerciales o publicitarios. Únicamente son utilizados para el funcionamiento interno de Dónde Queda?.
          </div>
        </Section>

        <Section n="4" title="Publicidad y datos de terceros">
          <p>Dónde Queda? <strong>no muestra publicidad externa ni anuncios de terceros</strong> dentro de la plataforma. No integramos redes publicitarias ni permitimos que empresas externas accedan a los datos de nuestros usuarios con fines de segmentación o publicidad dirigida.</p>
          <p>La visibilidad destacada de ciertos comercios y publicaciones en la plataforma es el resultado exclusivo del plan de suscripción contratado por el propio titular del comercio, sin ningún tipo de relación publicitaria con terceros.</p>
        </Section>

        <Section n="5" title="Procesamiento de pagos">
          <p>Los pagos de suscripciones se procesan a través de los siguientes medios:</p>
          <ul className="legal-list">
            <li><strong>Mercado Pago:</strong> plataforma de pagos digitales sujeta a su propia política de privacidad y seguridad.</li>
            <li><strong>Rapipago / Pago Fácil:</strong> pago presencial mediante código o voucher generado por la plataforma.</li>
          </ul>
          <p>Dónde Queda? <strong>no almacena datos de tarjetas de crédito ni información bancaria</strong>. Toda la información sensible de pago es gestionada directamente por los proveedores mencionados.</p>
        </Section>

        <Section n="6" title="Almacenamiento y seguridad">
          <p>Implementamos medidas técnicas y organizativas razonables para proteger los datos personales de nuestros usuarios. Entre ellas:</p>
          <ul className="legal-list">
            <li>Almacenamiento de contraseñas con cifrado (hashing).</li>
            <li>Conexiones cifradas mediante HTTPS.</li>
            <li>Acceso restringido a los datos únicamente al personal autorizado.</li>
          </ul>
          <p>No obstante, ningún sistema de seguridad es infalible. En caso de detectar una brecha de seguridad que afecte tus datos, te notificaremos en el menor tiempo posible.</p>
        </Section>

        <Section n="7" title="Derechos del usuario">
          <p>De acuerdo con la <strong>Ley N.° 25.326 de Protección de los Datos Personales</strong> de la República Argentina, tenés derecho a:</p>
          <ul className="legal-list">
            <li><strong>Acceder</strong> a tus datos personales almacenados en la plataforma.</li>
            <li><strong>Rectificar</strong> datos incorrectos o desactualizados.</li>
            <li><strong>Solicitar la eliminación</strong> de tu cuenta y datos asociados.</li>
            <li><strong>Oponerte</strong> al tratamiento de tus datos en casos específicos.</li>
          </ul>
          <p>Para ejercer cualquiera de estos derechos, podés hacerlo desde la configuración de tu cuenta o contactándonos directamente. La DIRECCIÓN NACIONAL DE PROTECCIÓN DE DATOS PERSONALES es el órgano de control encargado de atender las denuncias y reclamos en relación con el incumplimiento de la ley.</p>
        </Section>

        <Section n="8" title="Datos de menores de edad">
          <p>Dónde Queda? no está dirigida a menores de 13 años. No recopilamos intencionalmente datos personales de menores. Si tomamos conocimiento de que un menor ha proporcionado datos sin el consentimiento de sus tutores, procederemos a eliminarlos.</p>
        </Section>

        <Section n="9" title="Cookies y tecnologías similares">
          <p>Podemos utilizar cookies y tecnologías similares para mantener la sesión iniciada, recordar preferencias del usuario y analizar el uso de la plataforma de forma agregada. No utilizamos cookies de terceros con fines publicitarios.</p>
        </Section>

        <Section n="10" title="Modificaciones a esta política">
          <p>Nos reservamos el derecho de actualizar esta Política de Privacidad en cualquier momento. Ante cambios significativos, notificaremos a los usuarios registrados por correo electrónico o mediante un aviso visible en la plataforma. El uso continuado de Dónde Queda? luego de la notificación implica la aceptación de los cambios.</p>
        </Section>

        <Section n="11" title="Legislación aplicable">
          <p>Esta Política de Privacidad se rige por las leyes de la República Argentina, en particular la <strong>Ley N.° 25.326 de Protección de los Datos Personales</strong> y su decreto reglamentario. Cualquier controversia derivada de su interpretación o aplicación será sometida a la jurisdicción de los tribunales competentes de la República Argentina.</p>
        </Section>
      </div>

      <footer className="legal-footer">
        <p>© 2026 Dónde Queda? — Todos los derechos reservados.</p>
        <div className="legal-footer-links">
          <Link to="/terminos-de-uso">Términos de Uso</Link>
          <span>·</span>
          <Link to="/">Volver al inicio</Link>
        </div>
      </footer>
    </div>
  );
}

function Section({ n, title, children }) {
  return (
    <div className="legal-section">
      <span className="legal-badge">Artículo {n}</span>
      <h2>{title}</h2>
      {children}
    </div>
  );
}