// Fuente única de verdad para la info visual de los planes (features y
// límites). Los PRECIOS reales siempre se piden al backend con getPlans()
// (ver Plans.jsx) — acá solo van textos y límites de referencia para no
// repetir listas hardcodeadas en varios lugares.
//
// Si cambian los límites reales en la BD, actualizar acá (idealmente esto
// terminaría leyendo maxCommerces/maxPostsPerDay/maxEventsPerDay directo
// del PlanDto que devuelve /plan/traer, en vez de estar hardcodeado).

export const PLANS_CONFIG = [
  {
    id: "basic",
    badge: "Básico",
    name: "Punto de Encuentro",
    tagline: "Para empezar a estar en el mapa",
    color: "#0369a1",
    colorBg: "#e0f2fe",
    maxCommerces: 1,
    maxPostsPerDay: 5,
    maxEventsPerDay: 0,
    features: [
      { text: "1 perfil de comercio", included: true },
      { text: "Información completa del comercio", included: true },
      { text: "Imagen de perfil y portada", included: true },
      { text: "Aparición en sección destacada por categoría", included: true },
      { text: "Hasta 5 publicaciones en el feed por día", included: true },
      { text: "Creación de eventos", included: false },
      { text: "Aparición en carrusel principal", included: false },
      { text: "Más de un perfil de comercio", included: false },
    ],
  },
  {
    id: "mid",
    badge: "Intermedio",
    name: "Lugar en el Mapa",
    tagline: "Conectá con tu comunidad",
    color: "#b45309",
    colorBg: "#fef3c7",
    maxCommerces: 2,
    maxPostsPerDay: 10,
    maxEventsPerDay: 0,
    features: [
      { text: "Hasta 2 perfiles de comercio", included: true },
      { text: "Información completa del comercio", included: true },
      { text: "Imagen de perfil y portada", included: true },
      { text: "Aparición en sección destacada por categoría", included: true },
      { text: "Hasta 10 publicaciones en el feed por día", included: true },
      { text: "Más de un perfil de comercio", included: true },
      { text: "Creación de eventos", included: false },
      { text: "Aparición en carrusel principal", included: false },
    ],
  },
  {
    id: "premium",
    badge: "Premium",
    name: "Referente de la Ciudad",
    tagline: "Máxima visibilidad y presencia",
    color: "#9d174d",
    colorBg: "#fce7f3",
    maxCommerces: null, // múltiples
    maxPostsPerDay: 100,
    maxEventsPerDay: null, // > 0, habilitado
    features: [
      { text: "Múltiples perfiles de comercio", included: true },
      { text: "Información completa del comercio", included: true },
      { text: "Imagen de perfil y portada", included: true },
      { text: "Aparición en sección destacada", included: true },
      { text: "Hasta 100 publicaciones en el feed por día", included: true },
      { text: "Creación de eventos", included: true },
      { text: "Aparición en carrusel principal", included: true },
      { text: "Más de un perfil de comercio", included: true },
    ],
  },
];

// Plan más económico que habilita cada capacidad — para armar tooltips
// del tipo "Disponible desde el plan X" sin hardcodear el nombre en cada
// componente que lo necesite.
export const cheapestPlanWithEvents = PLANS_CONFIG.find(p => p.maxEventsPerDay == null || p.maxEventsPerDay > 0);