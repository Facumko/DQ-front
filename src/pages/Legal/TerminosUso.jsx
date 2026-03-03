import { useEffect } from "react";
import { Link } from "react-router-dom";
import "./LegalPage.css";

export default function TerminosUso() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Términos de Uso – Dónde Queda?";
  }, []);

  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link to="/" className="legal-logo">
          <img src="/logoDQ.png" alt="Dónde Queda?" />
          <span>Dónde Queda?</span>
        </Link>
        <h1>Términos de Uso</h1>
        <p className="legal-subtitle">Última actualización: febrero de 2026</p>
      </header>

      <div className="legal-container">
        <div className="legal-intro">
          <p>Estos Términos de Uso regulan el acceso y la utilización de <strong>Dónde Queda?</strong>, plataforma digital de directorio de comercios, servicios y lugares de interés. Al registrarte o utilizar la plataforma, aceptás en su totalidad las condiciones aquí establecidas. Si no estás de acuerdo, te pedimos que no utilices el servicio.</p>
        </div>

        <Section n="1" title="Descripción del servicio">
          <p><strong>Dónde Queda?</strong> es una plataforma digital que funciona como directorio local de comercios, servicios, entes públicos, privados y lugares de interés de una ciudad de Argentina. Sus funcionalidades incluyen:</p>
          <ul className="legal-list">
            <li>Buscador de comercios y servicios por nombre, categoría o tipo.</li>
            <li>Mapa interactivo para la localización de comercios y lugares.</li>
            <li>Perfiles de comercio con información, imágenes y publicaciones.</li>
            <li>Carrusel de publicaciones y eventos destacados de usuarios con plan Premium.</li>
            <li>Sección de categorías para explorar el directorio de forma organizada.</li>
            <li>Feed de últimas publicaciones de comercios registrados.</li>
          </ul>
        </Section>

        <Section n="2" title="Registro de usuarios">
          <p>Para acceder a determinadas funcionalidades, es necesario crear una cuenta en Dónde Queda?. Al registrarte, te comprometés a:</p>
          <ul className="legal-list">
            <li>Proporcionar información veraz, completa y actualizada.</li>
            <li>Mantener la confidencialidad de tu contraseña.</li>
            <li>No ceder ni compartir tu cuenta con terceros.</li>
            <li>Notificarnos de inmediato ante cualquier uso no autorizado de tu cuenta.</li>
          </ul>
          <p>Dónde Queda? se reserva el derecho de suspender o eliminar cuentas que incumplan estas condiciones.</p>
        </Section>

        <Section n="3" title="Funcionalidades del usuario registrado">
          <p>El usuario que se registra de forma gratuita puede:</p>
          <ul className="legal-list">
            <li>Marcar comercios como favoritos y acceder a ellos desde su perfil.</li>
            <li>Ver con prioridad las publicaciones de los comercios que sigue.</li>
            <li>Guardar publicaciones para revisarlas más tarde.</li>
            <li>Indicar asistencia a eventos publicados en la plataforma.</li>
            <li>Comentar publicaciones y reaccionar con "Me gusta".</li>
          </ul>
          <p>El usuario es responsable del contenido que publica, comenta o comparte dentro de la plataforma.</p>
        </Section>

        <Section n="4" title="Planes de suscripción para comercios">
          <p>Los usuarios que deseen registrar un comercio en la plataforma deben contratar uno de los siguientes planes de suscripción mensual:</p>
          <div className="legal-table-wrapper">
            <table className="legal-table plans-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Funcionalidades incluidas</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="plan-badge plan-basic">Básico</span>
                    <span className="plan-name">Punto de Encuentro</span>
                  </td>
                  <td>1 perfil de comercio · Información completa · Imagen de perfil y portada · Aparición en sección destacada según categoría · Hasta 5 imágenes · Sin publicaciones</td>
                </tr>
                <tr>
                  <td>
                    <span className="plan-badge plan-mid">Intermedio</span>
                    <span className="plan-name">Lugar en el Mapa</span>
                  </td>
                  <td>Todo lo del plan Básico · Posibilidad de realizar publicaciones visibles en el feed de la plataforma</td>
                </tr>
                <tr>
                  <td>
                    <span className="plan-badge plan-premium">Premium</span>
                    <span className="plan-name">Referente de la Ciudad</span>
                  </td>
                  <td>Todo lo del plan Intermedio · Creación de eventos con fecha, hora y detalles · Aparición en el carrusel de la página principal · Más de un perfil de comercio</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="legal-infobox">
            <strong>Nota sobre precios y promociones</strong>
            Los precios de cada plan se muestran al momento de la suscripción y pueden ser modificados en cualquier momento. Las promociones vigentes son sujetas a modificación sin previo aviso. Los cambios de precio no afectarán las suscripciones activas hasta su renovación.
          </div>
        </Section>

        <Section n="5" title="Pagos y facturación">
          <p>Los planes de suscripción tienen una duración mensual y se renuevan automáticamente salvo que el usuario cancele antes del vencimiento. Los medios de pago disponibles son:</p>
          <ul className="legal-list">
            <li><strong>Mercado Pago:</strong> tarjetas de crédito, débito y transferencias.</li>
            <li><strong>Rapipago / Pago Fácil:</strong> pago presencial con voucher generado por la plataforma.</li>
          </ul>
          <p>Una vez procesado el pago, no se realizarán reembolsos salvo por error técnico comprobable de la plataforma. En caso de controversia, podés contactarnos a través de los canales habilitados.</p>
        </Section>

        <Section n="6" title="Contenido publicado por los usuarios">
          <p>Al publicar contenido en Dónde Queda? (textos, imágenes, eventos, comentarios), el usuario declara que:</p>
          <ul className="legal-list">
            <li>Es el titular o posee los derechos necesarios para publicarlo.</li>
            <li>El contenido no viola leyes vigentes ni derechos de terceros.</li>
            <li>El contenido no es falso, engañoso, difamatorio, obsceno ni inapropiado.</li>
            <li>No utiliza la plataforma para fines fraudulentos, spam o actividades ilegales.</li>
          </ul>
          <p>Dónde Queda? se reserva el derecho de eliminar contenido que incumpla estas condiciones y de suspender las cuentas responsables, sin necesidad de notificación previa.</p>
        </Section>

        <Section n="7" title="Publicidad y visibilidad en la plataforma">
          <p>Dónde Queda? <strong>no contiene publicidad de terceros</strong> ni anuncios externos. La mayor visibilidad de ciertos comercios (carrusel, sección destacada) es consecuencia directa del plan de suscripción contratado, y no implica ninguna relación comercial publicitaria con terceros.</p>
        </Section>

        <Section n="8" title="Exactitud de la información">
          <p>Dónde Queda? actúa como plataforma intermediaria y no verifica de forma exhaustiva la exactitud de la información publicada por los titulares de comercio. La plataforma no se responsabiliza por datos desactualizados, incorrectos o incompletos publicados por los usuarios.</p>
          <p>Si encontrás información incorrecta sobre un comercio o lugar, podés reportarlo a través de los canales habilitados en la plataforma.</p>
        </Section>

        <Section n="9" title="Propiedad intelectual">
          <p>El diseño, logotipo, nombre, código fuente y contenido propio de Dónde Queda? son propiedad exclusiva de sus creadores y están protegidos por la legislación vigente en materia de propiedad intelectual. Queda prohibida su reproducción, distribución o modificación sin autorización expresa.</p>
          <p>El contenido publicado por los usuarios (fotos, textos, etc.) es responsabilidad de cada usuario. Al publicarlo en la plataforma, otorgás a Dónde Queda? una licencia no exclusiva para mostrarlo dentro del servicio.</p>
        </Section>

        <Section n="10" title="Suspensión y cancelación de cuenta">
          <p>El usuario puede solicitar la cancelación de su cuenta en cualquier momento desde la configuración de su perfil. La cancelación implica la pérdida del acceso a los datos guardados (favoritos, publicaciones guardadas, historial).</p>
          <p>Dónde Queda? puede suspender o eliminar una cuenta de forma unilateral ante el incumplimiento de estos Términos de Uso, sin derecho a reembolso por el período ya abonado.</p>
          <div className="legal-highlight">
            <strong>Cancelación de suscripción</strong>
            Al cancelar un plan, el acceso a las funcionalidades premium se mantendrá activo hasta el fin del período mensual ya abonado. No se generará ningún cobro adicional tras la cancelación.
          </div>
        </Section>

        <Section n="11" title="Limitación de responsabilidad">
          <p>Dónde Queda? no se responsabiliza por:</p>
          <ul className="legal-list">
            <li>Interrupciones del servicio por mantenimiento, fallas técnicas o causas ajenas a la plataforma.</li>
            <li>El contenido publicado por usuarios o titulares de comercio.</li>
            <li>Daños derivados del uso indebido de la plataforma por parte de terceros.</li>
            <li>La calidad, disponibilidad o comportamiento de los comercios o servicios listados.</li>
          </ul>
        </Section>

        <Section n="12" title="Modificaciones a los Términos de Uso">
          <p>Dónde Queda? puede modificar estos Términos de Uso en cualquier momento. Los cambios serán comunicados a los usuarios registrados por correo electrónico o mediante aviso en la plataforma. El uso continuado del servicio luego de la notificación implica la aceptación de los nuevos términos.</p>
        </Section>

        <Section n="13" title="Legislación aplicable y jurisdicción">
          <p>Estos Términos de Uso se rigen por las leyes de la República Argentina. Ante cualquier controversia, las partes se someten a la jurisdicción de los tribunales ordinarios competentes de la República Argentina, renunciando a cualquier otro fuero que pudiera corresponder.</p>
        </Section>
      </div>

      <footer className="legal-footer">
        <p>© 2026 Dónde Queda? — Todos los derechos reservados.</p>
        <div className="legal-footer-links">
          <Link to="/politica-de-privacidad">Política de Privacidad</Link>
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