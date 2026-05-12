import { useState } from 'react';
import SelectorProceso from './SelectorProceso';
import ControlesSimulacion from './ControlesSimulacion';
import ResultadosSimulacion from './ResultadosSimulacion';

export default function SimuladorUI() {
  const [procesoSeleccionado, setProcesoSeleccionado] = useState(null);
  const [resultados, setResultados] = useState(null);
  const [simulando, setSimulando] = useState(false);
  const [progreso, setProgreso] = useState(0);

  const manejarCambioProc = (id) => {
    setProcesoSeleccionado(id);
    setResultados(null);
    setProgreso(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <span>⚙️</span> Simulador de Procesos
          </h1>
          <p className="text-blue-200">
            Simula y analiza diferentes tipos de procesos - Colas, Manufactura, Servicios
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Panel izquierdo - Selector y controles */}
          <div className="lg:col-span-1 space-y-4">
            <SelectorProceso 
              procesoSeleccionado={procesoSeleccionado}
              onSeleccionar={manejarCambioProc}
            />
          </div>

          {/* Panel derecho - Simulación y resultados */}
          <div className="lg:col-span-3">
            {procesoSeleccionado ? (
              <>
                <ControlesSimulacion
                  procesoId={procesoSeleccionado}
                  simulando={simulando}
                  progreso={progreso}
                  onSimulando={setSimulando}
                  onProgreso={setProgreso}
                  onResultados={setResultados}
                />
                
                {resultados && (
                  <ResultadosSimulacion 
                    resultados={resultados}
                    procesoId={procesoSeleccionado}
                  />
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 text-lg">
                  Selecciona un proceso para comenzar
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}