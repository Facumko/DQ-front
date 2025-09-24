import React, { useContext, useState } from "react";
import { UserContext } from "../../pages/UserContext";
import LoginModal from "../LoginForm/LoginModal";
import { useNavigate } from "react-router-dom"; 
import styles from "./Navbar.module.css"; 
import {
  FaMapMarkerAlt, FaRegStar, FaRegBell, FaRegCalendarAlt,
  FaRegCreditCard, FaRegUser, FaSearch, FaBars
} from "react-icons/fa";

import Categories from "../Categories/Categories";

const Navbar = () => {
  const { user, logout } = useContext(UserContext);
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

  const [searchActive, setSearchActive] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filteredList, setFilteredList] = useState([]);
  const [showCategories, setShowCategories] = useState(false);

  // Lista de negocios para sugerencias
  const businessList = [
    "Panadería Los Aromas",
    "Supermercado Central",
    "Café La Esquina",
    "Peluquería Moderno",
    "Gimnasio FitLife",
    "Tienda de Ropa Urban"
  ];

  // Íconos principales
  const icons = [
    { icon: FaRegStar, label: "Favoritos", link: "/favoritos" },
    { icon: FaRegBell, label: "Notificaciones", link: "/notificaciones" },
    { icon: FaRegCalendarAlt, label: "Eventos", link: "/eventos" },
    { icon: FaRegCreditCard, label: "Métodos de pago", link: "/pagos" },
    { icon: FaRegUser, label: "Perfil", link: "/Negocios" }
  ];

  // Función para búsqueda
  const handleSearchChange = (text) => {
    setSearchText(text);
    if (text.trim() === "") setFilteredList([]);
    else {
      setFilteredList(
        businessList.filter((b) =>
          b.toLowerCase().includes(text.toLowerCase())
        )
      );
    }
  };

  // Función para navegación con ripple
  const handleIconClick = (link, e) => {
    const ripple = document.createElement("span");
    ripple.className = styles.rippleDynamic;
    ripple.style.left = `${e.nativeEvent.offsetX}px`;
    ripple.style.top = `${e.nativeEvent.offsetY}px`;
    e.currentTarget.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
    navigate(link);
  };

  return (
    <>
      <nav className={styles.navbar}>
        {/* Logo */}
        <div className={styles.logo} onClick={() => navigate("/")}>
          <FaMapMarkerAlt className={styles.icon} />
          <span className={styles.logoText}>Dónde Queda?</span>
        </div>

        {/* Buscador */}
        <div
          className={`${styles.searchContainer} ${searchActive ? styles.active : ""}`}
          onClick={() => setSearchActive(true)}
        >
          <input
            type="text"
            placeholder="Buscar negocio, servicio o lugar..."
            className={styles.searchInput}
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <FaSearch className={styles.searchIcon} />

          {searchActive && filteredList.length > 0 && (
            <div className={styles.suggestions}>
              {filteredList.map((item, idx) => (
                <div
                  key={idx}
                  className={styles.suggestionItem}
                  onClick={() => {
                    setSearchText(item);
                    setFilteredList([]);
                    navigate(`/search/${item}`);
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Íconos principales + Categories + login */}
        <div className={styles.icons}>
          {icons.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className={styles.iconWrapper}
                title={item.label}
                onClick={(e) => handleIconClick(item.link, e)}
              >
                <IconComp className={styles.outlineIcon} />
              </div>
            );
          })}

          {/* Icono de Categorías */}
          <div
            className={styles.iconWrapper}
            title="Categorías"
            onClick={() => setShowCategories(!showCategories)}
          >
            <FaBars className={styles.outlineIcon} />
          </div>

          {/* Dropdown de categorías */}
          <Categories expanded={showCategories} />

          {/* Usuario / Login */}
          {user ? (
            <div className={styles.userSection}>
              <span className={styles.userName}>Hola, {user.name}</span>
              <button className={styles.userButton} onClick={logout}>
                Cerrar sesión
              </button>
            </div>
          ) : (
            <button
              className={styles.loginButton}
              onClick={() => setShowLogin(true)}
            >
              Iniciar sesión
            </button>
          )}
        </div>
      </nav>

      {/* Modal login */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
};

export default Navbar;
