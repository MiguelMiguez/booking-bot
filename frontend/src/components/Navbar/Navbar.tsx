import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CloseIcon from "../../assets/icons/close.svg";
import NavIco from "../../assets/icons/nav_icon.svg";
import { useAuth } from "../../hooks/useAuth";
import "./Navbar.css";

interface NavLinkItem {
  label: string;
  path: string;
  sectionId?: string;
}

const NAV_LINKS: NavLinkItem[] = [
  { label: "Dashboard", path: "/", sectionId: "resumen" },
  { label: "Turnos", path: "/", sectionId: "turnos" },
  { label: "Servicios", path: "/services" },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("resumen");
  const { role, logout } = useAuth();
  const isAdmin = role === "admin";
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 960px)");

    const handleViewportChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMenuOpen(false);
      }
    };

    if (mediaQuery.matches) {
      setIsMenuOpen(false);
    }

    mediaQuery.addEventListener("change", handleViewportChange);
    return () => {
      mediaQuery.removeEventListener("change", handleViewportChange);
    };
  }, []);

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection("services");
      return;
    }

    setActiveSection((prev) => (prev === "services" ? "resumen" : prev));
  }, [location.pathname]);

  const handleNavigate = (link: NavLinkItem) => {
    const state = link.sectionId ? { section: link.sectionId } : undefined;
    navigate(link.path, { state });
    if (link.path === "/") {
      setActiveSection(link.sectionId ?? "resumen");
    } else {
      setActiveSection("services");
    }
    setIsMenuOpen(false);
  };

  const handleCreateBooking = () => {
    navigate("/", { state: { section: "turnos" } });
    setActiveSection("turnos");
    setIsMenuOpen(false);
  };

  const isLinkActive = (link: NavLinkItem): boolean => {
    if (link.path === "/") {
      return (
        location.pathname === "/" &&
        activeSection === (link.sectionId ?? "resumen")
      );
    }
    return location.pathname.startsWith(link.path);
  };

  return (
    <header className="navbarRoot">
      <div className="navbarInner">
        <a className="navbarBrand" href="/">
          <span className="navbarBrandMark" aria-hidden="true">
            BB
          </span>
          <span className="navbarBrandText">Booking Bot</span>
        </a>

        <nav
          id="navbarMenu"
          className={`navbarNav${isMenuOpen ? " isOpen" : ""}`}
          aria-label="Principal"
        >
          <button
            type="button"
            className="navbarClose"
            onClick={closeMenu}
            aria-label="Cerrar menú"
          >
            <img src={CloseIcon} alt="" aria-hidden="true" />
          </button>
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={`${link.path}-${link.sectionId ?? "root"}`}>
                <button
                  type="button"
                  className={`navbarLink${
                    isLinkActive(link) ? " isActive" : ""
                  }`}
                  onClick={() => handleNavigate(link)}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
          {isAdmin ? (
            <button
              type="button"
              className="navbarCta"
              onClick={handleCreateBooking}
            >
              Nuevo turno
            </button>
          ) : null}
          <div className="navbarSession">
            <span className={`navbarRoleBadge${isAdmin ? " isAdmin" : ""}`}>
              {isAdmin ? "Administrador" : "Operador"}
            </span>
            <button
              type="button"
              className="navbarLogout"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        </nav>

        <button
          type="button"
          className={`navbarToggle${isMenuOpen ? " isActive" : ""}`}
          aria-expanded={isMenuOpen}
          aria-controls="navbarMenu"
          onClick={toggleMenu}
        >
          <img className="burgerIcon" src={NavIco} alt="Menu" />
        </button>
      </div>

      {isMenuOpen ? (
        <div className="navbarOverlay" onClick={closeMenu} />
      ) : null}
    </header>
  );
};

export default Navbar;
