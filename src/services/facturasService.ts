import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  where,
  deleteField,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Factura } from '../types';
import { parseLocalDate } from '../utils/calculos';

const COLECCION = 'facturas';

export async function crearFactura(factura: Omit<Factura, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ahora = Timestamp.now();
  const datosFactura: any = {
    comercializadora: factura.comercializadora,
    numeroFactura: factura.numeroFactura,
    valorTotal: factura.valorTotal,
    anosServicio: factura.anosServicio,
    fechaFactura: Timestamp.fromDate(parseLocalDate(factura.fechaFactura)),
    cliente: factura.cliente,
    valorFijo: factura.valorFijo,
    excedente: factura.excedente,
    ivaExcedente: factura.ivaExcedente,
    comisionVal: factura.comisionVal,
    ivaGananciaPropia: factura.ivaGananciaPropia,
    totalIva: factura.totalIva,
    pagada: factura.pagada ?? false,
    noDeseaRenovar: factura.noDeseaRenovar ?? false,
    createdAt: ahora,
    updatedAt: ahora,
  };

  // Solo incluir datosVehiculo si existe y tiene datos
  if (factura.datosVehiculo) {
    const datosVehiculo: any = {};
    
    if (factura.datosVehiculo.modelo) datosVehiculo.modelo = factura.datosVehiculo.modelo;
    if (factura.datosVehiculo.ano !== undefined) datosVehiculo.ano = factura.datosVehiculo.ano;
    if (factura.datosVehiculo.tipo) datosVehiculo.tipo = factura.datosVehiculo.tipo;
    if (factura.datosVehiculo.placa) datosVehiculo.placa = factura.datosVehiculo.placa;
    if (factura.datosVehiculo.color) datosVehiculo.color = factura.datosVehiculo.color;
    if (factura.datosVehiculo.ciudad) datosVehiculo.ciudad = factura.datosVehiculo.ciudad;
    if (factura.datosVehiculo.direccion) datosVehiculo.direccion = factura.datosVehiculo.direccion;
    if (factura.datosVehiculo.telefono) datosVehiculo.telefono = factura.datosVehiculo.telefono;
    
    if (factura.datosVehiculo.fechaEntrega) {
      datosVehiculo.fechaEntrega = Timestamp.fromDate(parseLocalDate(factura.datosVehiculo.fechaEntrega));
    }

    // Solo agregar si tiene al menos un campo
    if (Object.keys(datosVehiculo).length > 0) {
      datosFactura.datosVehiculo = datosVehiculo;
    }
  }

  const docRef = await addDoc(collection(db, COLECCION), datosFactura);
  return docRef.id;
}

export async function actualizarFactura(
  id: string,
  factura: Partial<Omit<Factura, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const facturaRef = doc(db, COLECCION, id);
  const datosActualizacion: any = {
    updatedAt: Timestamp.now(),
  };

  // Agregar solo los campos que existen y no son undefined
  if (factura.comercializadora !== undefined) datosActualizacion.comercializadora = factura.comercializadora;
  if (factura.numeroFactura !== undefined) datosActualizacion.numeroFactura = factura.numeroFactura;
  if (factura.valorTotal !== undefined) datosActualizacion.valorTotal = factura.valorTotal;
  if (factura.anosServicio !== undefined) datosActualizacion.anosServicio = factura.anosServicio;
  if (factura.cliente !== undefined) datosActualizacion.cliente = factura.cliente;
  if (factura.valorFijo !== undefined) datosActualizacion.valorFijo = factura.valorFijo;
  if (factura.excedente !== undefined) datosActualizacion.excedente = factura.excedente;
  if (factura.ivaExcedente !== undefined) datosActualizacion.ivaExcedente = factura.ivaExcedente;
  if (factura.comisionVal !== undefined) datosActualizacion.comisionVal = factura.comisionVal;
  if (factura.ivaGananciaPropia !== undefined) datosActualizacion.ivaGananciaPropia = factura.ivaGananciaPropia;
  if (factura.totalIva !== undefined) datosActualizacion.totalIva = factura.totalIva;
  if (factura.pagada !== undefined) datosActualizacion.pagada = factura.pagada;
  if (factura.noDeseaRenovar !== undefined) datosActualizacion.noDeseaRenovar = factura.noDeseaRenovar;

  // Convertir fechaFactura a Timestamp si existe (como hora local para evitar día anterior)
  if (factura.fechaFactura) {
    datosActualizacion.fechaFactura = Timestamp.fromDate(parseLocalDate(factura.fechaFactura));
  }

  // Manejar datos del vehículo si existen
  if (factura.datosVehiculo !== undefined) {
    const datosVehiculo: any = {};
    
    if (factura.datosVehiculo.modelo) datosVehiculo.modelo = factura.datosVehiculo.modelo;
    if (factura.datosVehiculo.ano !== undefined) datosVehiculo.ano = factura.datosVehiculo.ano;
    if (factura.datosVehiculo.tipo) datosVehiculo.tipo = factura.datosVehiculo.tipo;
    if (factura.datosVehiculo.placa) datosVehiculo.placa = factura.datosVehiculo.placa;
    if (factura.datosVehiculo.color) datosVehiculo.color = factura.datosVehiculo.color;
    if (factura.datosVehiculo.ciudad) datosVehiculo.ciudad = factura.datosVehiculo.ciudad;
    if (factura.datosVehiculo.direccion) datosVehiculo.direccion = factura.datosVehiculo.direccion;
    if (factura.datosVehiculo.telefono) datosVehiculo.telefono = factura.datosVehiculo.telefono;
    
    if (factura.datosVehiculo.fechaEntrega) {
      datosVehiculo.fechaEntrega = Timestamp.fromDate(parseLocalDate(factura.datosVehiculo.fechaEntrega));
    }

    // Solo agregar si tiene al menos un campo, o usar deleteField() si está vacío
    if (Object.keys(datosVehiculo).length > 0) {
      datosActualizacion.datosVehiculo = datosVehiculo;
    } else {
      // Si datosVehiculo está vacío, eliminarlo del documento
      datosActualizacion.datosVehiculo = deleteField();
    }
  }

  await updateDoc(facturaRef, datosActualizacion);
}

