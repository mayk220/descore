import MainPage from "./pages/MainPage";
import GamePage from "./pages/GamePage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  if (window.location.pathname === "/game") return <GamePage />;
  if (["/profile", "/profile.html"].includes(window.location.pathname)) return <ProfilePage />;
  return <MainPage />;
}

export default App;
