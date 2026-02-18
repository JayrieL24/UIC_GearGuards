const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const TOKEN_KEY = "gearguard_token";
const USER_KEY = "gearguard_user";

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const loginRequest = async ({ username, password }) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || data.non_field_errors?.[0] || "Login failed.");
  }

  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      username: data.username,
      role: data.role,
      is_superuser: data.is_superuser,
    })
  );

  return data;
};

export const registerRequest = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    const firstFieldError = Object.values(data)[0]?.[0];
    throw new Error(firstFieldError || data.detail || "Registration failed.");
  }
  return data;
};

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Token ${getToken()}`,
});

export const fetchPendingRegistrations = async () => {
  const response = await fetch(`${API_BASE_URL}/api/admin/pending/`, {
    method: "GET",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Could not fetch pending registrations.");
  }
  return data.pending || [];
};

export const approveRegistration = async (userId, role) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/approve/${userId}/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ role }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Approval failed.");
  }
  return data;
};

export const rejectRegistration = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/reject/${userId}/`, {
    method: "POST",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Reject failed.");
  }
  return data;
};