export async function eliminarFactura(id: string): Promise<void> {
  const facturaRef = doc(db, COLECCION, id);
  await deleteDoc(facturaRef);
}

export async function obtenerFacturas(): Promise<Factura[]> {
  const q = query(collection(db, COLECCION), orderBy('fechaFactura', 'desc'));
  const querySnapshot = await getDocs(q);

  const facturas = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    // Normalizar anosServicio: convertir números antiguos a strings
    let anosServicio = data.anosServicio;
    if (typeof anosServicio === 'number') {
      anosServicio = String(anosServicio) as any;
    }

    return {
      id: doc.id,
      ...data,
      anosServicio: anosServicio,
      // Convertir Timestamps a strings
      fechaFactura: data.fechaFactura instanceof Timestamp
        ? data.fechaFactura.toDate().toISOString()
        : data.fechaFactura,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate().toISOString()
        : data.updatedAt,
      datosVehiculo: data.datosVehiculo
        ? {
            ...data.datosVehiculo,
            fechaEntrega:
              data.datosVehiculo.fechaEntrega instanceof Timestamp
                ? data.datosVehiculo.fechaEntrega.toDate().toISOString()
                : data.datosVehiculo.fechaEntrega,
          }
        : undefined,
    } as Factura;
  });

  // Ordenar por N° Factura de mayor a menor (numérico, no alfabético)
  facturas.sort((a, b) => {
    const numA = parseInt(String(a.numeroFactura).replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(String(b.numeroFactura).replace(/\D/g, ''), 10) || 0;
    return numB - numA;
  });

  return facturas;
}

export async function obtenerFacturasPorPeriodo(
  fechaInicio: Date,
  fechaFin: Date
): Promise<Factura[]> {
  // Asegurar que fechaFin incluye todo el día
  const finCompleto = new Date(fechaFin);
  finCompleto.setHours(23, 59, 59, 999);
  
  const q = query(
    collection(db, COLECCION),
    where('fechaFactura', '>=', Timestamp.fromDate(fechaInicio)),
    where('fechaFactura', '<=', Timestamp.fromDate(finCompleto)),
    orderBy('fechaFactura', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  const facturas = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    // Normalizar anosServicio: convertir números antiguos a strings
    let anosServicio = data.anosServicio;
    if (typeof anosServicio === 'number') {
      anosServicio = String(anosServicio) as any;
    }
    
    return {
      id: doc.id,
      ...data,
      anosServicio: anosServicio,
      fechaFactura: data.fechaFactura instanceof Timestamp 
        ? data.fechaFactura.toDate().toISOString() 
        : data.fechaFactura,
      createdAt: data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate().toISOString() 
        : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp 
        ? data.updatedAt.toDate().toISOString() 
        : data.updatedAt,
      datosVehiculo: data.datosVehiculo ? {
        ...data.datosVehiculo,
        fechaEntrega: data.datosVehiculo.fechaEntrega instanceof Timestamp
          ? data.datosVehiculo.fechaEntrega.toDate().toISOString()
          : data.datosVehiculo.fechaEntrega,
      } : undefined,
    } as Factura;
  });

  facturas.sort((a, b) => {
    const numA = parseInt(String(a.numeroFactura).replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(String(b.numeroFactura).replace(/\D/g, ''), 10) || 0;
    return numB - numA;
  });

  return facturas;
}
