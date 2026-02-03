import { useState, useEffect } from 'react';
import { Factura, TipoCombustible, AnosServicio } from '../types';
import { calcularValoresFactura } from '../utils/calculos';
import { formatearMoneda } from '../utils/calculos';

const COMERCIALIZADORAS_DEFAULT = [
  'HIDROBO',
  'VEHICENTRO',
  'ASSA',
  'AMBACAR',
  'CIAUTO',
  'ASIAUTO',
  'PROAUTO',
  'AUTOPLEX',
];

// Colores predefinidos: nombre (para compatibilidad) y hex (color real)
const COLORES_PREDEFINIDOS: { nombre: string; hex: string }[] = [
  { nombre: 'Blanco', hex: '#FFFFFF' },
  { nombre: 'Rojo', hex: '#DC2626' },
  { nombre: 'Azul', hex: '#2563EB' },
  { nombre: 'Amarillo', hex: '#FACC15' },
  { nombre: 'Crema', hex: '#FEF3C7' },
  { nombre: 'Gris', hex: '#6B7280' },
];
const NOMBRE_A_HEX: Record<string, string> = {
  BLANCO: '#FFFFFF', Blanco: '#FFFFFF', blanco: '#FFFFFF',
  ROJO: '#DC2626', Rojo: '#DC2626', rojo: '#DC2626',
  AZUL: '#2563EB', Azul: '#2563EB', azul: '#2563EB',
  AMARILLO: '#FACC15', Amarillo: '#FACC15', amarillo: '#FACC15',
  CREMA: '#FEF3C7', Crema: '#FEF3C7', crema: '#FEF3C7',
  GRIS: '#6B7280', Gris: '#6B7280', gris: '#6B7280',
};
const HEXES_PREDEFINIDOS = COLORES_PREDEFINIDOS.map((c) => c.hex);

