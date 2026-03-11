import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../UserContext";
import { saveTokens, getStoredTokens } from "../../Api/Api";

/**
 * Página intermediaria que maneja el callback de OAuth2 (Google / Facebook).
 *
 * FLUJO:
 * 1. Backend autentica al usuario con Google/Facebook
 * 2. Backend redirige a: http://localhost:5173/oauth2/success?accessToken=...&refreshToken=...
 * 3. Esta página captura los tokens de la URL
 * 4. Guarda los tokens con saveTokens() (mismo mecanismo que el login normal)
 * 5. Decodifica el JWT para extraer datos del usuario
 * 6. Hidrata el UserContext
 * 7. Redirige al home (o a la ruta de origen si existía)
 *
 * RUTA: /oauth2/success
 */
export default function OAuth2RedirectHandler() {
  const navigate  = useNavigate();
  const { login: _login, user, loadFavorites, loadBusinesses } = useContext(UserContext);
  const processed = useRef(false); // evita doble ejecución en Strict Mode

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const params       = new URLSearchParams(window.location.search);
    const accessToken  = params.get("accessToken");
    const refreshToken = params.get("refreshToken");

    if (!accessToken || !refreshToken) {
      // No hay tokens → algo salió mal → volver al inicio
      navigate("/", { replace: true });
      return;
    }

    try {
      // 1. Persistir tokens (mismo helper que usa loginUser)
      saveTokens(accessToken, refreshToken);

      // 2. Decodificar el payload del JWT para extraer datos del usuario
      //    (solo base64 decode, NO verificación — el backend ya la hizo)
      const payload   = JSON.parse(atob(accessToken.split(".")[1]));

      // Spring Security usa "sub" como username (en tu caso es el email)
      const email     = payload.sub || payload.email || null;

      // Claims custom que JwtUtils puede incluir (ajustá los nombres si difieren)
      const idUser    = payload.idUser   || payload.userId  || payload.id   || null;
      const name      = payload.name     || payload.given_name              || null;
      const lastname  = payload.lastname || payload.family_name             || null;
      const username  = payload.username || payload.preferred_username      || null;

      if (!idUser && !email) {
        // JWT sin datos de usuario — no podemos hidratar el contexto
        console.error("OAuth2RedirectHandler: JWT no contiene sub ni idUser");
        navigate("/", { replace: true });
        return;
      }

      // 3. Construir objeto de usuario normalizado
      //    Mismo formato que usa normalizeUser() en UserContext
      const userData = {
        id_user:  idUser,
        email,
        name,
        lastname,
        username,
        lastLogin: new Date().toISOString(),
      };

      // 4. Persistir en localStorage y en el contexto
      //    Usamos la misma clave "user" que usa el resto de la app
      localStorage.setItem("user", JSON.stringify(userData));

      // 5. Disparar carga de favoritos y negocios en paralelo (igual que en login normal)
      if (idUser) {
        Promise.all([
          loadFavorites?.(idUser),
          loadBusinesses?.(idUser),
        ]).catch(() => {/* no bloqueamos la navegación si falla */});
      }

      // 6. Limpiar los tokens de la URL antes de redirigir
      //    (seguridad: no dejar tokens visibles en el historial del navegador)
      window.history.replaceState({}, document.title, window.location.pathname);

      // 7. Navegar al home (o a donde estaba el usuario antes de loguearse)
      const returnTo = sessionStorage.getItem("oauth2_return_to") || "/";
      sessionStorage.removeItem("oauth2_return_to");
      navigate(returnTo, { replace: true });

    } catch (err) {
      console.error("OAuth2RedirectHandler: error procesando tokens", err);
      navigate("/", { replace: true });
    }
  }, [navigate, loadFavorites, loadBusinesses]);

  // UI mínima mientras procesa (menos de 1 segundo en la práctica)
  return (
    <div style={{
      display:         "flex",
      flexDirection:   "column",
      alignItems:      "center",
      justifyContent:  "center",
      minHeight:       "60vh",
      gap:             "16px",
      color:           "#666",
      fontFamily:      "inherit",
    }}>
      <div style={{
        width:           "40px",
        height:          "40px",
        border:          "3px solid #e2e8f0",
        borderTop:       "3px solid #3b82f6",
        borderRadius:    "50%",
        animation:       "spin 0.8s linear infinite",
      }} />
      <p style={{ margin: 0, fontSize: "15px" }}>Iniciando sesión…</p>

      {/* Keyframe inline para el spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}