import React, { useContext, useState, useEffect, useRef } from "react";
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
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
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

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

        {/* Íconos principales + Categorías + Usuario */}
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
          <Categories expanded={showCategories} 
          onClose={() => setShowCategories(false)}/>

          {/* Ícono de usuario */}
          <div className={styles.userWrapper} ref={menuRef}>
            <FaRegUser
              className={`${styles.outlineIcon} ${styles.userIcon}`}
              onClick={() => {
                if (user) setShowMenu((prev) => !prev);
                else setShowLogin(true);
              }}
              title={user ? "Cuenta" : "Iniciar sesión"}
            />

            {user && showMenu && (
              <div className={styles.userMenu}>
                <div
                  className={styles.userMenuItem}
                  onClick={() => {
                    navigate("/perfil");
                    setShowMenu(false);
                  }}
                >
                  Mi cuenta
                </div>
                <div
                  className={styles.userMenuItem}
                  onClick={() => {
                    logout();
                    setShowMenu(false);
                  }}
                >
                  Cerrar sesión
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Modal login */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
};

export default Navbar;
