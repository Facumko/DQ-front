import { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export function UserProvider({ children }) {
  // Estado del usuario, inicial desde localStorage si existe
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Guardar usuario en estado y en localStorage
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // Cerrar sesión: limpia estado y localStorage
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // Función para actualizar datos del usuario en cualquier momento
  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  return (
    <UserContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}
