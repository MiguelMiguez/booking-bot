import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Navbar from "./components/Navbar/Navbar";
import Dashboard from "./pages/Dashboard/Dashboard";
import ServicesPage from "./pages/Services/Services";
import Login from "./pages/Login/Login";

const App = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="appShell">
      <Navbar />
      <main className="app-root">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
