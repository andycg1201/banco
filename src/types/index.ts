export type TipoCombustible = 'DIESEL' | 'GASOLINA' | 'ELECTRICO' | 'HIBRIDO';

export interface DatosVehiculo {
  modelo?: string;
  ano?: number;
  tipo?: TipoCombustible;
  placa?: string;
  color?: string;
  ciudad?: string;
  direccion?: string;
  telefono?: string;
  fechaEntrega?: string;
}

export type AnosServicio = '1' | '2' | '3' | '1-cayambe' | '2-cayambe' | '3-cayambe';

export interface Factura {
  id?: string;
  comercializadora: string;
  numeroFactura: string;
  valorTotal: number;
  anosServicio: AnosServicio;
  fechaFactura: string;
  cliente: string;
  valorFijo: number;
  excedente: number;
  ivaExcedente: number;
  comisionVal: number;
  ivaGananciaPropia: number;
  totalIva: number;
  datosVehiculo?: DatosVehiculo;
  pagada?: boolean; // true = factura pagada, false = pendiente
  noDeseaRenovar?: boolean; // true = cliente indicó que no renovará el servicio
  createdAt?: string;
  updatedAt?: string;
}

export interface CorteSemestral {
  inicio: string;
  fin: string;
  totalIva: number;
  facturas: Factura[];
}
