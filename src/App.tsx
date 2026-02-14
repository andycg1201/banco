import { useState, useEffect, useMemo } from 'react';
import { Factura } from './types';
import { crearFactura, actualizarFactura, eliminarFactura, obtenerFacturas, obtenerFacturasPorPeriodo } from './services/facturasService';
import FormFactura from './components/FormFactura';
import ListaFacturas from './components/ListaFacturas';
import ReporteIva from './components/ReporteIva';
import ReportePendientesInstalacion from './components/ReportePendientesInstalacion';
import ReporteRenovaciones from './components/ReporteRenovaciones';
import ReporteGanancia from './components/ReporteGanancia';
import Login from './components/Login';
import { calcularValoresFactura, parseLocalDate } from './utils/calculos';
import { useAuth } from './contexts/AuthContext';
import { cerrarSesion } from './services/authService';
import { isRestrictedUser } from './config/auth';

type Vista = 'lista' | 'nueva' | 'editar' | 'reportes';

type SubVistaReportes = 'iva' | 'pendientes' | 'renovaciones' | 'ganancia';

type FiltroPeriodoLista = 'este_mes' | 'mes_anterior' | 'rango';

function inicioMes(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function finMes(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function App() {
  const { user, loading } = useAuth();
  const [vista, setVista] = useState<Vista>('lista');
  const [subVistaReportes, setSubVistaReportes] = useState<SubVistaReportes>('iva');
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [facturaEditando, setFacturaEditando] = useState<Factura | undefined>();
  const [cargando, setCargando] = useState(false);
  const [facturasModo, setFacturasModo] = useState<'periodo' | 'completo'>('periodo');

  // Filtros lista: período (default este mes) y cliente
  const hoy = new Date();
  const [listFiltroPeriodo, setListFiltroPeriodo] = useState<FiltroPeriodoLista>('este_mes');
  const [listFechaInicio, setListFechaInicio] = useState(() =>
    inicioMes(hoy).toISOString().slice(0, 10)
  );
  const [listFechaFin, setListFechaFin] = useState(() =>
    finMes(hoy).toISOString().slice(0, 10)
  );
  const [listFiltroCliente, setListFiltroCliente] = useState('');

  const listPeriodoInicioFin = (): { inicio: Date; fin: Date } => {
    if (listFiltroPeriodo === 'este_mes') {
      return { inicio: inicioMes(hoy), fin: finMes(hoy) };
    }
    if (listFiltroPeriodo === 'mes_anterior') {
      const prev = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      return { inicio: inicioMes(prev), fin: finMes(prev) };
    }
    const inicio = new Date(listFechaInicio + 'T00:00:00');
    const fin = new Date(listFechaFin + 'T23:59:59');
    return { inicio, fin };
  };

  useEffect(() => {
    if (!user) return;
    if (isRestrictedUser(user.email)) {
      cargarFacturasCompleto();
      return;
    }
    // Buscar por cliente: carga todas las facturas (sin filtro de fechas)
    if (listFiltroCliente.trim()) {
      cargarFacturasCompleto();
      return;
    }
    // Por defecto: carga por período
    cargarFacturasLista();
  }, [user, listFiltroPeriodo, listFechaInicio, listFechaFin, listFiltroCliente]);

  const cargarFacturasCompleto = async () => {
    try {
      setCargando(true);
      const data = await obtenerFacturas();
      setFacturas(data);
      setFacturasModo('completo');
    } catch (error) {
      console.error('Error al cargar facturas:', error);
      alert('Error al cargar las facturas');
    } finally {
      setCargando(false);
    }
  };

  const cargarFacturasLista = async (inicio?: Date, fin?: Date) => {
    const { inicio: i, fin: f } = inicio && fin ? { inicio, fin } : listPeriodoInicioFin();
    try {
      setCargando(true);
      const data = await obtenerFacturasPorPeriodo(i, f);
      setFacturas(data);
      setFacturasModo('periodo');
    } catch (error) {
      console.error('Error al cargar facturas:', error);
      alert('Error al cargar las facturas');
    } finally {
      setCargando(false);
    }
  };

  const facturasParaLista = useMemo(() => {
    // Buscar por cliente: ignora fechas, filtra solo por nombre
    if (listFiltroCliente.trim()) {
      const q = listFiltroCliente.trim().toLowerCase();
      return facturas.filter((f) =>
        f.cliente?.toLowerCase().includes(q)
      );
    }
    // Sin filtro cliente: aplicar período
    if (facturasModo === 'completo') {
      const { inicio, fin } = listPeriodoInicioFin();
      const iniMs = inicio.getTime();
      const finMs = fin.getTime();
      return facturas.filter((f) => {
        const d = parseLocalDate(f.fechaFactura);
        const t = d.getTime();
        return !isNaN(t) && t >= iniMs && t <= finMs;
      });
    }
    return facturas;
  }, [facturas, listFiltroCliente, listFiltroPeriodo, listFechaInicio, listFechaFin, facturasModo]);

  const recargarLista = () => {
    if (isRestrictedUser(user?.email ?? '')) {
      cargarFacturasCompleto();
      return;
    }
    if (vista === 'reportes' || facturasModo === 'completo') {
      cargarFacturasCompleto();
      return;
    }
    cargarFacturasLista();
  };

  const handleCrearFactura = async (factura: Omit<Factura, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Asegurar que los cálculos están correctos
      const valoresCalculados = calcularValoresFactura(factura.valorTotal, factura.anosServicio);
      const facturaCompleta = {
        ...factura,
        ...valoresCalculados,
      };

      await crearFactura(facturaCompleta);
      await recargarLista();
      setVista('lista');
    } catch (error) {
      console.error('Error al crear factura:', error);
      alert('Error al crear la factura');
      throw error;
    }
  };

  const handleActualizarFactura = async (factura: Omit<Factura, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!facturaEditando?.id) return;

    try {
      // Asegurar que los cálculos están correctos
      const valoresCalculados = calcularValoresFactura(factura.valorTotal, factura.anosServicio);
      const facturaCompleta = {
        ...factura,
        ...valoresCalculados,
      };

      await actualizarFactura(facturaEditando.id, facturaCompleta);
      await recargarLista();
      setVista('lista');
      setFacturaEditando(undefined);
    } catch (error) {
      console.error('Error al actualizar factura:', error);
      alert('Error al actualizar la factura');
      throw error;
    }
  };

  const handleEliminarFactura = async (id: string) => {
    try {
      await eliminarFactura(id);
      await recargarLista();
    } catch (error) {
      console.error('Error al eliminar factura:', error);
      alert('Error al eliminar la factura');
    }
  };

  const handleEditarFactura = (factura: Factura) => {
    setFacturaEditando(factura);
    setVista('editar');
  };

  const handleNuevaFactura = () => {
    setFacturaEditando(undefined);
    setVista('nueva');
  };

  const handleCancelar = () => {
    setVista('lista');
    setFacturaEditando(undefined);
  };

  const handleCerrarSesion = async () => {
    try {
      await cerrarSesion();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      alert('Error al cerrar sesión');
    }
  };

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Mostrar login si no está autenticado
  if (!user) {
    return <Login onLoginSuccess={() => {}} />;
  }

  // Usuario restringido (valeria): solo ve Resumen con sus filtros
  if (isRestrictedUser(user.email)) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h1 className="text-base sm:text-xl font-bold text-gray-800">Resumen - Banco</h1>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-600">valeria</span>
                <button
                  onClick={handleCerrarSesion}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          {cargando ? (
            <div className="text-center py-12 text-gray-500">Cargando...</div>
          ) : (
            <ReportePendientesInstalacion facturas={facturas} />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h1 className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-gray-800 leading-tight">
              <span className="sm:hidden">Facturas - Banco</span>
              <span className="hidden sm:inline">Sistema de Control de Facturas - Banco</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 sm:border-l sm:pl-4">
              <nav className="flex gap-1.5 sm:gap-2">
                <button
                  onClick={() => setVista('lista')}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-sm font-medium ${
                    vista === 'lista'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Facturas
                </button>
                <button
                  onClick={() => {
                    setVista('reportes');
                    setSubVistaReportes('iva');
                    if (facturasModo !== 'completo') cargarFacturasCompleto();
                  }}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-sm font-medium ${
                    vista === 'reportes'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Reportes
                </button>
              </nav>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm text-gray-600 truncate max-w-[120px] sm:max-w-none" title={user.email ?? ''}>
                  {user.email}
                </span>
                <button
                  onClick={handleCerrarSesion}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm shrink-0"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {vista === 'lista' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Lista de Facturas</h2>
              <button
                onClick={handleNuevaFactura}
                className="px-4 py-2 sm:px-6 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium shrink-0"
              >
                + Nueva Factura
              </button>
            </div>

            {/* Filtros: período (default este mes) y cliente */}
            <div className="p-3 sm:p-4 bg-white rounded-lg shadow-md border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">Filtros</h3>
              <div className="flex flex-wrap items-end gap-3 sm:gap-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setListFiltroPeriodo('este_mes')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                      listFiltroPeriodo === 'este_mes'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Este mes
                  </button>
                  <button
                    type="button"
                    onClick={() => setListFiltroPeriodo('mes_anterior')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                      listFiltroPeriodo === 'mes_anterior'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Mes anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setListFiltroPeriodo('rango')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                      listFiltroPeriodo === 'rango'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Rango
                  </button>
                </div>
                {listFiltroPeriodo === 'rango' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-0.5">Desde</label>
                      <input
                        type="date"
                        value={listFechaInicio}
                        onChange={(e) => setListFechaInicio(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-0.5">Hasta</label>
                      <input
                        type="date"
                        value={listFechaFin}
                        onChange={(e) => setListFechaFin(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs text-gray-600 mb-0.5">Cliente</label>
                  <input
                    type="text"
                    value={listFiltroCliente}
                    onChange={(e) => setListFiltroCliente(e.target.value)}
                    placeholder="Buscar por nombre"
                    className="border border-gray-300 rounded px-2 py-1.5 text-sm w-40 sm:w-48"
                  />
                </div>
              </div>
              <p className="mt-2 text-gray-500 text-xs">
                Mostrando {facturasParaLista.length} factura(s)
              </p>
            </div>

            {cargando ? (
              <div className="text-center py-12 text-gray-500 text-sm">Cargando...</div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 overflow-hidden">
                <ListaFacturas
                  facturas={facturasParaLista}
                  onEditar={handleEditarFactura}
                  onEliminar={handleEliminarFactura}
                />
              </div>
            )}
          </div>
        )}

        {vista === 'nueva' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <FormFactura
              onSubmit={handleCrearFactura}
              onCancel={handleCancelar}
            />
          </div>
        )}

        {vista === 'editar' && facturaEditando && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <FormFactura
              factura={facturaEditando}
              onSubmit={handleActualizarFactura}
              onCancel={handleCancelar}
            />
          </div>
        )}

        {vista === 'reportes' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSubVistaReportes('iva')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-sm font-medium ${
                  subVistaReportes === 'iva'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Reportes IVA
              </button>
              <button
                onClick={() => setSubVistaReportes('pendientes')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-sm font-medium ${
                  subVistaReportes === 'pendientes'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Resumen
              </button>
              <button
                onClick={() => setSubVistaReportes('renovaciones')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-sm font-medium ${
                  subVistaReportes === 'renovaciones'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Renovaciones
              </button>
              <button
                onClick={() => setSubVistaReportes('ganancia')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-sm font-medium ${
                  subVistaReportes === 'ganancia'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Ganancia
              </button>
            </div>
            {subVistaReportes === 'iva' && <ReporteIva facturas={facturas} />}
            {subVistaReportes === 'pendientes' && (
              <ReportePendientesInstalacion facturas={facturas} />
            )}
            {subVistaReportes === 'renovaciones' && (
              <ReporteRenovaciones facturas={facturas} />
            )}
            {subVistaReportes === 'ganancia' && (
              <ReporteGanancia facturas={facturas} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
