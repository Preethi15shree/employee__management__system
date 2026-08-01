// Auth utilities
export const TOKEN_KEY = 'emp_mgmt_token';
export const USER_KEY = 'emp_mgmt_user';

export function saveAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return !!getToken();
}

export function hasRole(user, roles) {
  if (!user) return false;
  const allowed = Array.isArray(roles) ? roles : [roles];
  return allowed.includes(user.role);
}

export const ROLES = {
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  HR_ADMIN: 'hr_admin',
  SYSTEM_ADMIN: 'system_admin',
};

export const ROLE_LABELS = {
  employee: 'Employee',
  manager: 'Manager',
  hr_admin: 'HR Admin',
  system_admin: 'System Administrator',
};

export const ROLE_HOME = {
  employee: '/my/profile',
  manager: '/manager/team',
  hr_admin: '/hr/attendance',
  system_admin: '/dashboard',
};

// Generate a simple JWT-like token (for demo purposes with json-server)
export function generateToken(user) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ id: user.id, email: user.email, role: user.role, exp: Date.now() + 86400000 }));
  const signature = btoa(header + '.' + payload + '.secret');
  return header + '.' + payload + '.' + signature;
}
