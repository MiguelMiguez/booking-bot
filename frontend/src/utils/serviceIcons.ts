import {
  Scissors,
  Sparkles,
  Heart,
  Brush,
  Droplets,
  Hand,
  Star,
  Flower2,
  Sun,
  Moon,
  Gem,
  Crown,
  Palette,
  type LucideIcon,
} from "lucide-react";

/**
 * Mapeo de palabras clave a íconos de Lucide React.
 * Se usa para asignar íconos automáticamente basándose en el nombre del servicio.
 */
export const SERVICE_ICON_MAP: Record<string, LucideIcon> = {
  // Corte y cabello
  corte: Scissors,
  cabello: Scissors,
  pelo: Scissors,
  haircut: Scissors,
  barba: Scissors,
  beard: Scissors,

  // Masajes
  masaje: Hand,
  massage: Hand,

  // Uñas
  manicura: Sparkles,
  manicure: Sparkles,
  pedicura: Sparkles,
  pedicure: Sparkles,
  uñas: Sparkles,
  nails: Sparkles,

  // Cuidado facial
  facial: Droplets,
  limpieza: Droplets,
  skincare: Droplets,

  // Maquillaje
  maquillaje: Brush,
  makeup: Brush,

  // Depilación
  depilación: Star,
  depilacion: Star,
  waxing: Star,

  // Color
  tinte: Palette,
  color: Palette,
  dye: Palette,

  // Tratamientos
  tratamiento: Heart,
  treatment: Heart,

  // Spa y relax
  spa: Flower2,
  relax: Sun,
  noche: Moon,

  // Premium
  especial: Gem,
  premium: Crown,
  vip: Crown,
};

/** Ícono por defecto cuando no hay coincidencia */
export const DEFAULT_SERVICE_ICON: LucideIcon = Star;

/**
 * Obtiene el ícono correspondiente a un servicio.
 * Busca coincidencias parciales en el nombre del servicio.
 *
 * @param serviceName - Nombre del servicio
 * @param iconKey - Clave de ícono explícita (opcional, tiene prioridad)
 * @returns Componente de ícono de Lucide React
 */
export const getServiceIcon = (
  serviceName: string,
  iconKey?: string
): LucideIcon => {
  // Si se proporciona una clave explícita, usarla primero
  if (iconKey && SERVICE_ICON_MAP[iconKey.toLowerCase()]) {
    return SERVICE_ICON_MAP[iconKey.toLowerCase()];
  }

  // Buscar por coincidencia en el nombre
  const normalizedName = serviceName.toLowerCase().trim();

  for (const [keyword, icon] of Object.entries(SERVICE_ICON_MAP)) {
    if (normalizedName.includes(keyword)) {
      return icon;
    }
  }

  return DEFAULT_SERVICE_ICON;
};

/**
 * Lista de claves de íconos disponibles para usar en formularios/selectores.
 */
export const AVAILABLE_ICON_KEYS = [
  { value: "corte", label: "Tijeras (Corte)" },
  { value: "masaje", label: "Mano (Masaje)" },
  { value: "manicura", label: "Destellos (Uñas)" },
  { value: "facial", label: "Gotas (Facial)" },
  { value: "maquillaje", label: "Brocha (Maquillaje)" },
  { value: "tinte", label: "Paleta (Color)" },
  { value: "tratamiento", label: "Corazón (Tratamiento)" },
  { value: "spa", label: "Flor (Spa)" },
  { value: "relax", label: "Sol (Relax)" },
  { value: "premium", label: "Corona (Premium)" },
  { value: "especial", label: "Gema (Especial)" },
] as const;
