import { useState, useMemo } from 'react';
import { Factura } from '../types';
import { formatearMoneda, formatearFecha } from '../utils/calculos';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  facturas: Factura[];
}

type FiltroInstalacion = 'todas' | 'pendientes' | 'instalados';
type FiltroPago = 'todas' | 'pagadas' | 'pendientes';

const TIPO_LABEL: Record<string, string> = {
  DIESEL: 'Diesel',
  GASOLINA: 'Gasolina',
  ELECTRICO: 'Eléctrico',
  HIBRIDO: 'Híbrido',
};

/** Nombre de color → hex (igual que en FormFactura) para mostrar muestra de color */
const NOMBRE_A_HEX: Record<string, string> = {
  BLANCO: '#FFFFFF', Blanco: '#FFFFFF', blanco: '#FFFFFF',
  ROJO: '#DC2626', Rojo: '#DC2626', rojo: '#DC2626',
  AZUL: '#2563EB', Azul: '#2563EB', azul: '#2563EB',
  AMARILLO: '#FACC15', Amarillo: '#FACC15', amarillo: '#FACC15',
  CREMA: '#FEF3C7', Crema: '#FEF3C7', crema: '#FEF3C7',
  GRIS: '#6B7280', Gris: '#6B7280', gris: '#6B7280',
};

function colorToHex(color: string | undefined): string | null {
  if (!color) return null;
  if (color.startsWith('#')) return color;
  const fromName = NOMBRE_A_HEX[color];
  if (fromName) return fromName;
  if (/^[0-9A-Fa-f]{6}$/.test(color)) return `#${color}`;
  return null;
}

