import React, { useState } from "react";
import styles from "./PreguntasFrecuentes.module.css";
import { FaChevronDown, FaSearch } from "react-icons/fa";

const FAQ_DATA = [
  {
    categoria: "Cuenta y registro",
    preguntas: [
      {
        q: "¿Cómo me registro en Dónde Queda?",
        a: "Hacé clic en el botón 'Ingresar' del menú superior y luego en 'Crear cuenta'. Completá tus datos básicos (nombre, email y contraseña) y listo. El registro es gratuito.",
      },
      {
        q: "¿Es gratuito usar la plataforma?",
        a: "Sí. Registrarse y explorar todos los negocios, eventos y el mapa de la ciudad es completamente gratuito. Los planes de suscripción son opcionales y están pensados para dueños de negocios y aquellos quienes ofrecen servicios que quieran aparecer en el directorio.",
      },
      {
        q: "Olvidé mi contraseña, ¿qué hago?",
        a: "En la pantalla de inicio de sesión hacé clic en '¿Olvidaste tu contraseña?' e ingresá tu email. Te enviaremos un enlace para restablecerla.",
      },
    ],
  },
  {
    categoria: "Negocios y suscripciones",
    preguntas: [
      {
        q: "¿Cómo registro mi negocio?",
        a: "Iniciá sesión, hacé clic en tu nombre (esquina superior derecha) y seleccioná 'Registrar negocio'. Necesitás tener activo alguno de los planes de suscripción para crear tu perfil.",
      },
      {
        q: "¿Cuáles son los planes disponibles?",
        a: "Tenemos tres planes: Básico (perfil con información e imágenes), Intermedio (todo lo anterior + publicaciones) y Premium (todo lo anterior + eventos y aparición en el carrusel principal). Visitá la sección Planes para ver precios actualizados.",
      },
      {
        q: "¿Puedo tener más de un negocio?",
        a: "El plan Premium permite registrar más de un negocio. Los planes Básico e Intermedio incluyen un solo perfil de comercio.",
      },
      {
        q: "¿Cómo se renueva mi suscripción?",
        a: "Las suscripciones son mensuales y se renuevan automáticamente. Podés cancelar o cambiar de plan en cualquier momento desde tu perfil.",
      },
      {
        q: "¿Qué medios de pago aceptan?",
        a: "Aceptamos pagos a través de Mercado Pago (tarjetas de crédito, débito, dinero en cuenta) y cupones de Rapipago / Pago Fácil.",
      },
    ],
  },
  {
    categoria: "Mapa y búsqueda",
    preguntas: [
      {
        q: "¿Cómo aparece mi negocio en el mapa?",
        a: "Al completar el perfil de tu comercio podés ingresar la dirección exacta. Una vez validada, tu negocio aparecerá automáticamente como un pin en el mapa de la ciudad.",
      },
      {
        q: "¿Puedo filtrar el mapa por categoría?",
        a: "Sí. En la página del mapa hay una barra de filtros en la parte superior que te permite ver solo los negocios de la categoría que te interese.",
      },
    ],
  },
  {
    categoria: "Privacidad y datos",
    preguntas: [
      {
        q: "¿Venden mis datos a terceros?",
        a: "No. Tus datos personales son utilizados únicamente para el funcionamiento de la plataforma y no son compartidos ni vendidos a ningún tercero. Podés leer nuestra Política de Privacidad completa para más información.",
      },
      {
        q: "¿Cómo elimino mi cuenta?",
        a: "Podés solicitar la eliminación de tu cuenta enviando un email a desarrollomf.ar@gmail.com con el asunto 'Eliminar cuenta'. Procesamos la solicitud dentro de los 5 días hábiles.",
      },
    ],
  },
];

const PreguntasFrecuentes = () => {
  const [openItem, setOpenItem] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const toggle = (key) => setOpenItem(openItem === key ? null : key);

  // Filtrar por búsqueda
  const dataFiltrada = FAQ_DATA.map((cat) => ({
    ...cat,
    preguntas: cat.preguntas.filter(
      (p) =>
        !busqueda ||
        p.q.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.a.toLowerCase().includes(busqueda.toLowerCase())
    ),
  })).filter((cat) => cat.preguntas.length > 0);

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <div className={styles.header}>
          <h1 className={styles.title}>Preguntas frecuentes</h1>
          <p className={styles.subtitle}>
            Encontrá respuestas rápidas a las consultas más comunes
          </p>

          {/* Buscador */}
          <div className={styles.searchBox}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar en las preguntas..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Acordeones por categoría */}
        <div className={styles.faqList}>
          {dataFiltrada.length === 0 ? (
            <div className={styles.noResults}>
              No encontramos preguntas que coincidan con tu búsqueda.
            </div>
          ) : (
            dataFiltrada.map((cat) => (
              <div key={cat.categoria} className={styles.catBlock}>
                <h2 className={styles.catTitle}>{cat.categoria}</h2>
                {cat.preguntas.map((item, idx) => {
                  const key = `${cat.categoria}-${idx}`;
                  const isOpen = openItem === key;
                  return (
                    <div
                      key={key}
                      className={`${styles.item} ${isOpen ? styles.itemOpen : ""}`}
                    >
                      <button
                        className={styles.question}
                        onClick={() => toggle(key)}
                        aria-expanded={isOpen}
                      >
                        <span>{item.q}</span>
                        <FaChevronDown
                          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
                        />
                      </button>
                      {isOpen && (
                        <div className={styles.answer}>
                          <p>{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* CTA de contacto */}
        <div className={styles.ctaBox}>
          <p>¿No encontraste lo que buscabas?</p>
          <a href="/contacto" className={styles.ctaBtn}>
            Contactanos directamente
          </a>
        </div>

      </div>
    </div>
  );
};

export default PreguntasFrecuentes;