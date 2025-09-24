import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./Categories.module.css";

const defaultCategories = [
  { name: "Alimentos" },
  { name: "Salud" },
  { name: "Entretenimiento" },
  { name: "Deportes" },
  { name: "Moda" },
  { name: "Tecnología" }
];

const Categories = ({ expanded }) => {
  const [categorias, setCategories] = useState(defaultCategories);

  useEffect(() => {
    axios.get("http://192.168.1.64:8080/categoria/traer")
      .then(res => {
        if (res.data && res.data.length > 0) setCategories(res.data);
      })
      .catch(err => console.warn("No se pudo conectar con la API, usando categorías por defecto.", err));
  }, []);

  if (!expanded) return null;

  return (
    <div className={styles.expandedCategories}>
      {categorias.map((cat, i) => (
        <span key={i} className={styles.categoryItem}>
          {cat.name}
        </span>
      ))}
    </div>
  );
};

export default Categories;
