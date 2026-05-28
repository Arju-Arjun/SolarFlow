export function setAuthToken(token, user) {
  localStorage.setItem("spm_token", token);
  localStorage.setItem("spm_user", JSON.stringify(user));
}

export function clearAuthToken() {
  localStorage.removeItem("spm_token");
  localStorage.removeItem("spm_user");
}

export function getAuthUser() {
  const raw = localStorage.getItem("spm_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem("spm_token"));
}
