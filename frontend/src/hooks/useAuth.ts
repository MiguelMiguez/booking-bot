import { useContext } from "react";
import AuthContext from "../contexts/AuthContext";

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de un AuthProvider.");
  }

  return context;
};
