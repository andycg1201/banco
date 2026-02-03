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

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
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
            <tr key={factura.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm">
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
                      if (confirm('¿Está seguro de eliminar esta factura?')) {
                        onEliminar(factura.id!);
                      }
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
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {formatearFecha(factura.fechaFactura)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {factura.comercializadora}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {factura.numeroFactura}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {factura.cliente}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                {formatearMoneda(factura.valorTotal)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {(() => {
                  const anos = typeof factura.anosServicio === 'string' 
                    ? factura.anosServicio 
                    : String(factura.anosServicio);
                  
                  if (anos.includes('cayambe')) {
                    return `${anos.split('-')[0]} año(s) Cayambe`;
                  }
                  return `${anos} año(s)`;
                })()}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                {formatearMoneda(factura.comisionVal)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-red-600">
                {formatearMoneda(factura.totalIva)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    factura.pagada
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {factura.pagada ? 'Pagada' : 'Pendiente'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
