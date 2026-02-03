import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '../config/firebase';

export async function iniciarSesion(email: string, password: string): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(getErrorMessage(error.code));
  }
}

export async function registrarUsuario(email: string, password: string): Promise<User> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(getErrorMessage(error.code));
  }
}

export async function cerrarSesion(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error('Error al cerrar sesión');
  }
}

export function observarAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

function getErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'Usuario no encontrado';
    case 'auth/wrong-password':
      return 'Contraseña incorrecta';
    case 'auth/email-already-in-use':
      return 'Este correo ya está registrado';
    case 'auth/weak-password':
      return 'La contraseña es muy débil';
    case 'auth/invalid-email':
      return 'Correo electrónico inválido';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Intenta más tarde';
    default:
      return 'Error al autenticar. Intenta nuevamente';
  }
}
