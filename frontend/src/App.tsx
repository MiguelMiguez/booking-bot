import "./App.css";
import Navbar from "./components/Navbar/Navbar";
import Dashboard from "./pages/Dashboard/Dashboard";

const App = () => {
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
