import { createContext, useContext, useState } from "react";
import { mockData } from "../services/api";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  // Estado Global de la Aplicación (Única fuente de la verdad para el MVP)
  const [incidencias, setIncidencias] = useState(mockData.incidencias);
  const [inventario, setInventario] = useState(mockData.inventario);
  const [plantillas, setPlantillas] = useState(mockData.plantillas);
  const [historialGlobal, setHistorialGlobal] = useState(mockData.historial);

  return (
    <DataContext.Provider value={{
      incidencias, setIncidencias,
      inventario, setInventario,
      plantillas, setPlantillas,
      historialGlobal, setHistorialGlobal
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
