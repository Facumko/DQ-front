import { useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../UserContext";
import { saveTokens } from "../../Api/Api";

export default function OAuth2RedirectHandler() {
  const navigate = useNavigate();
  const { setUser, loadFavorites, loadBusinesses } = useContext(UserContext);
  const processed = useRef(false); // evita doble ejecución en Strict Mode

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const params = new URLSearchParams(window.location.hash.substring(1));

    // Leer directamente los params hash que manda el backend
    const accessToken  = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const idUser       = params.get("idUser");
    const name         = params.get("name");
    const lastname     = params.get("lastname");
    const email        = params.get("email");

    if (!accessToken || !refreshToken) {
      console.error("OAuth2: faltan tokens en la URL");
      navigate("/", { replace: true });
      return;
    }

    try {
      // 1. Guardar tokens (igual que login normal)
      saveTokens(accessToken, refreshToken);

      // 2. Construir objeto de usuario
      const userData = {
        id_user:   idUser,
        email,
        name,
        lastname,
        lastLogin: new Date().toISOString(),
      };

      // 3. Guardar en el contexto y localStorage
      setUser?.(userData);
      localStorage.setItem("user", JSON.stringify(userData));

      // 4. Cargar favoritos y negocios
      if (idUser) {
        Promise.all([
          loadFavorites?.(),
          loadBusinesses?.(),
        ]).catch(() => {});
      }

      // 5. Limpiar tokens de la URL por seguridad
      window.history.replaceState({}, document.title, window.location.pathname);

      // 6. Redirigir
      const returnTo = sessionStorage.getItem("oauth2_return_to") || "/";
      sessionStorage.removeItem("oauth2_return_to");
      navigate(returnTo, { replace: true });

    } catch (err) {
      console.error("OAuth2RedirectHandler error:", err);
      navigate("/", { replace: true });
    }
  }, [navigate, setUser, loadFavorites, loadBusinesses]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      gap: "16px",
      color: "#666",
    }}>
      <div style={{
        width: "40px",
        height: "40px",
        border: "3px solid #e2e8f0",
        borderTop: "3px solid #B00020",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ margin: 0, fontSize: "15px" }}>Iniciando sesión...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}