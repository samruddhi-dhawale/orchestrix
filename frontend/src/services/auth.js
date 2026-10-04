import api from "./api";

// Enterprise authentication service for Orchestrix

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem("orchestrix_user");
    if (raw) {
      const user = JSON.parse(raw);
      if (user && user.name && (user.name.includes("Lead Developer") || user.name.includes("(Lead Developer)"))) {
        user.name = "Developer";
        localStorage.setItem("orchestrix_user", JSON.stringify(user));
      }
      return user;
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
    if (safeUser.name && (safeUser.name.includes("Lead Developer") || safeUser.name.includes("(Lead Developer)"))) {
      safeUser.name = "Developer";
    }
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
