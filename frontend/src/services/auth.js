// Simple, resilient client authentication service for Orchestrix

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem("orchestrix_user");
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return null;
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem("orchestrix_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("orchestrix_user");
  }
}

export function logout() {
  localStorage.removeItem("orchestrix_user");
  window.location.href = "/login";
}

export function isAuthenticated() {
  return !!getCurrentUser();
}
