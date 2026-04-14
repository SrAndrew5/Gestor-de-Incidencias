const BASE = "http://localhost:8080/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(method, path, body = null) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  
  const res = await fetch(`${BASE}${path}`, opts);
  
  // Interceptor para expiración de sesión
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  }
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Error de servidor" }));
    throw new Error(err.message || "Error");
  }
  
  if (res.status === 204) return null;
  return res.json();
}

/**
 * Cliente API genérico
 */
export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),
};

// Re-exportamos temporalmente para evitar romper imports mientras refactorizamos
export { BIBLIOTECAS, mockData } from "./mock";
