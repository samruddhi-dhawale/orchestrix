import api from "./api";

// Enterprise authentication service for Orchestrix

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem("orchestrix_user");
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return null;
}

export function setCurrentUser(user) {
  if (user) {
    // Ensure no raw passwords or sensitive credentials ever enter localStorage
    const { password, passwordHash, ...safeUser } = user;
    localStorage.setItem("orchestrix_user", JSON.stringify(safeUser));
  } else {
    localStorage.removeItem("orchestrix_user");
  }
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch {
    // Ignore network errors during logout
  } finally {
    localStorage.removeItem("orchestrix_user");
    if (typeof window !== "undefined") {
      window.location.hash = "#/login";
    }
  }
}

export function isAuthenticated() {
  const user = getCurrentUser();
  return Boolean(user && user.token);
}
