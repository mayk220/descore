import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import styles from "./AccountModal.module.css";

function AccountModal({ isOpen, onClose, onRegistered, mode = "register" }) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [formData, setFormData] = useState({ email: "", username: "", password: "" });
  const { register, login, isLoading, error } = useAuth();
  const isLoginMode = currentMode === "login";

  if (!isOpen) return null;

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function changeMode(nextMode) {
    setCurrentMode(nextMode);
    setFormData({ email: "", username: "", password: "" });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const email = formData.email.trim();
    const username = formData.username.trim();
    const password = formData.password.trim();

    if (!email || !password || (!isLoginMode && !username)) {
      alert("Заповніть усі поля!");
      return;
    }
    if (!isLoginMode && password.length < 6) {
      alert("Пароль має містити щонайменше 6 символів");
      return;
    }

    try {
      if (isLoginMode) {
        await login({ email, password });
      } else {
        await register({ email, username, password });
      }
      onRegistered?.();
      onClose();
    } catch {
      return;
    }
  }

  return (
    <div
      id="accountModal"
      className={styles.modal}
      onClick={(event) => event.target.id === "accountModal" && onClose()}
    >
      <div className={styles["modal-content"]}>
        <span className={styles.close} onClick={onClose}>
          &times;
        </span>
        <div className={styles.tabs} role="tablist" aria-label="Автентифікація">
          <button
            type="button"
            className={isLoginMode ? styles["active-tab"] : ""}
            role="tab"
            aria-selected={isLoginMode}
            onClick={() => changeMode("login")}
          >
            Вхід
          </button>
          <button
            type="button"
            className={!isLoginMode ? styles["active-tab"] : ""}
            role="tab"
            aria-selected={!isLoginMode}
            onClick={() => changeMode("register")}
          >
            Реєстрація
          </button>
        </div>
        <h2>{isLoginMode ? "Вхід у Descore" : "Реєстрація в Descore"}</h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            name="email"
            type="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Введіть email"
          />

          {!isLoginMode && (
            <>
              <label htmlFor="username">Username</label>
              <input
                name="username"
                type="text"
                id="username"
                value={formData.username}
                onChange={handleChange}
                maxLength="15"
                pattern="[A-Za-z0-9]+"
                placeholder="Літери та цифри, макс 15"
              />
            </>
          )}

          <label htmlFor="password">Пароль</label>
          <input
            name="password"
            type="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            minLength="6"
            placeholder="Мін. 6 символів, 1 цифра, 1 спецсимвол"
          />

          <button id="registerBtn" type="submit" disabled={isLoading}>
            {isLoading ? "Завантаження..." : isLoginMode ? "Увійти" : "Зареєструватися"}
          </button>
        </form>
        {error && <p role="alert">{error.message}</p>}
        {!isLoginMode && (
          <p className={styles.note}>
            Реєструючись, ви погоджуєтесь з <a href="#">Правилами</a> та{" "}
            <a href="#">Політикою конфіденційності</a>.
          </p>
        )}
      </div>
    </div>
  );
}

export default AccountModal;
