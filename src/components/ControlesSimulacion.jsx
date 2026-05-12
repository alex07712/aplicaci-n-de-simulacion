import { useState } from 'react';
import { obtenerConfiguracionProceso, instanciarProceso } from '../simulations/procesos/index.js';

export default function ControlesSimulacion({ 
  procesoId, 
  simulando, 
  progreso,
  onSimulando, 
  onProgreso, 
  onResultados 
}) {
  const config = obtenerConfiguracionProceso(procesoId);
  const [tiempoSimulacion, setTiempoSimulacion] = useState(480); // 8 horas en minutos
  const [parametros, setParametros] = useState(() => {
    const inicial = {};
    config.parametros.forEach(p => {
      inicial[p.id] = p.default;
    });
    return inicial;
  });

  const manejarCambioParametro = (id, valor) => {
    setParametros(prev => ({
      ...prev,
      [id]: valor
    }));
  };

  const ejecutarSimulacion = async () => {
    onSimulando(true);
    onProgreso(0);

    try {
      const simulacion = instanciarProceso(procesoId, parametros);
      
      // Suscribirse a eventos de progreso
      simulacion.subscribe((evento) => {
        if (evento.tipo === 'evento') {
          onProgreso(evento.progreso);
        }
      });

      // Ejecutar simulación
      await simulacion.ejecutar(tiempoSimulacion);

      // Procesar resultados
      onResultados({
        tiempoSimulacion,
        simulacion,
        estadisticas: simulacion.estadisticas,
        parametros
      });
    } catch (error) {
      console.error('Error en simulación:', error);
      alert('Error durante la simulación: ' + error.message);
    } finally {
      onSimulando(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tarjeta de parámetros */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">⚙️ Parámetros</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          {config.parametros.map(param => (
            <div key={param.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {param.nombre}
                {param.unidad && <span className="text-gray-500 ml-1">({param.unidad})</span>}
              </label>
              
              {param.tipo === 'number' ? (
                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={parametros[param.id]}
                  onChange={(e) => manejarCambioParametro(param.id, parseFloat(e.target.value))}
                  className="w-full"
                />
              ) : param.tipo === 'select' ? (
                <select
                  value={parametros[param.id]}
                  onChange={(e) => manejarCambioParametro(param.id, parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {param.opciones.map(opt => (
                    <option key={opt.valor} value={opt.valor}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : null}
              
              <p className="text-sm text-gray-600 mt-1">
                Valor: <span className="font-semibold">{parametros[param.id]}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tiempo de simulación
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="60"
              max="1440"
              step="60"
              value={tiempoSimulacion}
              onChange={(e) => setTiempoSimulacion(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="font-semibold text-blue-600 w-20 text-right">
              {(tiempoSimulacion / 60).toFixed(1)} horas
            </span>
          </div>
        </div>
      </div>

      {/* Tarjeta de ejecución */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow p-6 text-white">
        <button
          onClick={ejecutarSimulacion}
          disabled={simulando}
          className={`w-full py-3 px-6 font-bold rounded-lg transition-all ${
            simulando
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-white text-blue-600 hover:bg-gray-100 hover:shadow-lg'
          }`}
        >
          {simulando ? '⏳ Simulando...' : '▶️ Ejecutar Simulación'}
        </button>

        {simulando && (
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm">Progreso</span>
              <span className="text-sm font-semibold">{Math.round(progreso)}%</span>
            </div>
            <div className="w-full bg-blue-300 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}