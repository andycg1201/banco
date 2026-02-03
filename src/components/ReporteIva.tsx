import { useState, useEffect } from 'react';
import { Factura, CorteSemestral } from '../types';
import { obtenerPeriodoSemestral, formatearMoneda, formatearFecha } from '../utils/calculos';
import { obtenerFacturasPorPeriodo } from '../services/facturasService';

interface Props {
  facturas: Factura[];
}

export default function ReporteIva({ facturas }: Props) {
  const [cortes, setCortes] = useState<CorteSemestral[]>([]);
  const [corteSeleccionado, setCorteSeleccionado] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  useEffect(() => {
    // Generar cortes semestrales desde los datos disponibles
    const cortesGenerados = generarCortesSemestrales(facturas);
    setCortes(cortesGenerados);
  }, [facturas]);

  const generarCortesSemestrales = (facturas: Factura[]): CorteSemestral[] => {
    const cortesMap = new Map<string, CorteSemestral>();

    facturas.forEach((factura) => {
      const fecha = new Date(factura.fechaFactura);
      const periodo = obtenerPeriodoSemestral(fecha);
      const key = `${periodo.inicio.toISOString()}-${periodo.fin.toISOString()}`;

      if (!cortesMap.has(key)) {
        cortesMap.set(key, {
          inicio: periodo.inicio.toISOString(),
          fin: periodo.fin.toISOString(),
          totalIva: 0,
          facturas: [],
        });
      }

      const corte = cortesMap.get(key)!;
      corte.facturas.push(factura);
      corte.totalIva += factura.totalIva;
    });

    return Array.from(cortesMap.values()).sort((a, b) => 
      new Date(a.inicio).getTime() - new Date(b.inicio).getTime()
    );
  };

  const handleGenerarReportePersonalizado = async () => {
    if (!fechaInicio || !fechaFin) {
      alert('Por favor seleccione las fechas de inicio y fin');
      return;
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const facturasPeriodo = await obtenerFacturasPorPeriodo(inicio, fin);
    
    const totalIva = facturasPeriodo.reduce((sum, f) => sum + f.totalIva, 0);
    
    alert(`Total IVA del período: ${formatearMoneda(totalIva)}\nFacturas: ${facturasPeriodo.length}`);
  };

  const corteActual = cortes.find(c => c.inicio === corteSeleccionado);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Reportes de IVA</h2>

      {/* Reporte por Periodo Personalizado */}
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-semibold text-gray-800 mb-3">Reporte por Período Personalizado</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerarReportePersonalizado}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Generar Reporte
            </button>
          </div>
        </div>
      </div>

      {/* Cortes Semestrales */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Cortes Semestrales</h3>
        <div className="space-y-2">
          {cortes.map((corte, index) => {
            const inicio = new Date(corte.inicio);
            const esPrimerSemestre = inicio.getMonth() < 6;
            const ano = inicio.getFullYear();
            const label = `${esPrimerSemestre ? 'Enero-Junio' : 'Julio-Diciembre'} ${ano}`;

            return (
              <div
                key={index}
                className={`p-4 border rounded-md cursor-pointer transition-colors ${
                  corteSeleccionado === corte.inicio
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setCorteSeleccionado(corteSeleccionado === corte.inicio ? null : corte.inicio)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-gray-800">{label}</h4>
                    <p className="text-sm text-gray-600">
                      {formatearFecha(corte.inicio)} - {formatearFecha(corte.fin)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {corte.facturas.length} factura(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">
                      {formatearMoneda(corte.totalIva)}
                    </p>
                    <p className="text-xs text-gray-500">Total IVA</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detalle del Corte Seleccionado */}
      {corteActual && (
        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-800 mb-3">Detalle del Corte</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                    Fecha
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                    N° Factura
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                    Cliente
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                    Valor Total
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                    IVA Ganancia Propia
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                    IVA Excedente
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                    Total IVA
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {corteActual.facturas.map((factura) => (
                  <tr key={factura.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {formatearFecha(factura.fechaFactura)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {factura.numeroFactura}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {factura.cliente}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {formatearMoneda(factura.valorTotal)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {formatearMoneda(factura.ivaGananciaPropia)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {formatearMoneda(factura.ivaExcedente)}
                    </td>
                    <td className="px-4 py-2 text-sm font-semibold text-red-600">
                      {formatearMoneda(factura.totalIva)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100">
                <tr>
                  <td colSpan={6} className="px-4 py-2 text-right font-semibold text-gray-800">
                    Total:
                  </td>
                  <td className="px-4 py-2 text-sm font-bold text-red-600">
                    {formatearMoneda(corteActual.totalIva)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