interface Props {
  factura?: Factura;
  onSubmit: (factura: Omit<Factura, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

export default function FormFactura({ factura, onSubmit, onCancel }: Props) {
  const [comercializadora, setComercializadora] = useState(factura?.comercializadora || '');
  const [nuevaComercializadora, setNuevaComercializadora] = useState('');
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [numeroFactura, setNumeroFactura] = useState(factura?.numeroFactura || '');
  const [valorTotal, setValorTotal] = useState(factura?.valorTotal || 0);
  const [valorTotalInput, setValorTotalInput] = useState(factura?.valorTotal?.toString() || '');
  const [anosServicio, setAnosServicio] = useState<AnosServicio>(() => {
    if (factura?.anosServicio) {
      // Convertir números antiguos a strings
      return typeof factura.anosServicio === 'number' 
        ? String(factura.anosServicio) as AnosServicio
        : factura.anosServicio;
    }
    return '2';
  });
  // Fecha local en YYYY-MM-DD (evita que toISOString() muestre el día siguiente en zonas UTC-)
  const fechaHoyLocal = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const [fechaFactura, setFechaFactura] = useState(
    factura?.fechaFactura 
      ? new Date(factura.fechaFactura).toISOString().split('T')[0]
      : fechaHoyLocal()
  );
  const [cliente, setCliente] = useState(factura?.cliente || '');
  const [pagada, setPagada] = useState(factura?.pagada ?? false);
  const [cargando, setCargando] = useState(false);

  // Normalizar color guardado (nombre -> hex) para compatibilidad
  const colorInicial = (() => {
    const c = factura?.datosVehiculo?.color;
    if (!c) return '';
    return NOMBRE_A_HEX[c] || c;
  })();

  // Datos del vehículo
  const [datosVehiculo, setDatosVehiculo] = useState(() => ({
    ...(factura?.datosVehiculo || {
      modelo: '',
      ano: undefined,
      tipo: undefined,
      placa: '',
      color: '',
      ciudad: '',
      direccion: '',
      telefono: '',
      fechaEntrega: undefined,
    }),
    color: colorInicial || (factura?.datosVehiculo?.color ?? ''),
  }));

  // Calcular valores automáticamente
  const valoresCalculados = calcularValoresFactura(valorTotal, anosServicio);

  // Comercializadoras que el usuario eligió ocultar (solo las predefinidas)
  const [ocultas, setOcultas] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('comercializadoras-ocultas');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  // Comercializadoras disponibles (defaults no ocultas + personalizadas desde localStorage)
  const [comercializadoras, setComercializadoras] = useState<string[]>(() => {
    try {
      const ocultasRaw = localStorage.getItem('comercializadoras-ocultas');
      const ocultasInit = ocultasRaw ? JSON.parse(ocultasRaw) : [];
      const personalizadasRaw = localStorage.getItem('comercializadoras-personalizadas');
      const personalizadas = personalizadasRaw ? JSON.parse(personalizadasRaw) : [];
      return [...COMERCIALIZADORAS_DEFAULT.filter(c => !ocultasInit.includes(c)), ...personalizadas];
    } catch {
      return [...COMERCIALIZADORAS_DEFAULT];
    }
  });

  useEffect(() => {
    const personalizadasRaw = localStorage.getItem('comercializadoras-personalizadas');
    const personalizadas = personalizadasRaw ? JSON.parse(personalizadasRaw) : [];
    setComercializadoras([...COMERCIALIZADORAS_DEFAULT.filter(c => !ocultas.includes(c)), ...personalizadas]);
  }, [ocultas]);

  // Colores disponibles: hex (predefinidos + personalizados desde localStorage)
  const [colores, setColores] = useState<string[]>(() => {
    const custom = localStorage.getItem('colores-vehiculo-hex');
    return custom ? [...HEXES_PREDEFINIDOS, ...JSON.parse(custom)] : [...HEXES_PREDEFINIDOS];
  });
  const [mostrarColorPicker, setMostrarColorPicker] = useState(false);
  const [colorElegido, setColorElegido] = useState('#000000');

  // Si la factura tiene un color que no está en la lista (p. ej. hex guardado), agregarlo al editar
  useEffect(() => {
    const hex = datosVehiculo.color?.startsWith('#') ? datosVehiculo.color : NOMBRE_A_HEX[datosVehiculo.color];
    if (!hex) return;
    setColores(prev => (prev.includes(hex) ? prev : [...prev, hex]));
  }, [datosVehiculo.color]);

  const handleAgregarComercializadora = () => {
    if (nuevaComercializadora.trim() && !comercializadoras.includes(nuevaComercializadora.trim().toUpperCase())) {
      const nuevas = [...comercializadoras, nuevaComercializadora.trim().toUpperCase()];
      setComercializadoras(nuevas);
      setComercializadora(nuevaComercializadora.trim().toUpperCase());
      setNuevaComercializadora('');
      setMostrarNueva(false);
      
      const personalizadas = nuevas.filter(c => !COMERCIALIZADORAS_DEFAULT.includes(c));
      localStorage.setItem('comercializadoras-personalizadas', JSON.stringify(personalizadas));
    }
  };

  const handleEliminarComercializadora = (nombre: string) => {
    if (COMERCIALIZADORAS_DEFAULT.includes(nombre)) {
      const nuevasOcultas = [...ocultas, nombre];
      setOcultas(nuevasOcultas);
      localStorage.setItem('comercializadoras-ocultas', JSON.stringify(nuevasOcultas));
    } else {
      const nuevas = comercializadoras.filter(c => c !== nombre);
      setComercializadoras(nuevas);
      const personalizadas = nuevas.filter(c => !COMERCIALIZADORAS_DEFAULT.includes(c) || ocultas.includes(c));
      localStorage.setItem('comercializadoras-personalizadas', JSON.stringify(personalizadas));
    }
    if (comercializadora === nombre) {
      setComercializadora('');
    }
  };

  const handleAgregarColorElegido = () => {
    const hex = colorElegido.toUpperCase();
    if (!hex || colores.includes(hex)) return;
    const nuevos = [...colores, hex];
    setColores(nuevos);
    setDatosVehiculo(prev => ({ ...prev, color: hex }));
    setMostrarColorPicker(false);
    const personalizados = nuevos.filter(h => !HEXES_PREDEFINIDOS.includes(h));
    localStorage.setItem('colores-vehiculo-hex', JSON.stringify(personalizados));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comercializadora || !numeroFactura || !valorTotal || !cliente) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    setCargando(true);
    try {
      // Preparar datos del vehículo solo si hay información
      const tieneDatosVehiculo = datosVehiculo.modelo || 
        datosVehiculo.ano || 
        datosVehiculo.tipo || 
        datosVehiculo.placa || 
        datosVehiculo.color || 
        datosVehiculo.ciudad || 
        datosVehiculo.direccion || 
        datosVehiculo.telefono || 
        datosVehiculo.fechaEntrega;

      const facturaCompleta: Omit<Factura, 'id' | 'createdAt' | 'updatedAt'> = {
        ...valoresCalculados,
        comercializadora,
        numeroFactura,
        valorTotal,
        anosServicio,
        fechaFactura,
        cliente,
        datosVehiculo: tieneDatosVehiculo ? datosVehiculo : undefined,
        pagada,
      };

      await onSubmit(facturaCompleta);
    } catch (error) {
      console.error('Error al guardar factura:', error);
      alert('Error al guardar la factura');
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        {factura ? 'Editar Factura' : 'Nueva Factura'}
      </h2>

      {/* Información Principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comercializadora *
          </label>
          <div className="flex gap-2">
            <select
              value={comercializadora}
              onChange={(e) => setComercializadora(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccione...</option>
              {comercializadoras.map((com) => (
                <option key={com} value={com}>
                  {com}
                </option>
              ))}
            </select>
            {!mostrarNueva && (
              <button
                type="button"
                onClick={() => setMostrarNueva(true)}
                title="Agregar comercializadora"
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-md border-2 border-dashed border-gray-400 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:border-gray-500 text-xl font-light leading-none"
              >
                +
              </button>
            )}
          </div>
          {comercializadoras.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {comercializadoras.map((com) => (
                <span
                  key={com}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-sm"
                >
                  {com}
                  <button
                    type="button"
                    onClick={() => handleEliminarComercializadora(com)}
                    title={`Eliminar ${com}`}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-0.5 leading-none"
                    aria-label={`Eliminar ${com}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
          {mostrarNueva && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={nuevaComercializadora}
                onChange={(e) => setNuevaComercializadora(e.target.value)}
                placeholder="Nueva comercializadora"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2"
              />
              <button
                type="button"
                onClick={handleAgregarComercializadora}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => {
                  setMostrarNueva(false);
                  setNuevaComercializadora('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de Factura *
          </label>
          <input
            type="text"
            value={numeroFactura}
            onChange={(e) => setNumeroFactura(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Factura *
          </label>
          <input
            type="date"
            value={fechaFactura}
            onChange={(e) => setFechaFactura(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cliente *
          </label>
          <input
            type="text"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor Total *
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={valorTotalInput}
            onChange={(e) => {
              const value = e.target.value;
              // Permitir solo números y un punto decimal
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setValorTotalInput(value);
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                  setValorTotal(numValue);
                } else if (value === '' || value === '.') {
                  setValorTotal(0);
                }
              }
            }}
            onBlur={() => {
              // Asegurar que el valor final sea un número válido
              const numValue = parseFloat(valorTotalInput);
              if (!isNaN(numValue) && numValue >= 0) {
                setValorTotal(numValue);
                setValorTotalInput(numValue.toString());
              } else {
                setValorTotal(0);
                setValorTotalInput('0');
              }
            }}
            placeholder="0.00"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Años de Servicio *
          </label>
          <select
            value={anosServicio}
            onChange={(e) => setAnosServicio(e.target.value as AnosServicio)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="1">1 Año ($208)</option>
            <option value="2">2 Años ($301)</option>
            <option value="3">3 Años ($394)</option>
            <option value="1-cayambe">1 Año ($228) Cayambe</option>
            <option value="2-cayambe">2 Años ($321) Cayambe</option>
            <option value="3-cayambe">3 Años ($414) Cayambe</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="pagada"
            type="checkbox"
            checked={pagada}
            onChange={(e) => setPagada(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="pagada" className="text-sm font-medium text-gray-700">
            Factura pagada
          </label>
        </div>
      </div>

      {/* Valores Calculados */}
      <div className="bg-blue-50 p-4 rounded-md">
        <h3 className="font-semibold text-gray-800 mb-3">Valores Calculados:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Valor Fijo:</span>
            <span className="ml-2 font-semibold">{formatearMoneda(valoresCalculados.valorFijo)}</span>
          </div>
          <div>
            <span className="text-gray-600">Excedente:</span>
            <span className="ml-2 font-semibold">{formatearMoneda(valoresCalculados.excedente)}</span>
          </div>
          <div>
            <span className="text-gray-600">IVA Excedente:</span>
            <span className="ml-2 font-semibold">{formatearMoneda(valoresCalculados.ivaExcedente)}</span>
          </div>
          <div>
            <span className="text-gray-600">Comisión Val:</span>
            <span className="ml-2 font-semibold text-green-600">{formatearMoneda(valoresCalculados.comisionVal)}</span>
          </div>
          <div>
            <span className="text-gray-600">IVA Ganancia Propia:</span>
            <span className="ml-2 font-semibold">{formatearMoneda(valoresCalculados.ivaGananciaPropia)}</span>
          </div>
          <div>
            <span className="text-gray-600">Total IVA:</span>
            <span className="ml-2 font-semibold text-red-600">{formatearMoneda(valoresCalculados.totalIva)}</span>
          </div>
        </div>
      </div>

      {/* Datos del Vehículo */}
      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-800 mb-3">Datos del Vehículo (Opcional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
            <input
              type="text"
              value={datosVehiculo.modelo || ''}
              onChange={(e) => setDatosVehiculo({ ...datosVehiculo, modelo: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
            <input
              type="number"
              value={datosVehiculo.ano || ''}
              onChange={(e) => setDatosVehiculo({ ...datosVehiculo, ano: parseInt(e.target.value) || undefined })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={datosVehiculo.tipo || ''}
              onChange={(e) => setDatosVehiculo({ ...datosVehiculo, tipo: e.target.value as TipoCombustible || undefined })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione...</option>
              <option value="DIESEL">Diesel</option>
              <option value="GASOLINA">Gasolina</option>
              <option value="ELECTRICO">Eléctrico</option>
              <option value="HIBRIDO">Híbrido</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
            <input
              type="text"
              value={datosVehiculo.placa || ''}
              onChange={(e) => setDatosVehiculo({ ...datosVehiculo, placa: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex flex-wrap items-center gap-2">
              {colores.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  title={hex}
                  onClick={() => setDatosVehiculo(prev => ({ ...prev, color: hex }))}
                  className={`w-9 h-9 rounded-full border-2 transition-all ${
                    datosVehiculo.color === hex
                      ? 'border-blue-600 ring-2 ring-blue-200 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
              <button
                type="button"
                onClick={() => setMostrarColorPicker(true)}
                title="Agregar color"
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full border-2 border-dashed border-gray-400 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:border-gray-500 text-xl font-light leading-none"
              >
                +
              </button>
            </div>
            {mostrarColorPicker && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <input
                  type="color"
                  value={colorElegido}
                  className="h-10 w-14 cursor-pointer border border-gray-300 rounded"
                  onChange={(e) => setColorElegido(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAgregarColorElegido}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                >
                  Agregar este color
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarColorPicker(false)}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
            <input
              type="text"
              value={datosVehiculo.ciudad || ''}
              onChange={(e) => setDatosVehiculo({ ...datosVehiculo, ciudad: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              type="text"
              value={datosVehiculo.direccion || ''}
              onChange={(e) => setDatosVehiculo({ ...datosVehiculo, direccion: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="text"
              value={datosVehiculo.telefono || ''}
              onChange={(e) => setDatosVehiculo({ ...datosVehiculo, telefono: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Entrega</label>
            <input
              type="date"
              value={datosVehiculo.fechaEntrega ? new Date(datosVehiculo.fechaEntrega).toISOString().split('T')[0] : ''}
              onChange={(e) => setDatosVehiculo({ ...datosVehiculo, fechaEntrega: e.target.value || undefined })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          disabled={cargando}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={cargando}
        >
          {cargando ? 'Guardando...' : factura ? 'Actualizar' : 'Crear Factura'}
        </button>
      </div>
    </form>
  );
}
