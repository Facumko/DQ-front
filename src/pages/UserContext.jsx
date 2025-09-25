import { createContext, useState, useEffect } from "react";
import { loginUser, registerUser } from "../Api/Api";

export const UserContext = createContext();

export function UserProvider({ children }) {
  // Estado del usuario, inicial desde localStorage si existe
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Estados para manejar la conexión asíncrona
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función de login asíncrona mejorada
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = await loginUser(email, password);
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return { success: true, data: userData };
    } catch (err) {
      const errorMessage = err.message || "Error al iniciar sesión";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Función de registro asíncrona
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const newUser = await registerUser(userData);
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
      return { success: true, data: newUser };
    } catch (err) {
      const errorMessage = err.message || "Error al registrar usuario";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Cerrar sesión: limpia estado y localStorage
  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem("user");
    
    // Opcional: llamar al backend para invalidar sesión en el servidor
    // logoutUser().catch(err => console.warn("Error al cerrar sesión en servidor:", err));
  };

  // Función para actualizar datos del usuario
  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  // Función para limpiar errores manualmente
  const clearError = () => {
    setError(null);
  };

  // Función para verificar si el usuario está autenticado
  const isAuthenticated = () => {
    return user !== null;
  };

  // Verificar sesión al cargar la aplicación
  useEffect(() => {
    const checkSession = async () => {
      const storedUser = localStorage.getItem("user");
      
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          
          // Opcional: verificar en el backend si la sesión sigue siendo válida
          // const isValid = await validateSession(userData.token);
          // if (!isValid) {
          //   localStorage.removeItem("user");
          //   setUser(null);
          //   return;
          // }
          
          setUser(userData);
        } catch (error) {
          console.warn("Error al verificar sesión:", error);
          localStorage.removeItem("user");
          setUser(null);
        }
      }
    };
    
    checkSession();
  }, []);

  // Función para manejar errores de respuesta de API
  const handleApiError = (error) => {
    if (error.response?.status === 401) {
      // Token expirado o no válido, cerrar sesión automáticamente
      logout();
      setError("Sesión expirada. Por favor inicia sesión nuevamente.");
    } else {
      setError(error.message || "Error de conexión");
    }
  };

  // Valores que se proporcionan a través del contexto
  const contextValue = {
    // Estados
    user,
    loading,
    error,
    
    // Funciones principales
    login,
    register,
    logout,
    updateUser,
    
    // Funciones de utilidad
    clearError,
    isAuthenticated,
    handleApiError,
    
    // Estados derivados
    isLoggedIn: isAuthenticated(),
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}