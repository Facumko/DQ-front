import React, { useContext, useState, useEffect, useRef, useCallback } from "react";
import { UserContext } from "../../pages/UserContext";
import LoginModal from "../LoginForm/LoginModal";
import { useNavigate } from "react-router-dom";
import { searchCommerces } from "../../Api/Api";
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

  // Estados de búsqueda
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Búsqueda con debounce
  const handleSearchChange = useCallback((text) => {
    setSearchText(text);
    
    if (text.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setLoadingSuggestions(true);
    
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchCommerces(text.trim(), 3, 0);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error en búsqueda:', error);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);
  }, []);

  // Navegar a página de búsqueda
  const handleSearch = useCallback(() => {
    if (searchText.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchText.trim())}`);
      setShowSuggestions(false);
      setSearchText("");
    }
  }, [searchText, navigate]);

  // Enter para buscar
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  


  // Íconos principales
  const icons = [
    { icon: FaRegStar, label: "Favoritos", link: "/favoritos" },
    { icon: FaRegBell, label: "Notificaciones", link: "/notificaciones" },
    { icon: FaRegCalendarAlt, label: "Eventos", link: "/eventos" },
    { icon: FaRegCreditCard, label: "Métodos de pago", link: "/pagos" },
  ];



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
  useEffect(() => {    
    const handleClickOutside = (e) => {      
      if (!e.target.closest(`.${styles.searchContainer}`)) {        
        setShowSuggestions(false);
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
        <div className={styles.searchContainer}>
          <input    
          type="text"    
          placeholder="Buscar negocio, servicio o lugar..."    
          className={styles.searchInput}    
          value={searchText}    
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyPress={handleKeyPress}  
          />  
          <FaSearch     
          className={styles.searchIcon}     
          onClick={handleSearch}    
          style={{ cursor: 'pointer', pointerEvents: 'all' }}
          />  
          {showSuggestions && suggestions.length > 0 && (    
            <div className={styles.suggestions}>      
            {suggestions.map((commerce) => (        
              <div          
              key={commerce.idCommerce}          
              className={styles.suggestionItem}
              onClick={() => {            
                navigate(`/negocios/${commerce.idCommerce}`);
                setShowSuggestions(false);            
                setSearchText("");
              }}
              >          
              <div className={styles.suggestionContent}>
                <div className={styles.suggestionIcon}>
                  {commerce.profileImage?.url ? (
                    <img src={commerce.profileImage.url} alt="" />
                  ) : ( 
                  <span>{commerce.name.charAt(0).toUpperCase()}</span>
                  )}
                  </div>  
                  <div className={styles.suggestionInfo}>    
                    <span className={styles.suggestionName}>{commerce.name}</span>
                    {commerce.description && (     
                      <span className={styles.suggestionDesc}>        
                      {commerce.description.substring(0, 50)}...
                      </span>
                    )}  
                    </div>
                    </div>
                  </div>
                ))}
                </div>
              )}   
              {loadingSuggestions && (
                <div className={styles.suggestions}>
                  <div className={styles.suggestionItem}>Buscando...</div>
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
         {/* Icono de Categorías - CON CONTENEDOR RELATIVO */}
          <div className={styles.categoriesContainer}>
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
          </div>
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
                    navigate("/Profile");
                    setShowMenu(false);
                  }}
                >
                  Mi cuenta
                </div>
                {/* ⭐ NUEVA OPCIÓN: Mi negocio */}
                <div
                  className={styles.userMenuItem}
                  onClick={() => {
                    navigate("/Mycommerce");
                    setShowMenu(false);
                  }}
                >
                  Mi negocio
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