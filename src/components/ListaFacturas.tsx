import { Factura } from '../types';
import { formatearMoneda, formatearFecha } from '../utils/calculos';

interface Props {
  facturas: Factura[];
  onEditar: (factura: Factura) => void;
  onEliminar: (id: string) => void;
}

export default function ListaFacturas({ facturas, onEditar, onEliminar }: Props) {
  if (facturas.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No hay facturas registradas</p>
      </div>
    );
  }

  const anosLabel = (f: Factura) => {
    const anos = typeof f.anosServicio === 'string' ? f.anosServicio : String(f.anosServicio);
    if (anos.includes('cayambe')) return `${anos.split('-')[0]} año(s) Cayambe`;
    return `${anos} año(s)`;
  };

  return (
    <>
      {/* Vista móvil/tablet: cards (tabla solo en desktop lg+) */}
      <div className="lg:hidden space-y-3">
        {facturas.map((factura) => (
          <div
            key={factura.id}
            className={`border border-gray-200 rounded-lg p-3 text-sm ${
              factura.noDeseaRenovar ? 'bg-slate-100' : 'bg-white'
            }`}
          >
            <div className="flex justify-between items-start gap-2 mb-2">
              <span className="font-semibold text-gray-900">{factura.cliente}</span>
              <div className="flex items-center gap-2 shrink-0">
                {factura.noDeseaRenovar && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-200 text-slate-800">
                    No renovará
                  </span>
                )}
                <span
                className={`shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${
                  factura.pagada ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {factura.pagada ? 'Pagada' : 'Pendiente'}
              </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-gray-600">
              <span>Fecha</span>
              <span>{formatearFecha(factura.fechaFactura)}</span>
              <span>Comercial</span>
              <span>{factura.comercializadora}</span>
              <span>N° Fact</span>
              <span>{factura.numeroFactura}</span>
              <span>Valor Total</span>
              <span className="font-semibold text-gray-900">{formatearMoneda(factura.valorTotal)}</span>
              <span>Años</span>
              <span>{anosLabel(factura)}</span>
              <span>Comisión Val</span>
              <span className="font-semibold text-green-600">{formatearMoneda(factura.comisionVal)}</span>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => onEditar(factura)}
                className="flex-1 py-1.5 rounded-md text-sm font-medium bg-blue-500 text-white hover:bg-blue-600"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Está seguro de eliminar esta factura?')) onEliminar(factura.id!);
                }}
                className="flex-1 py-1.5 rounded-md text-sm font-medium bg-red-500 text-white hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Vista desktop: tabla */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-24">
                Acciones
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Comercial
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                N° Fact
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Valor Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Años
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Comisión Val
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Total IVA
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {facturas.map((factura) => (
              <tr
                key={factura.id}
                className={`hover:bg-gray-50 ${factura.noDeseaRenovar ? 'bg-slate-50' : ''}`}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEditar(factura)}
                      title="Editar"
                      className="p-1.5 rounded text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('¿Está seguro de eliminar esta factura?')) onEliminar(factura.id!);
                      }}
                      title="Eliminar"
                      className="p-1.5 rounded text-red-600 hover:bg-red-50 hover:text-red-800 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-900">{formatearFecha(factura.fechaFactura)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-900">{factura.comercializadora}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-900">{factura.numeroFactura}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-900">{factura.cliente}</td>
                <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-900">{formatearMoneda(factura.valorTotal)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-900">{anosLabel(factura)}</td>
                <td className="px-4 py-3 whitespace-nowrap font-semibold text-green-600">{formatearMoneda(factura.comisionVal)}</td>
                <td className="px-4 py-3 whitespace-nowrap font-semibold text-red-600">{formatearMoneda(factura.totalIva)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        factura.pagada ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {factura.pagada ? 'Pagada' : 'Pendiente'}
                    </span>
                    {factura.noDeseaRenovar && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-slate-200 text-slate-800">
                        No renovará
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
