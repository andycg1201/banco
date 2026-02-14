import { useState, useMemo } from 'react';
import { Factura } from '../types';
import { formatearMoneda, formatearFecha, parseLocalDate } from '../utils/calculos';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  facturas: Factura[];
}

type FiltroPeriodo = 'este_mes' | 'mes_anterior' | 'rango';

/** Ganancia = Valor factura - Comisión Val - Total IVA */
function gananciaPorFactura(f: Factura): number {
  return f.valorTotal - f.comisionVal - f.totalIva;
}

function inicioMes(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function finMes(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export default function ReporteGanancia({ facturas }: Props) {
  const hoy = new Date();
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>('este_mes');
  const [fechaInicio, setFechaInicio] = useState(() => {
    const i = inicioMes(hoy);
    return i.toISOString().slice(0, 10);
  });
  const [fechaFin, setFechaFin] = useState(() => {
    const f = finMes(hoy);
    return f.toISOString().slice(0, 10);
  });

  const { inicio, fin } = useMemo(() => {
    if (filtroPeriodo === 'este_mes') {
      return { inicio: inicioMes(hoy), fin: finMes(hoy) };
    }
    if (filtroPeriodo === 'mes_anterior') {
      const prev = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      return { inicio: inicioMes(prev), fin: finMes(prev) };
    }
    return {
      inicio: new Date(fechaInicio + 'T00:00:00'),
      fin: new Date(fechaFin + 'T23:59:59'),
    };
  }, [filtroPeriodo, fechaInicio, fechaFin]);

  const listadoFiltrado = useMemo(() => {
    const inicioMs = inicio.getTime();
    const finMs = fin.getTime();
    return facturas
      .filter((f) => {
        const d = parseLocalDate(f.fechaFactura);
        const t = d.getTime();
        return !isNaN(t) && t >= inicioMs && t <= finMs;
      })
      .sort((a, b) => parseLocalDate(a.fechaFactura).getTime() - parseLocalDate(b.fechaFactura).getTime());
  }, [facturas, inicio, fin]);

  const totales = useMemo(() => {
    let vTotal = 0;
    let cVal = 0;
    let tIva = 0;
    let gan = 0;
    listadoFiltrado.forEach((f) => {
      vTotal += f.valorTotal;
      cVal += f.comisionVal;
      tIva += f.totalIva;
      gan += gananciaPorFactura(f);
    });
    return { valorTotal: vTotal, comisionVal: cVal, totalIva: tIva, ganancia: gan };
  }, [listadoFiltrado]);

  const exportarPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFontSize(14);
    doc.text('Reporte: Ganancia de la empresa', 14, 12);
    doc.setFontSize(10);
    doc.text(
      `Período: ${formatearFecha(inicio)} - ${formatearFecha(fin)} | Generado: ${formatearFecha(new Date())} | ${listadoFiltrado.length} factura(s)`,
      14,
      18
    );

    const headers = ['Fecha', 'N° Fact', 'Cliente', 'Valor Total', 'Comisión Val', 'Total IVA', 'Ganancia'];

    const rows = listadoFiltrado.map((f) => [
      formatearFecha(f.fechaFactura),
      f.numeroFactura,
      f.cliente,
      formatearMoneda(f.valorTotal),
      formatearMoneda(f.comisionVal),
      formatearMoneda(f.totalIva),
      formatearMoneda(gananciaPorFactura(f)),
    ]);

    rows.push([
      'TOTAL',
      '',
      '',
      formatearMoneda(totales.valorTotal),
      formatearMoneda(totales.comisionVal),
      formatearMoneda(totales.totalIva),
      formatearMoneda(totales.ganancia),
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 24,
      styles: { fontSize: 7 },
      columnStyles: { 2: { fontSize: 6 } },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.row.index === rows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [226, 232, 240];
        }
      },
    });

    doc.save(`reporte-ganancia-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
          Ganancia de la empresa
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
        Ganancia = Valor de la factura − Comisión Val − Total IVA
      </p>

      {/* Filtros por período */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm">Período</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFiltroPeriodo('este_mes')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                filtroPeriodo === 'este_mes'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Este mes
            </button>
            <button
              type="button"
              onClick={() => setFiltroPeriodo('mes_anterior')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                filtroPeriodo === 'mes_anterior'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Mes anterior
            </button>
            <button
              type="button"
              onClick={() => setFiltroPeriodo('rango')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                filtroPeriodo === 'rango'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Rango de fechas
            </button>
          </div>
          {filtroPeriodo === 'rango' && (
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>
        <p className="mt-2 text-gray-500 text-xs">
          Mostrando: {formatearFecha(inicio)} — {formatearFecha(fin)}
        </p>
      </div>

      <p className="text-gray-600 mb-4 text-sm">
        <strong>{listadoFiltrado.length}</strong> factura(s) en el período.
      </p>

      {listadoFiltrado.length === 0 ? (
        <p className="text-gray-500 py-8 text-center text-sm">
          No hay facturas en el período seleccionado.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto -mx-2 sm:mx-0 mb-4">
            <table className="min-w-full border border-gray-200 text-xs sm:text-sm">
              <thead>
                <tr className="bg-blue-500 text-white">
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium">Fecha</th>
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium">N° Fact</th>
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium">Cliente</th>
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-right font-medium">Valor Total</th>
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-right font-medium">Comisión Val</th>
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-right font-medium">Total IVA</th>
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-right font-medium">Ganancia</th>
                </tr>
              </thead>
              <tbody>
                {listadoFiltrado.map((f) => (
                  <tr key={f.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap">
                      {formatearFecha(f.fechaFactura)}
                    </td>
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2">{f.numeroFactura}</td>
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2">{f.cliente}</td>
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right whitespace-nowrap">
                      {formatearMoneda(f.valorTotal)}
                    </td>
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right whitespace-nowrap text-green-600">
                      {formatearMoneda(f.comisionVal)}
                    </td>
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right whitespace-nowrap text-red-600">
                      {formatearMoneda(f.totalIva)}
                    </td>
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right whitespace-nowrap font-semibold text-gray-900">
                      {formatearMoneda(gananciaPorFactura(f))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-gray-300">
                  <td className="px-2 sm:px-3 py-2" colSpan={3}>
                    TOTAL
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-right whitespace-nowrap">
                    {formatearMoneda(totales.valorTotal)}
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-right whitespace-nowrap text-green-700">
                    {formatearMoneda(totales.comisionVal)}
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-right whitespace-nowrap text-red-700">
                    {formatearMoneda(totales.totalIva)}
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-right whitespace-nowrap text-gray-900">
                    {formatearMoneda(totales.ganancia)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
