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
      const response = await loginUser(email, password);
      console.log("Respuesta completa del backend:", response);
      
      // ✅ NORMALIZAR la respuesta del backend
      const userData = {
        id_user: response.idUser || response.id_user || response.user?.idUser || response.user?.id_user,
        username: response.username || response.user?.username,
        name: response.name || response.user?.name,
        lastname: response.lastname || response.user?.lastname,
        email: response.email || response.user?.email,
        recovery_email: response.recoveryEmail || response.recovery_email || response.user?.recoveryEmail,
        phone: response.phone || response.user?.phone,
        token: response.token || response.user?.token
      };

      console.log("Usuario normalizado:", userData);

      // ✅ Validar que tengamos el ID
      if (!userData.id_user) {
        throw new Error("No se recibió el ID del usuario del servidor");
      }

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
      const response = await registerUser(userData);
      console.log("Respuesta completa del registro:", response);
      
      // ✅ NORMALIZAR la respuesta del backend
      const newUser = {
        id_user: response.idUser || response.id_user || response.user?.idUser || response.user?.id_user,
        username: response.username || response.user?.username,
        name: response.name || response.user?.name,
        lastname: response.lastname || response.user?.lastname,
        email: response.email || response.user?.email,
        recovery_email: response.recoveryEmail || response.recovery_email || response.user?.recoveryEmail,
        phone: response.phone || response.user?.phone,
        token: response.token || response.user?.token
      };

      console.log("Usuario normalizado:", newUser);

      // ✅ Validar que tengamos el ID
      if (!newUser.id_user) {
        throw new Error("No se recibió el ID del usuario del servidor");
      }

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
  };

  // Función para actualizar datos del usuario en el contexto
  const updateUserContext = (updatedData) => {
    console.log("Actualizando contexto con:", updatedData);
    
    // ✅ Normalizar los datos actualizados
    const normalizedData = {
      id_user: updatedData.idUser || updatedData.id_user || user?.id_user,
      username: updatedData.username,
      name: updatedData.name,
      lastname: updatedData.lastname,
      email: updatedData.email,
      recovery_email: updatedData.recoveryEmail || updatedData.recovery_email,
      phone: updatedData.phone,
      token: updatedData.token || user?.token
    };

    const newUser = { ...user, ...normalizedData };
    console.log("Usuario actualizado:", newUser);
    
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  // Función para limpiar errores manualmente
  const clearError = () => {
    setError(null);
  };

  // Función para verificar si el usuario está autenticado
  const isAuthenticated = () => {
    return user !== null && user.id_user !== undefined;
  };

  // Verificar sesión al cargar la aplicación
  useEffect(() => {
    const checkSession = async () => {
      const storedUser = localStorage.getItem("user");
      
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          
          // ✅ Validar que tenga ID
          if (!userData.id_user) {
            console.warn("Usuario sin ID válido, limpiando sesión");
            localStorage.removeItem("user");
            setUser(null);
            return;
          }
          
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
      logout();
      setError("Sesión expirada. Por favor inicia sesión nuevamente.");
    } else {
      setError(error.message || "Error de conexión");
    }
  };

  // Valores que se proporcionan a través del contexto
  const contextValue = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUserContext, // ✅ Cambié el nombre para ser más claro
    clearError,
    isAuthenticated,
    handleApiError,
    isLoggedIn: isAuthenticated(),
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}