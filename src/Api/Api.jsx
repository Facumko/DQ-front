import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://192.168.1.3:8080";
const TIMEOUT = 15000;
const MAX_RETRIES = 2;
const isDevelopment = import.meta.env.MODE === 'development';

const ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/registrarse',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  GET_USER: '/usuario/traer/mis/datos',
  UPDATE_USER: '/usuario/editar',
  DELETE_USER: '/usuario/eliminar',
  GET_CATEGORIES: '/categoria/traer',
  GET_IMAGES: '/imagen/traer',
  UPLOAD_IMAGE: '/imagen/guardar',
  GET_ALL_COMMERCES: '/comercio/traer',
  GET_MY_BUSINESSES:`/comercio/traer/mis/comercios`,
  GET_BUSINESS: (businessId) => `/comercio/traer/${businessId}`,
  UPDATE_BUSINESS: (businessId) => `/comercio/editar/${businessId}`,
  CREATE_BUSINESS: '/comercio/guardar',
  UPLOAD_PROFILE_IMAGE: (businessId) => `/comercio/establecer/imagen/perfil/${businessId}`,
  UPLOAD_COVER_IMAGE: (businessId) => `/comercio/establecer/imagen/portada/${businessId}`,
  UPLOAD_GALLERY_IMAGES: (businessId) => `/comercio/agregar/imagenes/galeria/${businessId}`,
  POST_CREATE: '/publicacion/crear',
  POST_GET_ALL: '/publicacion/traer',
  POST_GET_BY_ID: (postId) => `/publicacion/traer/${postId}`,
  POST_GET_BY_COMMERCE: (commerceId) => `/publicacion/traer/comercio/${commerceId}`,
  POST_UPDATE: (postId) => `/publicacion/editar/${postId}`,
  POST_DELETE: (postId) => `/publicacion/eliminar/${postId}`,
  POST_ADD_IMAGES: (postId) => `/publicacion/agregar/imagenes/${postId}`,
  POST_DELETE_IMAGES: (postId) => `/publicacion/eliminar/imagenes/${postId}`,
  SEARCH_COMMERCES: '/comercio/buscar',
  GET_RECENT_COMMERCES: '/comercio/recientes',
  MAIN_FEED: '/main/feed',
  FOR_YOU_FEED: '/foryou/feed',
  // Favoritos - ACTUALIZADOS
  // Eventos
  CREATE_EVENT: '/evento/guardar',
  GET_ALL_EVENTS: '/evento/traer',
  GET_EVENT_BY_ID: (id) => `/evento/traer/${id}`,
  UPDATE_EVENT: (id) => `/evento/editar/${id}`,
  DELETE_EVENT: (id) => `/evento/eliminar/${id}`,
  GET_EVENTS_BY_COMMERCE: (id) => `/evento/traer/comercio/${id}`,
  ADD_IMAGES_TO_EVENT: (id) => `/evento/agregar/imagenes/${id}`,
  DELETE_IMAGES_FROM_EVENT: (id) => `/evento/eliminar/imagenes/${id}`,
  FAV_COMMERCE_ADD:    (idCommerce) => `/usuario/agregar/comercio/fav/${idCommerce}`,
  FAV_COMMERCE_REMOVE: (idCommerce) => `/usuario/eliminar/comercio/fav/${idCommerce}`,
  FAV_COMMERCES_GET:   '/usuario/traer/mis/comercios/fav',
  SAVED_POST_ADD:      (idPost)     => `/usuario/guardar/post/${idPost}`,
  SAVED_POST_REMOVE:   (idPost)     => `/usuario/eliminar/post/guardado/${idPost}`,
  SAVED_POSTS_GET:     '/usuario/traer/mis/posts/guardados',
  REPLACE_SCHEDULES: (commerceId) => `/comercio/reemplazar/horarios/${commerceId}`, 
  SET_COMMERCE_CATEGORY: (commerceId) => `/comercio/establecer/categoria/${commerceId}`,
  GET_COMMERCES_BY_CATEGORIES:   '/comercio/traer/por/categorias',
  GET_SUBCATEGORY_TAGS: '/etiqueta/subcategoria',
};

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => { if (error) { prom.reject(error); } else { prom.resolve(token); } });
  failedQueue = [];
};

export const setAuthToken = (token) => {
  if (token) { axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; }
  else { delete axios.defaults.headers.common['Authorization']; }
};

export const getStoredTokens = () => {
  try {
    return { accessToken: localStorage.getItem('accessToken'), refreshToken: localStorage.getItem('refreshToken') };
  } catch { return { accessToken: null, refreshToken: null }; }
};

export const saveTokens = (accessToken, refreshToken) => {
  try { localStorage.setItem('accessToken', accessToken); localStorage.setItem('refreshToken', refreshToken); setAuthToken(accessToken); }
  catch (error) { console.error('Error guardando tokens:', error); }
};

export const clearTokens = () => {
  try { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); setAuthToken(null); }
  catch (error) { console.error('Error limpiando tokens:', error); }
};

const refreshAccessToken = async () => {
  const { refreshToken } = getStoredTokens();
  if (isDevelopment) {
    console.log('🔄 ========== INICIO REFRESH TOKEN ==========');
    console.log('🔍 1. refreshToken:', refreshToken ? '✅ Existe' : '❌ NULL');
  }
  if (!refreshToken || refreshToken === 'undefined' || refreshToken === 'null' || refreshToken.trim() === '') {
    clearTokens(); throw new Error('No hay refresh token disponible');
  }
  const payload = { refreshToken };
  try {
    const response = await axios.post(`${API_URL}${ENDPOINTS.REFRESH_TOKEN}`, payload, {
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }, timeout: 10000,
    });
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    if (!accessToken) throw new Error('Backend no devolvió accessToken');
    saveTokens(accessToken, newRefreshToken || refreshToken);
    if (isDevelopment) {
      console.log('✅ ========== FIN REFRESH TOKEN EXITOSO ==========');
    }
    return accessToken;
  } catch (error) {
    if (isDevelopment) {
      console.error('❌ Error en refresh token:', error);
    }
    clearTokens(); throw error;
  }
};

