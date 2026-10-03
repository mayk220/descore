import { useState } from "react";

function AccountModal({ isOpen, onClose, onRegistered }) {
  const [formData, setFormData] = useState({ email: "", username: "", password: "" });

  if (!isOpen) return null;

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleRegister(event) {
    event.preventDefault();

    const email = formData.email.trim();
    const username = formData.username.trim();
    const password = formData.password.trim();

    if (!email || !username || !password) {
      alert("Заповніть усі поля!");
      return;
    }

    localStorage.setItem("userEmail", email);
    localStorage.setItem("userName", username);
    alert(`Акаунт створено!\nEmail: ${email}\nUsername: ${username}`);
    onRegistered?.();
    onClose();
  }

  return (
    <div
      id="accountModal"
      className="modal"
      onClick={(event) => event.target.id === "accountModal" && onClose()}
    >
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h2>Увійти в Descore</h2>

        <form onSubmit={handleRegister}>
          <label htmlFor="email">Email</label>
          <input
            name="email"
            type="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Введіть email"
          />

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

          <button id="registerBtn" type="submit">
            Зареєструватися
          </button>
        </form>
        <p className="note">
          Реєструючись, ви погоджуєтесь з <a href="#">Правилами</a> та{" "}
          <a href="#">Політикою конфіденційності</a>.
        </p>
      </div>
    </div>
  );
}

export default AccountModal;
