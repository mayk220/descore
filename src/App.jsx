import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import GamePage from "./pages/GamePage";
import MainPage from "./pages/MainPage";
import ProfilePage from "./pages/ProfilePage";

function ProtectedRoute({ children }) {
  const isRegistered = Boolean(localStorage.getItem("userName"));

  return isRegistered ? children : <Navigate to="/main" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/">
          <Route index element={<Navigate to="/main" replace />} />
          <Route path="main" element={<MainPage />} />
          <Route path="game" element={<GamePage />} />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/main" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;