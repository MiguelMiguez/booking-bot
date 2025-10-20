import "./App.css";
import { useAuth } from "./hooks/useAuth";
import Navbar from "./components/Navbar/Navbar";
import Dashboard from "./pages/Dashboard/Dashboard";
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
        <Dashboard />
      </main>
    </div>
  );
};

export default App;
