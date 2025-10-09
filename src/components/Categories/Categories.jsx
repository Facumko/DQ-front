import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./Categories.module.css";

const defaultCategories = [
  { id_category: 1, name: "Alimentos" },
  { id_category: 2, name: "Salud" },
  { id_category: 3, name: "Entretenimiento" },
  { id_category: 4, name: "Deportes" },
  { id_category: 5, name: "Moda" },
  { id_category: 6, name: "Tecnología" }
];

const Categories = ({ expanded, onClose }) => {
  const [categorias, setCategories] = useState(defaultCategories);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://10.0.15.66:8080/categoria/traer");
        if (res.data && res.data.length > 0) {
          setCategories(res.data);
        }
      } catch (err) {
        console.warn("No se pudo conectar con la API, usando categorías por defecto.", err);
      } finally {
        setLoading(false);
      }
    };

    if (expanded) {
      fetchCategories();
    }
  }, [expanded]);

  const handleCategoryClick = (category) => {
    // Navegar a la página de la categoría
    navigate(`/categorias/${category.id_category}`);
    
    // Cerrar el dropdown si existe la función onClose
    if (onClose) {
      onClose();
    }
  };

  if (!expanded) return null;

  return (
    <div className={styles.expandedCategories}>
      {loading ? (
        <span className={styles.loading}>Cargando categorías...</span>
      ) : (
        categorias.map((cat) => (
          <span 
            key={cat.id_category || cat.id} 
            className={styles.categoryItem}
            onClick={() => handleCategoryClick(cat)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleCategoryClick(cat);
            }}
          >
            {cat.name}
          </span>
        ))
      )}
    </div>
  );
};

export default Categories;