function normalizarBusqueda(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function coincideBusqueda(texto: string | undefined, busqueda: string): boolean {
  if (!busqueda) return true;
  if (!texto) return false;
  return normalizarBusqueda(texto).includes(normalizarBusqueda(busqueda));
}

export default function ReportePendientesInstalacion({ facturas }: Props) {
  const [filtroInstalacion, setFiltroInstalacion] = useState<FiltroInstalacion>('todas');
  const [filtroPago, setFiltroPago] = useState<FiltroPago>('todas');
  const [filtroPlaca, setFiltroPlaca] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroCiudad, setFiltroCiudad] = useState('');

  const listadoFiltrado = useMemo(() => {
    return facturas.filter((f) => {
      if (filtroInstalacion === 'pendientes' && f.datosVehiculo?.fechaEntrega) return false;
      if (filtroInstalacion === 'instalados' && !f.datosVehiculo?.fechaEntrega) return false;
      if (filtroPago === 'pagadas' && !f.pagada) return false;
      if (filtroPago === 'pendientes' && f.pagada) return false;
      if (filtroPlaca && !coincideBusqueda(f.datosVehiculo?.placa, filtroPlaca)) return false;
      if (filtroCliente && !coincideBusqueda(f.cliente, filtroCliente)) return false;
      if (filtroCiudad && !coincideBusqueda(f.datosVehiculo?.ciudad, filtroCiudad)) return false;
      return true;
    });
  }, [facturas, filtroInstalacion, filtroPago, filtroPlaca, filtroCliente, filtroCiudad]);

  const ciudadesUnicas = useMemo(() => {
    const set = new Set<string>();
    facturas.forEach((f) => {
      const c = f.datosVehiculo?.ciudad?.trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [facturas]);

  const exportarPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFontSize(14);
    doc.text('Informe: Vehículos (instalación y pago)', 14, 12);
    doc.setFontSize(10);
    doc.text(`Generado: ${formatearFecha(new Date())} — Mostrando: ${listadoFiltrado.length} factura(s)`, 14, 18);

    const headers = [
      'Comercial',
      'Fecha factura',
      'Fecha instal.',
      'N° Fact',
      'Cliente',
      'Valor Total',
      'Años Serv.',
      'Instalación',
      'Pago',
      'Placa',
      'Ciudad',
    ];

    const rows = listadoFiltrado.map((f) => [
      f.comercializadora,
      formatearFecha(f.fechaFactura),
      f.datosVehiculo?.fechaEntrega ? formatearFecha(f.datosVehiculo.fechaEntrega) : '—',
      f.numeroFactura,
      f.cliente,
      formatearMoneda(f.valorTotal),
      String(f.anosServicio).replace('-cayambe', ''),
      f.datosVehiculo?.fechaEntrega ? 'Instalado' : 'Pendiente',
      f.pagada ? 'Pagada' : 'Pendiente',
      f.datosVehiculo?.placa ?? '—',
      f.datosVehiculo?.ciudad ?? '—',
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 24,
      styles: { fontSize: 7 },
      columnStyles: {
        0: { fontSize: 6 },
        4: { fontSize: 6 },
      },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
    });

    doc.save(`reporte-vehiculos-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
          Resumen
        </h2>
        <button
          type="button"
          onClick={exportarPdf}
          disabled={listadoFiltrado.length === 0}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          Exportar a PDF
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm">Filtros</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instalación</label>
            <select
              value={filtroInstalacion}
              onChange={(e) => setFiltroInstalacion(e.target.value as FiltroInstalacion)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todas">Todas</option>
              <option value="pendientes">Pendientes de instalación</option>
              <option value="instalados">Instalados</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pago</label>
            <select
              value={filtroPago}
              onChange={(e) => setFiltroPago(e.target.value as FiltroPago)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todas">Todas</option>
              <option value="pagadas">Pagadas</option>
              <option value="pendientes">Pendientes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
            <input
              type="text"
              value={filtroPlaca}
              onChange={(e) => setFiltroPlaca(e.target.value)}
              placeholder="Ej: ABC-123"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <input
              type="text"
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              placeholder="Nombre del cliente"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
            <select
              value={filtroCiudad}
              onChange={(e) => setFiltroCiudad(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas</option>
              {ciudadesUnicas.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setFiltroInstalacion('todas');
              setFiltroPago('todas');
              setFiltroPlaca('');
              setFiltroCliente('');
              setFiltroCiudad('');
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <p className="text-gray-600 mb-4 text-sm">
        Mostrando <strong>{listadoFiltrado.length}</strong> de <strong>{facturas.length}</strong> factura(s).
      </p>

      {listadoFiltrado.length === 0 ? (
        <p className="text-gray-500 py-8 text-center text-sm">
          No hay facturas que coincidan con los filtros.
        </p>
      ) : (
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="min-w-full border border-gray-200 text-xs sm:text-sm">
            <thead>
              <tr className="bg-blue-500 text-white">
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium">Comercial</th>
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium">Fecha factura</th>
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium">Fecha instal.</th>
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium">N° Fact</th>
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium">Cliente</th>
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-right font-medium">Valor Total</th>
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center font-medium">Años Serv.</th>
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium">Instalación</th>
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium">Pago</th>
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium">Modelo</th>
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium">Tipo</th>
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium">Color</th>
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium">Placa</th>
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium">Ciudad</th>
              </tr>
            </thead>
            <tbody>
              {listadoFiltrado.map((f) => (
                <tr key={f.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm">{f.comercializadora}</td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap">{formatearFecha(f.fechaFactura)}</td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap">
                    {f.datosVehiculo?.fechaEntrega ? formatearFecha(f.datosVehiculo.fechaEntrega) : '—'}
                  </td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2">{f.numeroFactura}</td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm">{f.cliente}</td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right whitespace-nowrap">{formatearMoneda(f.valorTotal)}</td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-center">
                    {String(f.anosServicio).replace('-cayambe', '')}
                  </td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2">
                    {f.datosVehiculo?.fechaEntrega ? (
                      <span className="text-green-700">Instalado</span>
                    ) : (
                      <span className="text-amber-600">Pendiente</span>
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2">
                    {f.pagada ? (
                      <span className="text-green-700">Pagada</span>
                    ) : (
                      <span className="text-amber-600">Pendiente</span>
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm">{f.datosVehiculo?.modelo ?? '—'}</td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2">
                    {f.datosVehiculo?.tipo
                      ? TIPO_LABEL[f.datosVehiculo.tipo] ?? f.datosVehiculo.tipo
                      : '—'}
                  </td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2">
                    {(() => {
                      const hex = colorToHex(f.datosVehiculo?.color);
                      return hex ? (
                        <span
                          className="inline-block w-6 h-6 rounded border border-gray-300 shrink-0"
                          style={{ backgroundColor: hex }}
                          title={f.datosVehiculo?.color ?? ''}
                        />
                      ) : (
                        '—'
                      );
                    })()}
                  </td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2">{f.datosVehiculo?.placa ?? '—'}</td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2">{f.datosVehiculo?.ciudad ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
