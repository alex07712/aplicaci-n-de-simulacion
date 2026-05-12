import { calcularEstadisticas } from '../utils/estadisticas.js';

export default function ResultadosSimulacion({ resultados, procesoId }) {
  const { estadisticas } = resultados;

  // Componente para tarjeta de métrica
  const MetricaCard = ({ titulo, valor, unidad, icono }) => (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{titulo}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            {valor}
            <span className="text-lg text-gray-500 ml-2">{unidad}</span>
          </p>
        </div>
        <span className="text-4xl">{icono}</span>
      </div>
    </div>
  );

  // Renderizar según tipo de proceso
  if (procesoId === 'mm1') {
    return (
      <div className="mt-6 space-y-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">📊 Resultados de Simulación</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <MetricaCard
              titulo="Clientes que llegaron"
              valor={estadisticas.clientesLlegados}
              unidad=""
              icono="👥"
            />
            <MetricaCard
              titulo="Clientes atendidos"
              valor={estadisticas.clientesAtendidos}
              unidad=""
              icono="✅"
            />
            <MetricaCard
              titulo="Tiempo promedio de espera"
              valor={estadisticas.tiempoPromedioEspera}
              unidad="min"
              icono="⏱️"
            />
            <MetricaCard
              titulo="Tiempo promedio de servicio"
              valor={estadisticas.tiempoPromedioServicio}
              unidad="min"
              icono="🛠️"
            />
            <MetricaCard
              titulo="Utilización del servidor"
              valor={estadisticas.utilizacion}
              unidad="%"
              icono="⚡"
            />
            <MetricaCard
              titulo="En espera"
              valor={estadisticas.personasEnEspera}
              unidad=""
              icono="⏸️"
            />
          </div>

          {/* Análisis */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-bold text-blue-900 mb-2">💡 Análisis</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Rho (ρ):</strong> {(parseFloat(estadisticas.utilizacion) / 100).toFixed(3)} - {parseFloat(estadisticas.utilizacion) > 80 ? 'Sistema sobrecargado' : 'Sistema equilibrado'}</li>
              <li>• <strong>Tasa de servicio:</strong> {estadisticas.clientesAtendidos / (resultados.tiempoSimulacion / 60)} clientes/hora</li>
              <li>• <strong>Eficiencia:</strong> {((estadisticas.clientesAtendidos / estadisticas.clientesLlegados) * 100).toFixed(1)}% de aceptación</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (procesoId === 'manufactura') {
    return (
      <div className="mt-6 space-y-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">📊 Resultados por Estación</h3>
          
          <div className="space-y-4">
            {estadisticas.map((estacion, idx) => (
              <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition">
                <h4 className="font-bold text-lg text-gray-800 mb-3">{estacion.nombre}</h4>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Unidades procesadas</p>
                    <p className="font-semibold text-lg text-blue-600">{estacion.clientesAtendidos}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Tiempo promedio</p>
                    <p className="font-semibold text-lg text-blue-600">{estacion.tiempoPromedioServicio} min</p>
                  </div>
                  <div>
                    <p className="text-gray-600">En cola</p>
                    <p className="font-semibold text-lg text-blue-600">{estacion.personasEnEspera}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Utilización</p>
                    <p className="font-semibold text-lg text-blue-600">{estacion.utilizacion}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Espera promedio</p>
                    <p className="font-semibold text-lg text-blue-600">{estacion.tiempoPromedioEspera} min</p>
                  </div>
                </div>

                {/* Barra de utilización */}
                <div className="mt-3 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      parseFloat(estacion.utilizacion) > 80 ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${estacion.utilizacion}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 mt-6">
            <h4 className="font-bold text-yellow-900 mb-2">⚠️ Recomendaciones</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              {estadisticas.filter(e => parseFloat(e.utilizacion) > 80).length > 0 && (
                <li>• Estaciones con alta utilización necesitan optimización o recursos adicionales</li>
              )}
              <li>• Revisar tiempos de espera en estaciones con cuellos de botella</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (procesoId === 'urgencias') {
    return (
      <div className="mt-6 space-y-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">🏥 Resultados Urgencias</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <MetricaCard
              titulo="Pacientes atendidos"
              valor={estadisticas.pacientesAtendidos}
              unidad=""
              icono="👨‍⚕️"
            />
            <MetricaCard
              titulo="Tiempo promedio total"
              valor={estadisticas.tiempoPromedioTotal}
              unidad="min"
              icono="⏱️"
            />
            <MetricaCard
              titulo="Utilización médicos"
              valor={estadisticas.utilizacionMedicos}
              unidad="%"
              icono="👨‍⚕️"
            />
            <MetricaCard
              titulo="Utilización enfermeras"
              valor={estadisticas.utilizacionEnfermeras}
              unidad="%"
              icono="👩‍⚕️"
            />
            <div className="bg-red-50 rounded-lg shadow p-6 border-l-4 border-red-600">
              <p className="text-gray-600 text-sm font-medium">Pacientes críticos atendidos</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {estadisticas.pacientesCriticos}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg shadow p-6 border-l-4 border-orange-600">
              <p className="text-gray-600 text-sm font-medium">Pacientes urgentes atendidos</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {estadisticas.pacientesUrgentes}
              </p>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h4 className="font-bold text-green-900 mb-2">✅ Métricas de Desempeño</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• <strong>Capacidad:</strong> Se atendieron {estadisticas.pacientesAtendidos} pacientes en {(resultados.tiempoSimulacion / 60).toFixed(1)} horas</li>
              <li>• <strong>Eficiencia:</strong> Tiempo promedio de {estadisticas.tiempoPromedioTotal} minutos por paciente</li>
              <li>• <strong>Recursos:</strong> Médicos y enfermeras al {Math.max(parseFloat(estadisticas.utilizacionMedicos), parseFloat(estadisticas.utilizacionEnfermeras))}% de uso</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return null;
}