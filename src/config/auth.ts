/**
 * Usuario restringido: solo puede ver la pestaña Resumen.
 * Credenciales: usuario "valeria" → email valeria@g.com, contraseña val2026
 */
export const RESTRICTED_USER_EMAIL = 'valeria@g.com';

/** Mapeo usuario → email para login (Firebase requiere email) */
const USERNAME_TO_EMAIL: Record<string, string> = {
  valeria: RESTRICTED_USER_EMAIL,
};

export function isRestrictedUser(email: string | null | undefined): boolean {
  return email === RESTRICTED_USER_EMAIL;
}

/** Convierte lo que el usuario escribe (correo o nombre de usuario) al email para Firebase */
export function toLoginEmail(correoOUsuario: string): string {
  const v = correoOUsuario.trim();
  if (v.includes('@')) return v;
  const lower = v.toLowerCase();
  return USERNAME_TO_EMAIL[lower] ?? v;
}
