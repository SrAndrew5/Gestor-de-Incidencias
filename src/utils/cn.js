import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind CSS inteligentemente.
 * Utiliza `clsx` para el renderizado condicional de clases 
 * y `twMerge` para resolver conflictos de especificidad (ej. px-4 + px-6).
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
