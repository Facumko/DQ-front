import React from "react";
import styles from "./FloatingChat.module.css";
import { MessageCircle } from "lucide-react";

const FloatingChat = () => {
  return (
    <div className={styles.chatButton}>
      <MessageCircle color="#fff" size={24} />
    </div>
  );
};

export default FloatingChat;
