import { useEffect, useState } from "react";
import NavIco from "../../assets/icons/nav_icon.svg";
import "./Navbar.css";

const NAV_LINKS = [
  { label: "Dashboard", href: "#resumen" },
  { label: "Turnos", href: "#turnos" },
  { label: "Servicios", href: "#servicios" },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={closeMenu}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a className="navbarCta" href="#nuevo-turno" onClick={closeMenu}>
            Nuevo turno
          </a>
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
