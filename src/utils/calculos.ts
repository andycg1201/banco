import { Factura, AnosServicio } from '../types';

const DIAS_ALERTA_RENOVACION = 15;

/**
 * Extrae el número de años de anosServicio (1, 2 o 3).
 * Soporta '1', '2', '3' y variantes '1-cayambe', '2-cayambe', etc.
 */
export function extraerAnosDeServicio(anosServicio: AnosServicio | number | string): number {
  const str = String(anosServicio);
  const num = parseInt(str.split('-')[0], 10);
  return isNaN(num) || num < 1 || num > 3 ? 1 : num;
}

/**
 * Calcula la fecha de vencimiento del servicio a partir de fechaEntrega + años.
 * Retorna null si no hay fechaEntrega.
 */
export function calcularFechaVencimiento(
  fechaEntrega: string | undefined,
  anosServicio: AnosServicio | number | string
): Date | null {
  if (!fechaEntrega) return null;
  const d = parseLocalDate(fechaEntrega);
  if (isNaN(d.getTime())) return null;
  const anos = extraerAnosDeServicio(anosServicio);
  const vencimiento = new Date(d);
  vencimiento.setFullYear(vencimiento.getFullYear() + anos);
  return vencimiento;
}

/**
 * Días hasta el vencimiento. Positivo = futuro, negativo = ya venció, 0 = hoy.
 */
export function diasHastaVencimiento(fechaVencimiento: Date): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const v = new Date(fechaVencimiento);
  v.setHours(0, 0, 0, 0);
  return Math.floor((v.getTime() - hoy.getTime()) / (24 * 60 * 60 * 1000));
}

export function estaProximoAVencer(dias: number): boolean {
  return dias >= 0 && dias <= DIAS_ALERTA_RENOVACION;
}

// Valores fijos por años (ya incluyen IVA)
export const VALORES_FIJOS: Record<AnosServicio, number> = {
  '1': 208,
  '2': 301,
  '3': 394,
  '1-cayambe': 228, // 208 + 20
  '2-cayambe': 321, // 301 + 20
  '3-cayambe': 414, // 394 + 20
};

const IVA_PORCENTAJE = 0.15; // 15%

/**
 * Calcula todos los valores relacionados con una factura
 */
export function calcularValoresFactura(
  valorTotal: number,
  anosServicio: AnosServicio | number
): Omit<Factura, 'id' | 'comercializadora' | 'numeroFactura' | 'fechaFactura' | 'cliente' | 'datosVehiculo' | 'createdAt' | 'updatedAt'> {
  // Normalizar anosServicio: convertir números antiguos a strings
  const anosNormalizado: AnosServicio = typeof anosServicio === 'number' 
    ? String(anosServicio) as AnosServicio
    : anosServicio;
  
  const valorFijo = VALORES_FIJOS[anosNormalizado];
  const excedente = valorTotal - valorFijo;
  const ivaExcedente = excedente * IVA_PORCENTAJE;
  const comisionVal = valorTotal - valorFijo - ivaExcedente;
  const ivaGananciaPropia = valorFijo * IVA_PORCENTAJE;
  const totalIva = ivaGananciaPropia + ivaExcedente;

  return {
    valorTotal,
    anosServicio: anosNormalizado,
    valorFijo,
    excedente,
    ivaExcedente,
    comisionVal,
    ivaGananciaPropia,
    totalIva,
  };
}

/**
 * Obtiene el período semestral de una fecha
 */
export function obtenerPeriodoSemestral(fecha: Date): { inicio: Date; fin: Date } {
  const ano = fecha.getFullYear();
  const mes = fecha.getMonth(); // 0-11
  
  // Semestre 1: Enero-Junio (0-5)
  // Semestre 2: Julio-Diciembre (6-11)
  const esPrimerSemestre = mes < 6;
  
  const inicio = new Date(ano, esPrimerSemestre ? 0 : 6, 1);
  const fin = new Date(ano, esPrimerSemestre ? 5 : 11, 30, 23, 59, 59);
  
  return { inicio, fin };
}

/**
 * Formatea un número como moneda
 */
export function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

/**
 * Parsea una fecha "YYYY-MM-DD" como medianoche en hora local.
 * Evita que se interprete como UTC y se muestre un día menos.
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date(NaN);
  const parts = dateStr.split('T')[0].split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  return new Date(y, m, d);
}

/**
 * Formatea una fecha
 */
export function formatearFecha(fecha: string | Date): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat('es-EC', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
