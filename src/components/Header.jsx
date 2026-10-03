import { useRef, useState } from "react";

function Header({ isRegistered, onAccountClick, onProfileClick, onLogoClick }) {
  const searchInputRef = useRef(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  function focusSearch() {
    searchInputRef.current?.focus();
  }

  function openRatings() {
    window.location.href = "/profile?view=ratings";
  }

  function logout() {
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    window.location.href = "/main";
  }

  return (
    <header>
      <div className="search-bar">
        <div className="left-icons">
          <i className="menu-icon fa-solid fa-bars"></i>
          <a href="/main" className="logo" onClick={onLogoClick}>
            ds
          </a>
        </div>
        <input ref={searchInputRef} type="text" placeholder="Search" className="search-input" />
        <div className="right-icons">
          <i className="search-icon fa-solid fa-magnifying-glass" onClick={focusSearch}></i>
          {isRegistered ? (
            <div
              className={`profile-menu ${isProfileMenuOpen ? "is-open" : ""}`}
              onMouseEnter={() => setIsProfileMenuOpen(true)}
              onMouseLeave={() => setIsProfileMenuOpen(false)}
            >
              <button type="button" className="profile-trigger" aria-label="Меню профілю">
                <i className="profile-icon fa-solid fa-circle-user"></i>
              </button>
              <div className="profile-menu-items">
                <button type="button" onClick={onProfileClick}>
                  Зайти на профіль
                </button>
                <button type="button" onClick={openRatings}>
                  Зайти на оцінки ігор
                </button>
                <button type="button" onClick={logout}>
                  Вихід
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="register-btn" onClick={onAccountClick}>
              Реєстрація
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;