axios.interceptors.request.use((config) => {
  const publicEndpoints = [
    ENDPOINTS.LOGIN,
    ENDPOINTS.REGISTER,
    ENDPOINTS.REFRESH_TOKEN,
    '/oauth2',
    '/login/oauth2',
  ];
  const isPublic = publicEndpoints.some(ep => config.url.includes(ep));
  if (!isPublic) {
    const { accessToken } = getStoredTokens();
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
}, (error) => Promise.reject(error));

axios.interceptors.response.use((response) => response, async (error) => {
  const originalRequest = error.config;
  if (error.response?.status === 401 && !originalRequest._retry) {
    if (originalRequest.url.includes(ENDPOINTS.REFRESH_TOKEN)) {
      clearTokens();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(error);
    }
    if (isRefreshing) {
      return new Promise((resolve, reject) => { failedQueue.push({ resolve, reject }); })
        .then(token => { originalRequest.headers.Authorization = `Bearer ${token}`; return axios(originalRequest); })
        .catch(err => Promise.reject(err));
    }
    originalRequest._retry = true; isRefreshing = true;
    try {
      const newToken = await refreshAccessToken();
      processQueue(null, newToken);
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      setAuthToken(newToken);
      return axios(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearTokens();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(refreshError);
    } finally { isRefreshing = false; }
  }
  return Promise.reject(error);
});

axios.defaults.timeout = TIMEOUT;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';
// Headers "no me muestres la página de advertencia" de los distintos túneles
// de desarrollo. Cada proveedor usa un header distinto, así que mandamos
// ambos: no está de más, y así no hay que tocar código si el equipo vuelve
// a cambiar de ngrok a localtunnel (loca.lt) o viceversa.
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';
axios.defaults.headers.common['bypass-tunnel-reminder'] = 'true';
axios.defaults.withCredentials = false;

const { accessToken: _initToken } = getStoredTokens();
if (_initToken) setAuthToken(_initToken);

export const capitalizeFirstLetter = (str) => { if (!str) return ''; return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(); };
export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const validatePasswordStrength = (password) => {
  if (!password) return { strength: 'none', message: '' };
  const score = [password.length>=8,/[A-Z]/.test(password),/[a-z]/.test(password),/[0-9]/.test(password),/[!@#$%^&*(),.?":{}|<>]/.test(password)].filter(Boolean).length;
  if (score<=2) return { strength:'weak', message:'Contraseña débil', color:'#ff4444' };
  if (score<=3) return { strength:'medium', message:'Contraseña media', color:'#ffaa00' };
  return { strength:'strong', message:'Contraseña fuerte', color:'#00cc66' };
};

// Mapa de keys del frontend a DayOfWeek de Java
const DAY_KEY_TO_JAVA = {
  Lun: "MONDAY",
  Mar: "TUESDAY",
  Mie: "WEDNESDAY",
  Jue: "THURSDAY",
  Vie: "FRIDAY",
  Sab: "SATURDAY",
  Dom: "SUNDAY",
};

// Mapa inverso: DayOfWeek Java → key del frontend
const JAVA_DAY_TO_KEY = {
  MONDAY:    "Lun",
  TUESDAY:   "Mar",
  WEDNESDAY: "Mie",
  THURSDAY:  "Jue",
  FRIDAY:    "Vie",
  SATURDAY:  "Sab",
  SUNDAY:    "Dom",
};

/**
 * Convierte el schedule del frontend (objeto por día) 
 * al array de ScheduleDto que espera el backend.
 * Los días con cerrado: true se omiten del array.
 */
export const scheduleToBackend = (schedule) => {
  const result = [];
  for (const [key, val] of Object.entries(schedule)) {
    if (val.cerrado) continue; // días cerrados no se envían
    const dto = {
      day: DAY_KEY_TO_JAVA[key],
      isContinuous: val.deCorrido || false,
    };
    if (val.deCorrido) {
      // Turno corrido: open/close están en val.open y val.close directamente
      dto.morningOpening   = val.open   || "08:00";
      dto.morningClosing   = val.close  || "20:00";
      dto.afternoonOpening = null;
      dto.afternoonClosing = null;
    } else {
      dto.morningOpening   = val.manana?.open  || "08:00";
      dto.morningClosing   = val.manana?.close || "12:00";
      dto.afternoonOpening = val.tarde?.open   || "16:00";
      dto.afternoonClosing = val.tarde?.close  || "21:00";
    }
    result.push(dto);
  }
  return result;
};

/**
 * Convierte el array de ScheduleDto del backend
 * al objeto por día que usa el frontend.
 * Los días ausentes en el array se marcan como cerrado: true.
 */
export const scheduleFromBackend = (scheduleDtos) => {
  // Partir del defaultSchedule con todos los días cerrados
  const result = {};
  const ALL_KEYS = ["Lun","Mar","Mie","Jue","Vie","Sab","Dom"];
  
  // Inicializar todos los días como cerrados
  ALL_KEYS.forEach(key => {
    result[key] = {
      cerrado:    true,
      deCorrido:  false,
      manana:     { open: "08:00", close: "12:00" },
      tarde:      { open: "16:00", close: "21:00" },
    };
  });

  // Sobreescribir con los datos del backend
  if (Array.isArray(scheduleDtos)) {
    scheduleDtos.forEach(dto => {
      const key = JAVA_DAY_TO_KEY[dto.day];
      if (!key) return;
      result[key] = {
        cerrado:   false,
        deCorrido: dto.isContinuous || false,
        manana: {
          open:  dto.morningOpening   || "08:00",
          close: dto.morningClosing   || "12:00",
        },
        tarde: {
          open:  dto.afternoonOpening || "16:00",
          close: dto.afternoonClosing || "21:00",
        },
        // Para turno corrido, guardamos también open/close directo
        ...(dto.isContinuous && {
          open:  dto.morningOpening  || "08:00",
          close: dto.morningClosing  || "20:00",
        }),
      };
    });
  }

  return result;
};

/**
 * Reemplaza todos los horarios de un comercio.
 * Endpoint: PUT /comercio/reemplazar/horarios/{idCommerce}
 * Body: List<ScheduleDto>
 */
export const replaceCommerceSchedules = async (commerceId, schedule) => {
  validateParams({ commerceId, schedule }, ['commerceId', 'schedule']);
  const dto = scheduleToBackend(schedule);
  if (isDevelopment) {
    console.log('📅 Enviando horarios al backend:', JSON.stringify(dto, null, 2));
  }
  return apiRequest('PUT', ENDPOINTS.REPLACE_SCHEDULES(commerceId), dto);
};

// ============================================
// "Abierto ahora" — se calcula en el cliente
// ============================================
// No pega al backend: usa el array de ScheduleDto que ya viene incluido en
// cada comercio (CommerceResponseDto.schedules) y lo compara contra la hora
// local del dispositivo. Sirve para la caja "De Turno y Abierto Ahora".
const JAVA_DAY_BY_INDEX = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];

const timeToMinutes = (t) => {
  if (!t) return null;
  const [h, m] = String(t).split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

export const isCommerceOpenNow = (commerce, now = new Date()) => {
  const schedules = commerce?.schedules;
  if (!Array.isArray(schedules) || schedules.length === 0) return false;

  const todayJava = JAVA_DAY_BY_INDEX[now.getDay()];
  const today = schedules.find((s) => s.day === todayJava);
  if (!today) return false;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  // El campo puede llegar como "continuous" (según el DTO real del backend)
  // o "isContinuous" (nombre que ya se usaba en otras partes del front) —
  // contemplamos los dos por las dudas.
  const isContinuous = today.continuous ?? today.isContinuous ?? false;

  if (isContinuous) {
    const open  = timeToMinutes(today.morningOpening);
    const close = timeToMinutes(today.morningClosing);
    if (open == null || close == null) return false;
    return nowMinutes >= open && nowMinutes < close;
  }

  const mOpen  = timeToMinutes(today.morningOpening);
  const mClose = timeToMinutes(today.morningClosing);
  const aOpen  = timeToMinutes(today.afternoonOpening);
  const aClose = timeToMinutes(today.afternoonClosing);

  const inMorning   = mOpen != null && mClose != null && nowMinutes >= mOpen && nowMinutes < mClose;
  const inAfternoon = aOpen != null && aClose != null && nowMinutes >= aOpen && nowMinutes < aClose;
  return inMorning || inAfternoon;
};

/**
 * Determina si un evento (EventResponseDto) cae en el día de hoy — cubre
 * tanto eventos de un solo día como los que se extienden por varios
 * (compara solo la parte de fecha, ignorando la hora). Para la caja
 * "¿Qué hacemos hoy?".
 */
export const isEventToday = (event, now = new Date()) => {
  if (!event?.startDate) return false;
  const todayKey = now.toISOString().slice(0, 10);
  const startKey = event.startDate.slice(0, 10);
  const endKey = event.endDate ? event.endDate.slice(0, 10) : startKey;
  return todayKey >= startKey && todayKey <= endKey;
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const shouldRetry = (error, method) => {
  // Reintentar automáticamente solo tiene sentido para lecturas (GET), que no
  // tienen efecto secundario. Un POST/PUT/DELETE que falló con 500 puede
  // haberse aplicado igual del lado del servidor (ej: el registro se creó pero
  // la respuesta falló) — reintentarlo a ciegas puede duplicar la operación.
  if (method !== 'GET') return false;
  if (error.response?.status===401) return false;
  if (!error.response) return true;
  if (error.code==='ECONNABORTED') return true;
  if (error.response.status>=500) return true;
  return false;
};
const validateApiResponse = (response, endpoint) => {
  if (typeof response==='string' && response.includes('<!DOCTYPE html>')) throw new Error(`El servidor respondió con HTML en vez de JSON (endpoint: ${endpoint}). Probablemente el túnel (ngrok/localtunnel) está mostrando su página de advertencia en vez de reenviar la petición.`);
  if (typeof response==='string' && /ngrok|tunnel website ahead|loca\.lt/i.test(response)) throw new Error(`El túnel de desarrollo está bloqueando la petición (endpoint: ${endpoint}). Verificá que la URL en VITE_API_URL esté activa y que los headers de bypass estén configurados.`);
  return true;
};
const handleApiError = (error, endpoint) => {
  if (isDevelopment) console.error(`❌ Error en ${endpoint}:`, error);
  if (!error.response) { if (error.code==='ECONNABORTED') return new Error('⏱️ Timeout.'); return new Error(`🔌 No se pudo conectar al servidor en ${API_URL}`); }
  const { status, data } = error.response;
  const serverMessage = (data?.message || data?.error || data?.mensaje || '').toLowerCase();
  let errorMsg = '';
  let authErrorType = null;

  if (endpoint.includes(ENDPOINTS.LOGIN)) {
    if (status === 401) {
      if (serverMessage.includes('password') || serverMessage.includes('contraseña')) {
        errorMsg = 'La contraseña es incorrecta.';
        authErrorType = 'WRONG_PASSWORD';
      } else if (serverMessage.includes('email') || serverMessage.includes('user') || serverMessage.includes('cuenta')) {
        errorMsg = 'No encontramos una cuenta con ese email.';
        authErrorType = 'USER_NOT_FOUND';
      } else {
        errorMsg = 'Email o contraseña incorrectos.';
        authErrorType = 'GENERIC';
      }
    } else if (status === 403) {
      if (serverMessage.includes('block') || serverMessage.includes('suspend') || serverMessage.includes('bloquead')) {
        errorMsg = 'Tu cuenta fue suspendida. Contactanos para más información.';
        authErrorType = 'ACCOUNT_BLOCKED';
      } else if (serverMessage.includes('verif') || serverMessage.includes('verificar')) {
        errorMsg = 'Verificá tu email antes de iniciar sesión.';
        authErrorType = 'UNVERIFIED';
      } else {
        errorMsg = 'Sin permisos para iniciar sesión.';
        authErrorType = 'GENERIC';
      }
    } else if (status === 429) {
      errorMsg = 'Demasiados intentos. Esperá unos minutos antes de volver a intentar.';
      authErrorType = 'RATE_LIMITED';
    } else {
      errorMsg = 'Error al iniciar sesión.';
      authErrorType = 'GENERIC';
    }
  } else if (endpoint.includes(ENDPOINTS.REGISTER)) {
    if (status === 409) {
      // El backend solo tiene email como campo único en el registro (no existe
      // username en ningún DTO), así que un 409 acá siempre es email duplicado.
      errorMsg = 'Ese email ya tiene una cuenta creada.';
      authErrorType = 'EMAIL_TAKEN';
    } else if (status === 400) {
      errorMsg = serverMessage || 'Revisá los datos ingresados.';
      authErrorType = 'GENERIC';
    } else {
      errorMsg = serverMessage || 'Error al crear la cuenta.';
      authErrorType = 'GENERIC';
    }
  } else {
    const msgs = {
      400: 'Datos inválidos.',
      401: 'Sesión expirada. Por favor iniciá sesión nuevamente.',
      403: 'Sin permisos.',
      404: 'No encontrado.',
      409: 'Ya existe un registro con estos datos.',
      422: 'Error de validación.',
      500: 'Error interno del servidor.',
      502: 'Servidor no disponible.',
      503: 'Servicio no disponible.',
    };
    errorMsg = serverMessage || msgs[status] || `Error ${status}`;
  }

  const err = new Error(errorMsg);
  err.status = status;
  err.response = error.response;
  if (authErrorType) err.authErrorType = authErrorType;
  return err;
};
const validateParams = (params, names) => { for (const n of names) { if (params[n]===null||params[n]===undefined||params[n]==='') throw new Error(`Parámetro requerido faltante: ${n}`); } };

const apiRequest = async (method, endpoint, data=null, retries=MAX_RETRIES) => {
  if (isDevelopment) {
    console.log(`🌐 ${method} ${endpoint}`);
    if (data) console.log('📤 Request data:', JSON.stringify(data, null, 2));
  }
  const { accessToken } = getStoredTokens();
  const config = {
    method, url:`${API_URL}${endpoint}`, timeout:TIMEOUT,
    headers:{ 'Content-Type':'application/json','Accept':'application/json','ngrok-skip-browser-warning':'true',...(accessToken?{'Authorization':`Bearer ${accessToken}`}:{}) },
    withCredentials:false,
  };
  if (data && ['POST','PUT','PATCH'].includes(method)) config.data = data;
  try {
    const response = await axios(config);
    validateApiResponse(response.data, endpoint);
    if (isDevelopment) console.log(`✅ ${method} ${endpoint} - Success`, response.data);
    return response.data;
  } catch (error) {
    if (retries>0 && shouldRetry(error, method)) { await sleep(1000*(MAX_RETRIES-retries+1)); return apiRequest(method,endpoint,data,retries-1); }
    throw handleApiError(error, endpoint);
  }
};

// ============================================
// AUTH
// ============================================
// Convierte date "2026-04-10" + time "20:00" → "2026-04-10T20:00:00"
export const toLocalDateTime = (date, time) => {
  if (!date) throw new Error('La fecha es obligatoria');
  const t = time || '00:00';
  return `${date}T${t}:00`;
};
export const loginUser = async (email, password) => {
  validateParams({ email, password }, ['email', 'password']);
  if (!validateEmail(email)) throw new Error('Por favor ingresa un email válido');

  // Debug: mostrar exactamente qué se envía
  const loginPayload = { email, password };
  if (isDevelopment) {
    console.log('🔐 Login attempt:', {
      email: email ? '***@***' : 'EMPTY',
      password: password ? '***' : 'EMPTY',
      payload: loginPayload
    });
  }

  try {
    const response = await apiRequest('POST', ENDPOINTS.LOGIN, loginPayload);
    if (!response || !response.idUser) throw new Error('Respuesta inválida del servidor');
    if (response.accessToken && response.refreshToken) saveTokens(response.accessToken, response.refreshToken);
    return response;
  } catch (error) {
    if (isDevelopment) {
      console.error('❌ Login failed:', {
        status: error.status,
        message: error.message,
        response: error.response?.data
      });
    }
    throw error;
  }
};

// Nota: loginUserAlt se eliminó porque es una función de debug peligrosa (hace varios requests en cascada).
// Usar loginUser() para produccion.

export const registerUser = async (userData) => {
  validateParams(userData, ['email', 'password']);
  if (!validateEmail(userData.email)) throw new Error('Email inválido');
  // El backend exige al menos 8 caracteres (confirmado en el schema de /auth/registrarse)
  if (userData.password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres');

  // Paso 1: el backend SOLO acepta email y password en este endpoint.
  // (No existe username en ningún DTO del backend — no se manda.)
  const response = await apiRequest('POST', ENDPOINTS.REGISTER, {
    email: userData.email,
    password: userData.password,
  });
  if (!response) throw new Error('Respuesta inválida del servidor');
  if (response.accessToken && response.refreshToken) saveTokens(response.accessToken, response.refreshToken);

  // Paso 2: si vino nombre/apellido/etc., completamos el perfil con el endpoint
  // que sí los acepta (PUT /usuario/editar). Si esto falla, no deshacemos el
  // registro — la cuenta ya existe y el usuario puede completar el perfil después.
  const hasProfileData = userData.name || userData.lastname || userData.recoveryEmail || userData.phone;
  if (hasProfileData) {
    try {
      await updateUser({
        name: userData.name || undefined,
        lastname: userData.lastname || undefined,
        recoveryEmail: userData.recoveryEmail || undefined,
        phone: userData.phone || undefined,
      });
    } catch (err) {
      if (isDevelopment) console.warn('⚠️ Cuenta creada, pero no se pudo completar el perfil:', err.message);
    }
  }

  return response;
};

export const logoutUser = async () => {
  try {
    const { refreshToken } = getStoredTokens();
    const r = await apiRequest('POST', ENDPOINTS.LOGOUT, { refreshToken });
    clearTokens();
    return r;
  } catch {
    clearTokens();
    return { success: true };
  }
};

// ============================================
// USUARIO - ACTUALIZADOS
// ============================================

export const getMyUser  = async () => { 
  return apiRequest('GET', ENDPOINTS.GET_USER); 
};

export const updateUser = async (userData) => { 
  validateParams({userData},['userData']); 
  await apiRequest('PUT', ENDPOINTS.UPDATE_USER, userData);
  return apiRequest('GET', ENDPOINTS.GET_USER);
};

export const deleteUser = async () => {
  return apiRequest('DELETE', ENDPOINTS.DELETE_USER);
};

// ============================================
// CATEGORÍAS
// ============================================

export const getCategories = async () => apiRequest('GET', ENDPOINTS.GET_CATEGORIES);

// ============================================
// IMÁGENES (antiguas)
// ============================================

export const getImages = async () => apiRequest('GET', ENDPOINTS.GET_IMAGES);
export const uploadImage = async (imageData) => { validateParams({imageData},['imageData']); return apiRequest('POST', ENDPOINTS.UPLOAD_IMAGE, imageData); };

// ============================================
// NEGOCIOS
// ============================================

// ── Normaliza string de Nominatim → recorte a un límite dado ───────────────
const normalizeAddressString = (address, maxLength = 255) => {
  if (!address) return null;
  const parts = address.split(",").map(p => p.trim()).filter(Boolean);
  const meaningful = parts.slice(0, 3).join(", ");
  return meaningful.substring(0, maxLength);
};

// ── Construye AddressDto ─────────────────────────────────────────────────────
// `address` es el único campo que el frontend muestra en algún lado (input de
// búsqueda, perfil del negocio), así que usa su límite real de la base: 255.
// `street` no se despliega en ningún lado hoy, pero la base solo admite 100,
// así que se recorta aparte y en silencio — no depende de lo que el usuario ve.
const buildAddressDto = (location) => {
  if (!location?.lat || !location?.lng) return null;
  return {
    idAddress: location.idAddress ?? null,
    address:   normalizeAddressString(location.address, 255),
    street:    normalizeAddressString(location.address, 100),
    district:  null,
    location:  null,
    lat:       location.lat,
    lng:       location.lng,
  };
};


/**
 * Trae TODOS los comercios (para el mapa y el buscador, que necesitan la
 * lista completa, no una página a la vez).
 *
 * El backend ahora pagina /comercio/traer (devuelve un objeto
 * PageCommerceResponseDto con `content`, `totalPages`, etc. en vez del
 * array plano de antes). Acá recorremos todas las páginas y las
 * concatenamos, para que quien llame a esta función siga recibiendo
 * el mismo array de siempre y no tenga que enterarse del cambio.
 */
export const getAllCommerces = async () => {
  const PAGE_SIZE = 200;      // tamaño grande por página, para minimizar requests
  const MAX_PAGES  = 50;      // resguardo de seguridad (50 × 200 = 10.000 comercios)

  try {
    if (isDevelopment) console.log('📦 Trayendo todos los comercios...');

    let page = 0;
    let totalPages = 1;
    let all = [];

    do {
      const response = await apiRequest(
        'GET',
        `${ENDPOINTS.GET_ALL_COMMERCES}?page=${page}&size=${PAGE_SIZE}`
      );

      // Soporta tanto el shape nuevo (paginado: { content, totalPages, ... })
      // como el viejo (array plano), por si algún ambiente todavía lo devuelve así.
      if (Array.isArray(response)) {
        all = all.concat(response);
        totalPages = 1; // el shape viejo no pagina, con esta pasada alcanza
      } else {
        all = all.concat(Array.isArray(response?.content) ? response.content : []);
        totalPages = response?.totalPages ?? 1;
      }

      page++;
    } while (page < totalPages && page < MAX_PAGES);

    if (isDevelopment) console.log('✅ Comercios obtenidos:', all.length);
    return all;
  } catch (error) {
    if (isDevelopment) console.error('❌ Error trayendo comercios:', error);
    throw error;
  }
};

// Clave de localStorage donde se recuerda el último comercio PROPIO que el
// usuario visitó (ver Negocios.jsx). Se usa como desempate en getMyBusiness()
// cuando el usuario tiene más de un comercio.
const LAST_COMMERCE_KEY = 'dq_last_commerce_id';

const normalizeCommerceBasic = (business) => ({
  id_business:  business.idCommerce,
  id_user:      business.idOwner,
  name:         business.name,
  description:  business.description,
  email:        business.email,
  phone:        business.phone,
  link:         business.website,
  instagram:    business.instagram,
  facebook:     business.facebook,
  whatsapp:     business.whatsapp,
  branchOf:     business.branchOf,
  profileImage: business.profileImage?.url || null,
  coverImage:   business.coverImage?.url   || null,
  schedules:    business.schedules || [],
  address:      business.address   || null,
  category:     business.category  || null,
  tags:         business.tags      || [],
});

/**
 * Trae TODOS los comercios del usuario logueado (sin recortar a uno solo).
 * Usar esta función, no getMyBusiness(), en cualquier flujo que necesite
 * saber/mostrar que el usuario puede tener más de un comercio (ej. un
 * selector de negocio, validaciones, etc.).
 */
export const getMyCommerces = async () => {
  try {
    const response = await apiRequest('GET', ENDPOINTS.GET_MY_BUSINESSES);
    const list = Array.isArray(response) ? response : response ? [response] : [];
    return list.filter(Boolean).map(normalizeCommerceBasic);
  } catch (error) {
    if (error.message?.includes('404')) return [];
    throw error;
  }
};

/**
 * Trae "un" comercio del usuario logueado — pensado para el caso simple de
 * un usuario con un solo comercio (o para compatibilidad con código viejo).
 *
 * ⚠️ CAVEAT: si el usuario tiene VARIOS comercios, este endpoint no tiene
 * forma de saber cuál te interesa mostrar. Para no quedar siempre pegado al
 * primero de la lista (bug reportado: "todo lo creado en un comercio se
 * mezclaba con los demás"), se usa como desempate el último comercio propio
 * que el usuario visitó (localStorage, ver Negocios.jsx). Si no hay ninguno
 * recordado, cae al primero de la lista.
 *
 * Para cualquier flujo que ya sepa qué comercio quiere mostrar, usar
 * getBusinessById(id) en su lugar — es la única forma 100% correcta.
 */
export const getMyBusiness = async () => {
  try {
    const response = await apiRequest('GET', ENDPOINTS.GET_MY_BUSINESSES);
    const list = Array.isArray(response) ? response : response ? [response] : [];
    if (list.length === 0) return null;

    let business = list[0];
    if (list.length > 1) {
      const lastId = localStorage.getItem(LAST_COMMERCE_KEY);
      const remembered = lastId && list.find((b) => String(b.idCommerce) === String(lastId));
      if (remembered) business = remembered;
    }

    return normalizeCommerceBasic(business);
  } catch (error) {
    if (error.message.includes('404') || error.message.includes('no encontrado')) {
      if (isDevelopment) console.log("ℹ️ Sin negocio (404)");
      return null;
    }
    throw error;
  }
};  

// Mantener alias para compatibilidad de código legado
export const getBusinessByUserId = getMyBusiness;


export const getBusinessById = async (businessId) => {
  validateParams({ businessId }, ['businessId']);
  const response = await apiRequest('GET', ENDPOINTS.GET_BUSINESS(businessId));
  const business = Array.isArray(response) ? response[0] : response;
  if (!business) throw new Error('Negocio no encontrado');
  if (isDevelopment) console.log("🖼️ Datos del negocio completo:", business);
  return {
    id_business:  business.idCommerce,
    id_user:      business.idOwner,
    name:         business.name         || '',
    description:  business.description  || '',
    email:        business.email        || '',
    phone:        business.phone        || '',
    link:         business.website      || '',
    instagram:    business.instagram    || '',
    facebook:     business.facebook     || '',
    whatsapp:     business.whatsapp     || '',
    branchOf:     business.branchOf     || null,
    profileImage: business.profileImage?.url || null,
    coverImage:   business.coverImage?.url   || null,
    schedules:    business.schedules    || [],
    address:      business.address      || null, // ← faltaba
    category:     business.category     || null,
    tags:         business.tags         || [],
  };
};

export const createBusiness = async (businessData) => {
  validateParams({ businessData }, ['businessData']);
  if (!businessData.name?.trim()) throw new Error('El nombre es obligatorio');
  if (!businessData.description?.trim()) throw new Error('La descripción es obligatoria');

  const dataToSend = {
    name:        businessData.name.trim(),
    description: businessData.description.trim(),
    phone:       businessData.phone?.trim()     || null,
    website:     businessData.website?.trim()   || null,
    instagram:   businessData.instagram?.trim() || null,
    facebook:    businessData.facebook?.trim()  || null,
    whatsapp:    businessData.whatsapp?.trim()  || null,
    email:       businessData.email?.trim()     || null,
    branchOf:    businessData.branchOf          || null,
    schedules:   businessData.schedules ? scheduleToBackend(businessData.schedules) : [],
    address:     buildAddressDto(businessData.location),
  };

  if (isDevelopment) {
    console.log("📤 Creando negocio:", dataToSend);
    console.log("📍 AddressDto enviado:", dataToSend.address);
  }

  try {
    const response = await apiRequest('POST', ENDPOINTS.CREATE_BUSINESS, dataToSend);
    if (isDevelopment) console.log("📦 Respuesta:", response);
    return {
      id_business:  response.idCommerce,
      id_user:      response.idOwner,
      name:         response.name,
      description:  response.description,
      email:        response.email,
      phone:        response.phone,
      website:      response.website,
      profileImage: response.profileImage?.url || null,
      coverImage:   response.coverImage?.url   || null,
    };
  } catch (error) {
    console.error("❌ Error en createBusiness:", error);
    if (error.status === 403) error.isPlanError = true;
    throw error;
  }
};

export const updateBusiness = async (businessId, businessData) => {
  validateParams({ businessId, businessData }, ['businessId', 'businessData']);
  if (businessData.name !== undefined && businessData.name.trim() === '')
    throw new Error('El nombre no puede estar vacío');
  if (businessData.description !== undefined && businessData.description.trim() === '')
    throw new Error('La descripción no puede estar vacía');

  const dataToSend = {};
  if (businessData.name        !== undefined) dataToSend.name        = businessData.name.trim();
  if (businessData.description !== undefined) dataToSend.description = businessData.description.trim();
  if (businessData.email       !== undefined) dataToSend.email       = businessData.email.trim() || null;
  if (businessData.phone       !== undefined) dataToSend.phone       = businessData.phone.replace(/\D/g, '') || null;
  if (businessData.link        !== undefined) dataToSend.website     = businessData.link.trim() || null;
  if (businessData.instagram   !== undefined) dataToSend.instagram   = businessData.instagram.trim() || null;
  if (businessData.facebook    !== undefined) dataToSend.facebook    = businessData.facebook.trim() || null;
  if (businessData.branchOf    !== undefined) dataToSend.branchOf    = businessData.branchOf;
  if (businessData.location    !== undefined) dataToSend.address     = buildAddressDto(businessData.location);

  if (isDevelopment) {
    console.log("📤 Actualizando negocio:", businessId, dataToSend);
    console.log("📍 AddressDto enviado:", dataToSend.address);
  }

  const response = await apiRequest('PUT', ENDPOINTS.UPDATE_BUSINESS(businessId), dataToSend);
  if (isDevelopment) console.log("📦 Respuesta update:", response);

  return {
    id_business:  response.idCommerce,
    id_user:      response.idOwner,
    name:         response.name,
    description:  response.description,
    email:        response.email,
    phone:        response.phone,
    link:         response.website,
    instagram:    response.instagram,
    facebook:     response.facebook,
    whatsapp:     response.whatsapp,
    branchOf:     response.branchOf,
    profileImage: response.profileImage?.url || null,
    coverImage:   response.coverImage?.url   || null,
  };
};
// ============================================
// IMÁGENES DE COMERCIO
// ============================================

export const uploadProfileImage = async (businessId, imageFile) => {
  validateParams({ businessId, imageFile }, ['businessId', 'imageFile']);
  if (!(imageFile instanceof File)) throw new Error('Archivo inválido');
  if (imageFile.size > 5*1024*1024) throw new Error('La imagen no puede superar los 5MB');
  if (!['image/jpeg','image/jpg','image/png','image/webp'].includes(imageFile.type)) throw new Error('Formato inválido. Usa JPG, PNG o WebP');
  const formData = new FormData();
  formData.append('image', imageFile);
  try {
    const response = await axios.post(`${API_URL}${ENDPOINTS.UPLOAD_PROFILE_IMAGE(businessId)}`, formData, { headers:{'Content-Type':'multipart/form-data','ngrok-skip-browser-warning':'true'}, timeout:30000 });
    await sleep(1000);
    const updated = await getBusinessById(businessId);
    return { success:true, profileImage:updated.profileImage, cloudinaryData:response.data };
  } catch (error) { throw handleApiError(error, 'uploadProfileImage'); }
};

export const uploadCoverImage = async (businessId, imageFile) => {
  validateParams({ businessId, imageFile }, ['businessId', 'imageFile']);
  if (!(imageFile instanceof File)) throw new Error('Archivo inválido');
  if (imageFile.size > 5*1024*1024) throw new Error('La imagen no puede superar los 5MB');
  if (!['image/jpeg','image/jpg','image/png','image/webp'].includes(imageFile.type)) throw new Error('Formato inválido. Usa JPG, PNG o WebP');
  const formData = new FormData();
  formData.append('image', imageFile);
  try {
    const response = await axios.post(`${API_URL}${ENDPOINTS.UPLOAD_COVER_IMAGE(businessId)}`, formData, { headers:{'Content-Type':'multipart/form-data','ngrok-skip-browser-warning':'true'}, timeout:30000 });
    await sleep(1000);
    const updated = await getBusinessById(businessId);
    return { success:true, coverImage:updated.coverImage, cloudinaryData:response.data };
  } catch (error) { throw handleApiError(error, 'uploadCoverImage'); }
};

export const uploadGalleryImages = async (businessId, imageFiles) => {
  validateParams({ businessId, imageFiles }, ['businessId', 'imageFiles']);
  if (!Array.isArray(imageFiles) || imageFiles.length===0) throw new Error('Al menos una imagen');
  if (imageFiles.length>10) throw new Error('Máximo 10 imágenes');
  for (const f of imageFiles) { if (f.size>5*1024*1024) throw new Error(`"${f.name}" supera los 5MB`); }
  const formData = new FormData();
  imageFiles.forEach(f => formData.append('files', f));
  try {
    const response = await axios.post(`${API_URL}${ENDPOINTS.UPLOAD_GALLERY_IMAGES(businessId)}`, formData, { headers:{'Content-Type':'multipart/form-data','ngrok-skip-browser-warning':'true'}, timeout:60000 });
    return response.data;
  } catch (error) { throw handleApiError(error, 'uploadGalleryImages'); }
};

// ============================================
// PUBLICACIONES
// ============================================

export const getPostsByCommerce = async (commerceId) => {
  validateParams({ commerceId }, ['commerceId']);
  try {
    const response = await apiRequest('GET', ENDPOINTS.POST_GET_BY_COMMERCE(commerceId));
    return Array.isArray(response) ? response : [];
  } catch (error) { if (error.message.includes('404')) return []; throw error; }
};

export const createPost = async (description, idCommerce, imageFiles=[], eventData=null) => {
  validateParams({ description, idCommerce }, ['description', 'idCommerce']);
  if (!imageFiles?.length) throw new Error('Debes subir al menos una imagen');
  if (imageFiles.length>10) throw new Error('Máximo 10 imágenes');
  for (const f of imageFiles) {
    if (!(f instanceof File)) throw new Error('Archivo inválido');
    if (f.size>5*1024*1024) throw new Error(`"${f.name}" supera los 5MB`);
    if (!['image/jpeg','image/jpg','image/png','image/webp'].includes(f.type)) throw new Error(`Formato inválido en "${f.name}"`);
  }
  const formData = new FormData();
  if (eventData) {
    formData.append('eventData', JSON.stringify(eventData));
  }
  formData.append('description', description.trim());
  formData.append('idCommerce', idCommerce);
  imageFiles.forEach(f => formData.append('images', f));
  try {
    const response = await axios.post(`${API_URL}${ENDPOINTS.POST_CREATE}`, formData, { headers:{'Content-Type':'multipart/form-data','ngrok-skip-browser-warning':'true'}, timeout:60000 });
    return response.data;
  } catch (error) {
    const err = handleApiError(error, 'createPost');
    if (err.status === 403) err.isPlanError = true;
    throw err;
  }
};

export const getAllPosts = async () => apiRequest('GET', ENDPOINTS.POST_GET_ALL);
export const getPostById = async (postId) => { validateParams({postId},['postId']); return apiRequest('GET', ENDPOINTS.POST_GET_BY_ID(postId)); };

export const updatePostText = async (postId, description, idCommerce) => {
  validateParams({ postId, description, idCommerce }, ['postId','description','idCommerce']);
  if (!description?.trim()) throw new Error('La descripción no puede estar vacía');
  const response = await apiRequest('PUT', ENDPOINTS.POST_UPDATE(postId), { description:description.trim(), idCommerce });
  return normalizePostFromBackend(response);
};

export const updatePost = async (postId, postData) => {
  validateParams({ postId, postData }, ['postId','postData']);
  if (!postData.description?.trim()) throw new Error('La descripción no puede estar vacía');
  return apiRequest('PUT', ENDPOINTS.POST_UPDATE(postId), { description:postData.description.trim(), idCommerce:postData.idCommerce });
};

export const deletePost = async (postId) => {
  validateParams({ postId }, ['postId']);
  try {
    const response = await axios.delete(`${API_URL}${ENDPOINTS.POST_DELETE(postId)}`, { timeout:TIMEOUT, headers:{'ngrok-skip-browser-warning':'true'} });
    return response.data;
  } catch (error) { throw handleApiError(error, 'deletePost'); }
};

export const addImagesToPost = async (postId, imageFiles) => {
  validateParams({ postId, imageFiles }, ['postId','imageFiles']);
  if (!Array.isArray(imageFiles)||imageFiles.length===0) throw new Error('Al menos una imagen');
  const formData = new FormData();
  imageFiles.forEach(f => formData.append('images', f));
  try {
    const response = await axios.post(`${API_URL}${ENDPOINTS.POST_ADD_IMAGES(postId)}`, formData, { headers:{'Content-Type':'multipart/form-data','ngrok-skip-browser-warning':'true'}, timeout:60000 });
    return response.data;
  } catch (error) { throw handleApiError(error, 'addImagesToPost'); }
};

export const deleteImagesFromPost = async (postId, imageIds) => {
  validateParams({ postId, imageIds }, ['postId','imageIds']);
  if (!Array.isArray(imageIds)||imageIds.length===0) throw new Error('Al menos un ID de imagen');
  try {
    const queryParams = imageIds.map(id=>`imageIds=${id}`).join('&');
    const response = await axios.delete(`${API_URL}${ENDPOINTS.POST_DELETE_IMAGES(postId)}?${queryParams}`, { headers:{'Content-Type':'application/json','ngrok-skip-browser-warning':'true'}, timeout:TIMEOUT });
    return response.data;
  } catch (error) { throw handleApiError(error, 'deleteImagesFromPost'); }
};

// ============================================
// NORMALIZADORES
// ============================================

export const normalizePostFromBackend = (post) => {
  if (post.images && Array.isArray(post.images)) {
    const sorted = post.images.sort((a,b) => a.imageOrder - b.imageOrder);
    return { id:post.idPost, text:post.description, images:sorted.map(i=>i.url), imageDetails:sorted.map(i=>({id:i.idImage,url:i.url,order:i.imageOrder,publicId:i.publicId,originalFileName:i.originalFileName})), type:"post", businessName:post.nameCommerce, createdAt:post.postedAt };
  }
  return { id:post.idPost||post.id, text:post.description||post.text, images:Array.isArray(post.images)?post.images:[], imageDetails:[], type:"post", businessName:post.nameCommerce||post.businessName, createdAt:post.postedAt||post.createdAt };
};

// ============================================
// BÚSQUEDA
// ============================================

export const searchCommerces = async (searchParam, limit=10, offset=0) => {
  if (!searchParam || searchParam.trim()==='') throw new Error('Debes ingresar un término de búsqueda');
  const params = new URLSearchParams({ searchParam:searchParam.trim(), limit:limit.toString(), offset:offset.toString() });
  try {
    if (isDevelopment) console.log('🔍 Buscando comercios:', { searchParam, limit, offset });
    const response = await apiRequest('GET', `${ENDPOINTS.SEARCH_COMMERCES}?${params}`);
    if (isDevelopment) console.log('✅ Resultados:', Array.isArray(response) ? response.length : 0);
    return Array.isArray(response) ? response : [];
  } catch (error) { if (isDevelopment) console.error('❌ Error búsqueda:', error); throw error; }
};

// ============================================
// FAVORITOS Y GUARDADOS - ACTUALIZADOS
// ============================================

export const getFavoriteCommerces = async () => {
  try {
    const response = await apiRequest('GET', ENDPOINTS.FAV_COMMERCES_GET);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    if (error.message?.includes('404')) return [];
    throw error;
  }
};

export const addFavoriteCommerce = async (idCommerce) => {
  validateParams({ idCommerce }, ['idCommerce']);
  return apiRequest('POST', ENDPOINTS.FAV_COMMERCE_ADD(idCommerce));
};

export const removeFavoriteCommerce = async (idCommerce) => {
  validateParams({ idCommerce }, ['idCommerce']);
  return apiRequest('DELETE', ENDPOINTS.FAV_COMMERCE_REMOVE(idCommerce));
};

export const getSavedPosts = async () => {
  try {
    const response = await apiRequest('GET', ENDPOINTS.SAVED_POSTS_GET);
    const posts = Array.isArray(response) ? response : [];
    // El backend devuelve cada imagen como ImageDto ({ url, imageOrder, ... }),
    // no como string. Sin este mapeo, cualquier <img src={post.images[0]}>
    // (ej. Favorites.jsx) recibe un objeto en vez de una URL y no muestra nada.
    // Mismo criterio de normalización que Home.jsx usa para el feed principal.
    return posts.map((p) => ({
      ...p,
      images: Array.isArray(p.images)
        ? [...p.images]
            .sort((a, b) => (a.imageOrder || 0) - (b.imageOrder || 0))
            .map((i) => i.url || i)
        : [],
    }));
  } catch (error) {
    if (error.message?.includes('404')) return [];
    throw error;
  }
};

export const addSavedPost = async (idPost) => {
  validateParams({ idPost }, ['idPost']);
  return apiRequest('POST', ENDPOINTS.SAVED_POST_ADD(idPost));
};

export const removeSavedPost = async (idPost) => {
  validateParams({ idPost }, ['idPost']);
  return apiRequest('DELETE', ENDPOINTS.SAVED_POST_REMOVE(idPost));
};

// ============================================
// COMERCIOS RECIENTES
// ============================================

export const getRecentCommerces = async () => {
  const response = await apiRequest('GET', ENDPOINTS.GET_RECENT_COMMERCES);
  return Array.isArray(response) ? response : [];
};

// ============================================
// FEED PRINCIPAL - ACTUALIZADO
// ============================================

export const getMainFeed = async (page = 0, size = 10) => {
  const response = await apiRequest('GET', `${ENDPOINTS.MAIN_FEED}?page=${page}&size=${size}`);
  return Array.isArray(response) ? response : [];
};
// ============================================
// CATEGORIAS
// ============================================
// El backend solo soporta UNA categoría por comercio (campo `category`, no
// `categories`), asignada vía este endpoint dedicado — no vía el DTO de comercio.
export const setCommerceCategory = async (commerceId, idCategory) => {
  validateParams({ commerceId, idCategory }, ['commerceId', 'idCategory']);
  return apiRequest('PUT', `${ENDPOINTS.SET_COMMERCE_CATEGORY(commerceId)}?idCategory=${idCategory}`);
};

export const getCommercesByCategories = async (categoryIds) => {
  validateParams({ categoryIds }, ['categoryIds']);
  if (!Array.isArray(categoryIds) || categoryIds.length === 0) throw new Error('Seleccioná al menos una categoría');
  const queryParams = categoryIds.map(id => `categoryIds=${id}`).join('&');
  try {
    const response = await apiRequest('GET', `${ENDPOINTS.GET_COMMERCES_BY_CATEGORIES}?${queryParams}`);
    return Array.isArray(response) ? response : [];
  } catch (error) { if (isDevelopment) console.error('Error filtrando por categorías:', error); throw error; }
};


// ============================================
// ETIQUETAS DE COMERCIO (clasificación para "Explorá más")
// ============================================
// El backend ya expone POST /comercio/agregar/etiquetas/{idCommerce}, que
// recibe un array de STRINGS (nombres de etiqueta), no de TagDto. Usamos
// nombres fijos y en texto plano para poder filtrar después con
// searchCommerces() (operationId del backend: searchCommercesByNameOrTag),
// que ya matchea por nombre de comercio O de etiqueta.
//
// ⚠️ Asunción a confirmar con el backend (ver mensaje aparte para el equipo
// de back): que agregar/etiquetas crea la etiqueta si el nombre no existe
// todavía (upsert por nombre) y no falla ni duplica si ya existe.
export const addCommerceTags = async (idCommerce, tagNames) => {
  validateParams({ idCommerce, tagNames }, ['idCommerce', 'tagNames']);
  if (!Array.isArray(tagNames) || tagNames.length === 0) return null;
  return apiRequest('POST', `/comercio/agregar/etiquetas/${idCommerce}`, tagNames);
};

export const removeCommerceTagIds = async (idCommerce, tagIds) => {
  validateParams({ idCommerce, tagIds }, ['idCommerce', 'tagIds']);
  if (!Array.isArray(tagIds) || tagIds.length === 0) return null;
  try {
    const { accessToken } = getStoredTokens();
    const response = await axios.delete(
      `${API_URL}/comercio/eliminar/etiquetas/${idCommerce}`,
      {
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        data: tagIds,
        timeout: TIMEOUT,
      }
    );
    return response.data;
  } catch (error) { throw handleApiError(error, 'removeCommerceTagIds'); }
};

// ============================================
// DESTACADOS / CARRUSEL
// ============================================
export const getFeaturedSection = async (carouselPage = 0, carouselSize = 5) => {
  const response = await apiRequest(
    'GET',
    `/destacado?carouselPage=${carouselPage}&carouselSize=${carouselSize}`
  );
  return response; // { carousel: FeaturedItemDto[], featured: FeaturedItemDto[] }
};

/**
 * Trae promociones activas para la caja "Promociones y Descuentos" de
 * Explorá más.
 *
 * ⚠️ Solución provisoria: no existe todavía un endpoint público que liste
 * TODAS las promociones activas de TODOS los comercios (solo está
 * /promocion/traer/mis/promociones, que es privado y trae las del dueño
 * logueado). Mientras tanto, reutilizamos /destacado (getFeaturedSection),
 * que ya devuelve ítems de tipo PROMOTION dentro de su selección algorítmica
 * para el carrusel del Home. Pedimos un lote grande y filtramos las
 * promociones ACTIVE.
 *
 * Ojo: esto NO garantiza traer 100% de las promociones activas que existan
 * — /destacado arma una selección (probablemente rotativa/curada), no un
 * listado exhaustivo. Para que esta caja sea realmente completa hace falta
 * que el back agregue un endpoint tipo GET /promocion/traer/activas
 * (público, sin auth, con limit/offset como /comercio/buscar).
 */
export const getActivePromotions = async () => {
  try {
    const section = await getFeaturedSection(0, 50);
    const items = [...(section?.carousel || []), ...(section?.featured || [])];
    const seen = new Set();
    const promotions = [];
    items.forEach((item) => {
      if (item?.type !== 'PROMOTION') return;
      const promo = item.data;
      if (!promo || promo.status !== 'ACTIVE') return;
      if (seen.has(promo.idPromotion)) return;
      seen.add(promo.idPromotion);
      promotions.push(promo);
    });
    return promotions;
  } catch (error) {
    if (isDevelopment) console.error('❌ Error trayendo promociones activas:', error);
    return [];
  }
};




// ============================================
// EVENTOS
// ============================================

export const createEvent = async (eventData, imageFiles = []) => {
  validateParams({ eventData }, ['eventData']);
  if (!imageFiles?.length) throw new Error('Debes subir al menos una imagen');

  const formData = new FormData();
  formData.append('title',            eventData.title);
  formData.append('description',      eventData.description);
  formData.append('startDate',        eventData.startDate);   // formato ISO: "2026-04-10T20:00:00"
  formData.append('endDate',          eventData.endDate);
  formData.append('idCommerceOwner',  eventData.idCommerceOwner);
  // El backend arma el AddressDto por binding de campos individuales (no un JSON
  // suelto): cada propiedad va con el prefijo "address." como campo de FormData.
  if (eventData.address) {
    const addr = eventData.address;
    if (addr.address)     formData.append('address.address',  addr.address);
    if (addr.street)      formData.append('address.street',   addr.street);
    if (addr.district)    formData.append('address.district', addr.district);
    if (addr.location)    formData.append('address.location', addr.location);
    if (addr.lat != null) formData.append('address.lat',      addr.lat);
    if (addr.lng != null) formData.append('address.lng',      addr.lng);
  }
  imageFiles.forEach(f => formData.append('images', f));

  try {
    const { accessToken } = getStoredTokens();
    const response = await axios.post(
      `${API_URL}${ENDPOINTS.CREATE_EVENT}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'ngrok-skip-browser-warning': 'true',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        timeout: 60000
      }
    );
    return response.data;
  } catch (error) {
    const err = handleApiError(error, 'createEvent');
    if (err.status === 403) err.isPlanError = true;
    throw err;
  }
};

export const getAllEvents = async () => apiRequest('GET', ENDPOINTS.GET_ALL_EVENTS);

export const getEventById = async (id) => {
  validateParams({ id }, ['id']);
  return apiRequest('GET', ENDPOINTS.GET_EVENT_BY_ID(id));
};

export const updateEvent = async (id, eventDto) => {
  validateParams({ id, eventDto }, ['id', 'eventDto']);
  return apiRequest('PUT', ENDPOINTS.UPDATE_EVENT(id), eventDto);
};

export const deleteEvent = async (id) => {
  validateParams({ id }, ['id']);
  return apiRequest('DELETE', ENDPOINTS.DELETE_EVENT(id));
};

export const addImagesToEvent = async (id, imageFiles) => {
  validateParams({ id, imageFiles }, ['id', 'imageFiles']);
  if (!Array.isArray(imageFiles) || imageFiles.length === 0) throw new Error('Al menos una imagen');
  const formData = new FormData();
  imageFiles.forEach(f => formData.append('images', f));
  try {
    const response = await axios.post(
      `${API_URL}${ENDPOINTS.ADD_IMAGES_TO_EVENT(id)}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': 'true' }, timeout: 60000 }
    );
    return response.data;
  } catch (error) { throw handleApiError(error, 'addImagesToEvent'); }
};

export const deleteImagesFromEvent = async (id, imageIds) => {
  validateParams({ id, imageIds }, ['id', 'imageIds']);
  if (!Array.isArray(imageIds) || imageIds.length === 0) throw new Error('Al menos un ID');
  const queryParams = imageIds.map(imgId => `eventIds=${imgId}`).join('&');
  try {
    const { accessToken } = getStoredTokens();
    const response = await axios.delete(
      `${API_URL}${ENDPOINTS.DELETE_IMAGES_FROM_EVENT(id)}?${queryParams}`,
      { headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }, timeout: TIMEOUT }
    );
    return response.data;
  } catch (error) { throw handleApiError(error, 'deleteImagesFromEvent'); }
};

export const getEventsByCommerce = async (commerceId) => {
  validateParams({ commerceId }, ['commerceId']);
  try {
    const response = await apiRequest('GET', `/evento/traer/comercio/${commerceId}`);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    if (error.message?.includes('404')) return [];
    throw error;
  }
};

// ============================================
// PROMOCIONES — agregar al final de Api.jsx
// ============================================

export const getPromotionTags = async () =>
  apiRequest('GET', '/etiqueta/promocion');

// Trae TODAS las etiquetas (cualquier type: SUBCATEGORY/DESCRIPTIVE/PROMOTIONAL).
// No hay un endpoint dedicado para DESCRIPTIVE como sí lo hay para las otras
// dos (/etiqueta/subcategoria y /etiqueta/promocion), así que para armar la
// lista de sugerencias de tags descriptivos hay que traer todo y filtrar acá.
export const getTags = async () =>
  apiRequest('GET', '/etiqueta/traer');

// Endpoint dedicado a subcategorías: /etiqueta/subcategoria. Devuelve
// TagDto (nameTag, type, idCategory) — SIN idTag. Sirve para mostrar y
// agrupar subcategorías por categoría (idCategory viene plano, no anidado
// en .category como en el schema Tag de /etiqueta/traer).
// Si necesitás el idTag real (por ejemplo para borrar una subcategoría
// puntual de un comercio vía removeCommerceTagIds), hay que resolverlo
// aparte con getTags() (/etiqueta/traer) en el momento de guardar/borrar,
// no acá.
export const getSubcategoryTags = async () =>
  apiRequest('GET', ENDPOINTS.GET_SUBCATEGORY_TAGS);

export const getDescriptiveTags = async () => {
  const all = await getTags();
  return Array.isArray(all) ? all.filter(t => t.type === 'DESCRIPTIVE') : [];
};

// Crea una etiqueta nueva en el catálogo del backend (para cuando el dueño
// escribe un tag descriptivo que todavía no existe, ej: "brunch"). El
// endpoint es /etiqueta/guardar y espera { nameTag, type }.
export const createTag = async (nameTag, type) => {
  validateParams({ nameTag, type }, ['nameTag', 'type']);
  return apiRequest('POST', '/etiqueta/guardar', { nameTag: nameTag.trim(), type });
};

// Asigna subcategorías a un comercio. A diferencia de las etiquetas
// genéricas (que van por /comercio/agregar/etiquetas), las subcategorías
// tienen su propio endpoint dedicado según el swagger.
// ⚠️ Asunción a confirmar con el back (mismo caso que addCommerceTags): que
// hace upsert por nombre y no falla si ya existe. Tampoco hay un endpoint
// separado para ELIMINAR subcategorías puntuales — asumimos que
// removeCommerceTagIds (genérico, por id) sirve para cualquier tipo de tag,
// subcategoría incluida.
export const addCommerceSubcategories = async (idCommerce, tagNames) => {
  validateParams({ idCommerce, tagNames }, ['idCommerce', 'tagNames']);
  if (!Array.isArray(tagNames) || tagNames.length === 0) return null;
  return apiRequest('POST', `/comercio/agregar/subcategorias/${idCommerce}`, tagNames);
};

/**
 * Trae las promociones del usuario logueado.
 *
 * OJO: el endpoint /promocion/traer/mis/promociones filtra en el backend
 * SOLO por el usuario dueño (id_user), no por comercio. Si el usuario tiene
 * varios comercios (ej. carnicería + rotisería + verdulería), este endpoint
 * devuelve las promociones de TODOS mezcladas.
 *
 * Como PromotionResponseDto sí incluye `idCommerce` en cada promoción,
 * filtramos acá del lado del cliente por el comercio que se está viendo,
 * para que cada perfil de negocio muestre únicamente sus propias promos.
 *
 * Lo ideal a futuro es que el backend agregue un filtro por idCommerce
 * directamente en el endpoint (o una ruta dedicada tipo
 * /promocion/traer/comercio/{idCommerce}), para no traer de más por red.
 *
 * @param {number|string} [idCommerce] - si se pasa, filtra el resultado a
 *   ese comercio. Si se omite, devuelve todas las promociones del usuario
 *   sin filtrar (comportamiento anterior, por compatibilidad).
 */
export const getMisPromociones = async (idCommerce) => {
  try {
    const response = await apiRequest('GET', '/promocion/traer/mis/promociones');
    const promos = Array.isArray(response) ? response : [];
    if (idCommerce == null) return promos;
    return promos.filter((p) => Number(p.idCommerce) === Number(idCommerce));
  } catch (error) {
    if (error.status === 403) throw { ...error, isPlanError: true };
    if (error.message?.includes('404')) return [];
    throw error;
  }
};

export const createPromotion = async (commerceId, dto) => {
  validateParams({ commerceId, dto }, ['commerceId', 'dto']);
  return apiRequest('POST', `/promocion/crear/${commerceId}`, dto);
};

export const updatePromotion = async (idPromocion, dto) => {
  validateParams({ idPromocion, dto }, ['idPromocion', 'dto']);
  return apiRequest('PUT', `/promocion/editar/${idPromocion}`, dto);
};

export const deletePromotion = async (idPromocion) => {
  validateParams({ idPromocion }, ['idPromocion']);
  return apiRequest('DELETE', `/promocion/eliminar/${idPromocion}`);
};

export const uploadPromotionImage = async (idPromocion, imageFile) => {
  validateParams({ idPromocion, imageFile }, ['idPromocion', 'imageFile']);
  if (!(imageFile instanceof File)) throw new Error('Archivo inválido');
  if (imageFile.size > 5 * 1024 * 1024) throw new Error('La imagen no puede superar los 5MB');
  const formData = new FormData();
  formData.append('image', imageFile);
  try {
    const { accessToken } = getStoredTokens();
    const response = await axios.post(
      `${API_URL}/promocion/establecer/imagen/${idPromocion}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'ngrok-skip-browser-warning': 'true',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        timeout: 30000,
      }
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'uploadPromotionImage');
  }
};

export const activatePromotion = async (idPromocion, confirmarPausa = false) => {
  validateParams({ idPromocion }, ['idPromocion']);
  try {
    return await apiRequest('POST', `/promocion/activar/${idPromocion}?confirmarPausa=${confirmarPausa}`);
  } catch (error) {
    if (error.status === 409) throw { ...error, isConflict: true };
    throw error;
  }
};

export const pausePromotion = async (idPromocion) => {
  validateParams({ idPromocion }, ['idPromocion']);
  return apiRequest('POST', `/promocion/pausar/${idPromocion}`);
};

export const getPromotionMetrics = async (idPromocion) => {
  validateParams({ idPromocion }, ['idPromocion']);
  return apiRequest('GET', `/promocion/metricas/${idPromocion}`);
};

export const registerPromotionView = async (idPromocion) => {
  try {
    await apiRequest('POST', `/promocion/vista/${idPromocion}`);
  } catch { /* silencioso */ }
};

export const registerPromotionClick = async (idPromocion) => {
  try {
    await apiRequest('POST', `/promocion/click/${idPromocion}`);
  } catch { /* silencioso */ }
};

// ============================================
// PLANES Y SUSCRIPCIONES
// ============================================
//
// ⚠️ OJO — dos cosas a tener presente si esto tira errores raros:
//
// 1) El front identifica los planes con ids "amigables" (basic/mid/premium,
//    ver Plans.jsx y CheckoutPage.jsx), pero el backend los identifica de DOS
//    formas distintas según el endpoint:
//      - POST /suscripcion/suscribirse  → body {planId, referencedEmail?}
//        espera el idPlan NUMÉRICO (dentro del body, no en la URL)
//      - PUT  /suscripcion/cambiar/plan?nuevoPlan=X → espera el PlanType STRING
//        (BASIC | INTERMEDIATE | PREMIUM)
//    No hay forma de ir de "basic" al idPlan sin primero pedir /plan/traer y
//    buscar por planType. resolveBackendPlanId() hace exactamente eso. Si el
//    backend algún día cambia los nombres del enum, hay que actualizar el
//    mapa FRONT_PLAN_ID_TO_TYPE de abajo.
//
// 2) En el OpenAPI, /suscripcion/verificar devuelve `type: object` genérico
//    (sin DTO tipado), a diferencia de /suscripcion/mi-suscripcion que sí
//    devuelve SubscriptionResponseDto. No asumas la forma de la respuesta de
//    verificar() sin probarla contra el backend real primero.

export const FRONT_PLAN_ID_TO_TYPE = {
  basic: 'BASIC',
  mid: 'INTERMEDIATE',
  premium: 'PREMIUM',
};

export const getPlans = async () => apiRequest('GET', '/plan/traer');

export const getPlanById = async (idPlan) => {
  validateParams({ idPlan }, ['idPlan']);
  return apiRequest('GET', `/plan/traer/${idPlan}`);
};

/**
 * Resuelve el idPlan numérico del backend a partir del id "amigable" del
 * frontend (basic/mid/premium): trae la lista real de planes y busca por
 * planType. Tira error explícito en vez de fallar en silencio más adelante
 * durante el pago.
 */
export const resolveBackendPlanId = async (frontPlanId) => {
  const planType = FRONT_PLAN_ID_TO_TYPE[frontPlanId];
  if (!planType) throw new Error(`Plan desconocido: "${frontPlanId}"`);
  const plans = await getPlans();
  const match = Array.isArray(plans) ? plans.find(p => p.planType === planType) : null;
  if (!match) throw new Error(`No se encontró el plan "${planType}" en el backend`);
  return match.idPlan;
};

export const subscribeToPlan = async (idPlan, referencedEmail = null) => {
  validateParams({ idPlan }, ['idPlan']);
  // Devuelve MpSubscriptionResponseDto: { initPoint, mpSubscriptionId, status }
  // referencedEmail es opcional — si no se manda, el backend usa el email de
  // la cuenta logueada. Sirve para probar con una cuenta de comprador de
  // test de Mercado Pago sin cambiar el email real de la cuenta.
  const body = { planId: idPlan };
  if (referencedEmail) body.referencedEmail = referencedEmail;
  return apiRequest('POST', '/suscripcion/suscribirse', body);
};

export const getMySubscription = async () =>
  apiRequest('GET', '/suscripcion/mi-suscripcion');

export const verifyMySubscription = async () =>
  apiRequest('GET', '/suscripcion/verificar');

export const changePlan = async (nuevoPlan) => {
  validateParams({ nuevoPlan }, ['nuevoPlan']);
  if (!['BASIC', 'INTERMEDIATE', 'PREMIUM'].includes(nuevoPlan)) {
    throw new Error(`Plan inválido: "${nuevoPlan}"`);
  }
  return apiRequest('PUT', `/suscripcion/cambiar/plan?nuevoPlan=${nuevoPlan}`);
};

export const cancelSubscription = async () =>
  apiRequest('DELETE', '/suscripcion/cancelar');

// ============================================
// EXPORTACIÓN
// ============================================

export default {
  loginUser, registerUser, logoutUser,
  setAuthToken, getStoredTokens, saveTokens, clearTokens,
  getMyUser, updateUser, deleteUser,
  searchCommerces, getRecentCommerces,
  getCategories,
  getImages, uploadImage,
  getAllCommerces,
  getMyBusiness, getMyCommerces, getBusinessByUserId, getBusinessById, createBusiness, updateBusiness,
  uploadProfileImage, uploadCoverImage, uploadGalleryImages,
  createPost, getAllPosts, getPostById, getPostsByCommerce,
  updatePost, updatePostText, deletePost, addImagesToPost, deleteImagesFromPost,
  normalizePostFromBackend,
  getMainFeed,
  getFavoriteCommerces, addFavoriteCommerce, removeFavoriteCommerce,
  getSavedPosts, addSavedPost, removeSavedPost,
  capitalizeFirstLetter, validateEmail, validatePasswordStrength,
  replaceCommerceSchedules,
  scheduleToBackend,
  scheduleFromBackend, setCommerceCategory, getCommercesByCategories,
  createEvent, getAllEvents, getEventById, updateEvent, deleteEvent, addImagesToEvent, deleteImagesFromEvent, toLocalDateTime,
  getFeaturedSection,
  getActivePromotions,
  getPromotionTags,
  getMisPromociones,
  createPromotion,
  updatePromotion,
  deletePromotion,
  uploadPromotionImage,
  activatePromotion,
  pausePromotion,
  getPromotionMetrics,
  registerPromotionView,
  registerPromotionClick,
  getPlans,
  getPlanById,
  resolveBackendPlanId,
  subscribeToPlan,
  getMySubscription,
  verifyMySubscription,
  changePlan,
  cancelSubscription,
  addCommerceTags,
  removeCommerceTagIds,
  isCommerceOpenNow,
  isEventToday,
};