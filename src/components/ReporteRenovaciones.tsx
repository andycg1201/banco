import { useState, useMemo } from 'react';
import { Factura } from '../types';
import {
  formatearMoneda,
  formatearFecha,
  calcularFechaVencimiento,
  diasHastaVencimiento,
  estaProximoAVencer,
} from '../utils/calculos';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  facturas: Factura[];
}

type FiltroEstado = 'todas' | 'proximas' | 'vencidas' | 'vigentes';
type FiltroRenovacion = 'todas' | 'renovaran' | 'noRenovaran';

export default function ReporteRenovaciones({ facturas }: Props) {
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todas');
  const [filtroRenovacion, setFiltroRenovacion] = useState<FiltroRenovacion>('todas');

  const facturasConVencimiento = useMemo(() => {
    return facturas
      .filter((f) => f.datosVehiculo?.fechaEntrega)
      .map((f) => {
        const fechaVenc = calcularFechaVencimiento(
          f.datosVehiculo!.fechaEntrega,
          f.anosServicio
        );
        const dias = fechaVenc ? diasHastaVencimiento(fechaVenc) : null;
        const proxima = dias !== null && estaProximoAVencer(dias);
        const vencida = dias !== null && dias < 0;
        return {
          factura: f,
          fechaVencimiento: fechaVenc,
          diasRestantes: dias,
          proximoAVencer: proxima,
          vencida,
        };
      });
  }, [facturas]);

  const listadoFiltrado = useMemo(() => {
    const filtrado = facturasConVencimiento.filter(({ factura, diasRestantes, proximoAVencer, vencida }) => {
      if (filtroRenovacion === 'noRenovaran' && !factura.noDeseaRenovar) return false;
      if (filtroRenovacion === 'renovaran' && factura.noDeseaRenovar) return false;

      if (filtroEstado === 'proximas' && !proximoAVencer) return false;
      if (filtroEstado === 'vencidas' && !vencida) return false;
      if (filtroEstado === 'vigentes' && diasRestantes !== null && (diasRestantes < 0 || diasRestantes <= 15))
        return false;

      return true;
    });
    // Ordenar por días restantes de menor a mayor (los que vencen antes primero)
    return filtrado.slice().sort((a, b) => {
      const diasA = a.diasRestantes ?? 999999;
      const diasB = b.diasRestantes ?? 999999;
      return diasA - diasB;
    });
  }, [facturasConVencimiento, filtroEstado, filtroRenovacion]);

  const exportarPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFontSize(14);
    doc.text('Reporte: Próximas Renovaciones de Servicio', 14, 12);
    doc.setFontSize(10);
    doc.text(
      `Generado: ${formatearFecha(new Date())} — Mostrando: ${listadoFiltrado.length} factura(s)`,
      14,
      18
    );

    const headers = [
      'Comercial',
      'N° Fact',
      'Cliente',
      'Placa',
      'Fecha Instal.',
      'Fecha Venc.',
      'Días',
      'Estado',
      'Renovación',
    ];

    const rows = listadoFiltrado.map(({ factura, fechaVencimiento, diasRestantes }) => {
      let estado = 'Vigente';
      if (diasRestantes !== null) {
        if (diasRestantes < 0) estado = 'Vencido';
        else if (diasRestantes <= 15) estado = 'Próximo a vencer';
      }
      return [
        factura.comercializadora,
        factura.numeroFactura,
        factura.cliente,
        factura.datosVehiculo?.placa ?? '—',
        factura.datosVehiculo?.fechaEntrega
          ? formatearFecha(factura.datosVehiculo.fechaEntrega)
          : '—',
        fechaVencimiento ? formatearFecha(fechaVencimiento) : '—',
        diasRestantes !== null ? String(diasRestantes) : '—',
        estado,
        factura.noDeseaRenovar ? 'No renovará' : 'Pendiente',
      ];
    });

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 24,
      styles: { fontSize: 7 },
      columnStyles: {
        2: { fontSize: 6 },
      },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
    });

    doc.save(`reporte-renovaciones-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const sinFechaEntrega = facturas.filter((f) => !f.datosVehiculo?.fechaEntrega).length;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
          Próximas Renovaciones
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

      <p className="text-gray-600 mb-4 text-sm">
        Se consideran facturas con <strong>Fecha de Entrega</strong> registrada.
        Fecha de vencimiento = Fecha de Entrega + Años de Servicio.
        Alerta a 15 días antes del vencimiento.
      </p>

      {sinFechaEntrega > 0 && (
        <p className="text-amber-700 bg-amber-50 px-3 py-2 rounded mb-4 text-sm">
          {sinFechaEntrega} factura(s) sin fecha de entrega no aparecen en este reporte.
        </p>
      )}

      {/* Filtros */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm">Filtros</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todas">Todas</option>
              <option value="proximas">Próximas a vencer (≤15 días)</option>
              <option value="vencidas">Vencidas</option>
              <option value="vigentes">Vigentes (sin vencer pronto)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Renovación</label>
            <select
              value={filtroRenovacion}
              onChange={(e) => setFiltroRenovacion(e.target.value as FiltroRenovacion)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todas">Todas</option>
              <option value="renovaran">Pendientes de renovar</option>
              <option value="noRenovaran">No renovará</option>
            </select>
          </div>
        </div>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => {
              setFiltroEstado('todas');
              setFiltroRenovacion('todas');
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <p className="text-gray-600 mb-4 text-sm">
        Mostrando <strong>{listadoFiltrado.length}</strong> de{' '}
        <strong>{facturasConVencimiento.length}</strong> factura(s) con fecha de instalación.
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
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium">N° Fact</th>
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium">Cliente</th>
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium">Placa</th>
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium">Fecha Instal.</th>
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium">Fecha Venc.</th>
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center font-medium">Días</th>
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium">Estado</th>
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium">Renovación</th>
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-right font-medium">Valor Total</th>
              </tr>
            </thead>
            <tbody>
              {listadoFiltrado.map(({ factura, fechaVencimiento, diasRestantes }) => {
                let estadoLabel = 'Vigente';
                let estadoClass = 'text-green-700';
                if (diasRestantes !== null) {
                  if (diasRestantes < 0) {
                    estadoLabel = 'Vencido';
                    estadoClass = 'text-red-600';
                  } else if (diasRestantes <= 15) {
                    estadoLabel = 'Próximo a vencer';
                    estadoClass = 'text-amber-600 font-medium';
                  }
                }
                return (
                  <tr
                    key={factura.id}
                    className={`border-b border-gray-200 hover:bg-gray-50 ${
                      factura.noDeseaRenovar ? 'bg-slate-50' : ''
                    }`}
                  >
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2">{factura.comercializadora}</td>
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2">{factura.numeroFactura}</td>
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2">{factura.cliente}</td>
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2">
                      {factura.datosVehiculo?.placa ?? '—'}
                    </td>
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap">
                      {factura.datosVehiculo?.fechaEntrega
                        ? formatearFecha(factura.datosVehiculo.fechaEntrega)
                        : '—'}
                    </td>
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap">
                      {fechaVencimiento ? formatearFecha(fechaVencimiento) : '—'}
                    </td>
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-center">
                      {diasRestantes !== null ? diasRestantes : '—'}
                    </td>
                    <td className={`px-2 sm:px-3 py-1.5 sm:py-2 ${estadoClass}`}>
                      {estadoLabel}
                    </td>
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2">
                      {factura.noDeseaRenovar ? (
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-slate-200 text-slate-800">
                          No renovará
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right whitespace-nowrap">
                      {formatearMoneda(factura.valorTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
