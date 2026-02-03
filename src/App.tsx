import { useState, useEffect } from 'react';
import { Factura } from './types';
import { crearFactura, actualizarFactura, eliminarFactura, obtenerFacturas } from './services/facturasService';
import FormFactura from './components/FormFactura';
import ListaFacturas from './components/ListaFacturas';
import ReporteIva from './components/ReporteIva';
import ReportePendientesInstalacion from './components/ReportePendientesInstalacion';
import Login from './components/Login';
import { calcularValoresFactura } from './utils/calculos';
import { useAuth } from './contexts/AuthContext';
import { cerrarSesion } from './services/authService';
import { isRestrictedUser } from './config/auth';

type Vista = 'lista' | 'nueva' | 'editar' | 'reportes';

type SubVistaReportes = 'iva' | 'pendientes';

function App() {
  const { user, loading } = useAuth();
  const [vista, setVista] = useState<Vista>('lista');
  const [subVistaReportes, setSubVistaReportes] = useState<SubVistaReportes>('iva');
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [facturaEditando, setFacturaEditando] = useState<Factura | undefined>();
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    // Solo cargar facturas si el usuario está autenticado
    if (user) {
      cargarFacturas();
    }
  }, [user]);

  const cargarFacturas = async () => {
    try {
      setCargando(true);
      const data = await obtenerFacturas();
      setFacturas(data);
    } catch (error) {
      console.error('Error al cargar facturas:', error);
      alert('Error al cargar las facturas');
    } finally {
      setCargando(false);
    }
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
      await cargarFacturas();
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
      await cargarFacturas();
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
      await cargarFacturas();
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">Resumen - Banco</h1>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">valeria</span>
                <button
                  onClick={handleCerrarSesion}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Sistema de Control de Facturas - Banco
            </h1>
            <div className="flex items-center gap-4">
              <nav className="flex gap-2">
                <button
                  onClick={() => setVista('lista')}
                  className={`px-4 py-2 rounded-md ${
                    vista === 'lista'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Facturas
                </button>
                <button
                  onClick={() => { setVista('reportes'); setSubVistaReportes('iva'); }}
                  className={`px-4 py-2 rounded-md ${
                    vista === 'reportes'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Reportes
                </button>
              </nav>
              <div className="flex items-center gap-3 border-l pl-4">
                <span className="text-sm text-gray-600">{user.email}</span>
                <button
                  onClick={handleCerrarSesion}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {vista === 'lista' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Lista de Facturas</h2>
              <button
                onClick={handleNuevaFactura}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                + Nueva Factura
              </button>
            </div>

            {cargando ? (
              <div className="text-center py-12 text-gray-500">Cargando...</div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <ListaFacturas
                  facturas={facturas}
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
            <div className="flex gap-2">
              <button
                onClick={() => setSubVistaReportes('iva')}
                className={`px-4 py-2 rounded-md ${
                  subVistaReportes === 'iva'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Reportes IVA
              </button>
              <button
                onClick={() => setSubVistaReportes('pendientes')}
                className={`px-4 py-2 rounded-md ${
                  subVistaReportes === 'pendientes'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Resumen
              </button>
            </div>
            {subVistaReportes === 'iva' && <ReporteIva facturas={facturas} />}
            {subVistaReportes === 'pendientes' && (
              <ReportePendientesInstalacion facturas={facturas} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
