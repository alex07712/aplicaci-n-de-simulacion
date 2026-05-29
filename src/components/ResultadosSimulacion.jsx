import { motion } from 'framer-motion';
import { AlertTriangle, Users, CheckCircle, Clock, Gauge, Hourglass, BarChart3, TrendingUp, RefreshCw, Factory, Hospital, Package } from 'lucide-react';

const colores = {
  mm1: { header: 'from-blue-50 to-indigo-50', icono: 'text-blue-600', bgAnalisis: 'bg-blue-50', borderAnalisis: 'border-blue-100', textoAnalisis: 'text-blue-800' },
  manufactura: { header: 'from-red-50 to-rose-50', icono: 'text-red-600', bgAnalisis: 'bg-red-50', borderAnalisis: 'border-red-100', textoAnalisis: 'text-red-800' },
  urgencias: { header: 'from-green-50 to-emerald-50', icono: 'text-green-600', bgAnalisis: 'bg-green-50', borderAnalisis: 'border-green-100', textoAnalisis: 'text-green-800' }
};

const MetricaIcon = ({ icono, titulo, valor, unidad, color }) => (
  <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 flex items-center justify-between border border-gray-100">
    <div><p className="text-sm text-gray-500">{titulo}</p><p className="text-2xl font-bold text-gray-800">{valor}<span className="text-sm font-normal text-gray-400 ml-1">{unidad}</span></p></div>
    <div className={`p-2 ${color.bg} rounded-full`}>{icono}</div>
  </div>
);

export default function ResultadosSimulacion({ resultados, procesoId }) {
  const { estadisticas } = resultados;
  const estilo = colores[procesoId] || colores.mm1;

  if (procesoId === 'mm1') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className={`bg-gradient-to-r ${estilo.header} border-b px-6 py-4`}>
            <h3 className="flex items-center gap-2 text-gray-800 font-semibold text-lg">
              <BarChart3 className={`w-5 h-5 ${estilo.icono}`} /> Resultados - Cola Simple
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricaIcon icono={<Users className={`w-5 h-5 ${estilo.icono}`} />} titulo="Llegaron" valor={estadisticas.clientesLlegados} unidad="" color={estilo} />
              <MetricaIcon icono={<CheckCircle className="w-5 h-5 text-green-600" />} titulo="Atendidos" valor={estadisticas.clientesAtendidos} unidad="" color={{ bg: 'bg-green-50' }} />
              <MetricaIcon icono={<Clock className="w-5 h-5 text-amber-600" />} titulo="Espera promedio" valor={estadisticas.tiempoPromedioEspera} unidad="min" color={{ bg: 'bg-amber-50' }} />
              <MetricaIcon icono={<Gauge className={`w-5 h-5 ${estilo.icono}`} />} titulo="Utilización" valor={estadisticas.utilizacion} unidad="%" color={estilo} />
              <MetricaIcon icono={<Hourglass className="w-5 h-5 text-red-600" />} titulo="En cola" valor={estadisticas.personasEnEspera} unidad="" color={{ bg: 'bg-red-50' }} />
              <MetricaIcon icono={<Users className="w-5 h-5 text-red-600" />} titulo="Perdidos" valor={estadisticas.clientesPerdidos || 0} unidad="" color={{ bg: 'bg-red-50' }} />
              <MetricaIcon icono={<RefreshCw className="w-5 h-5 text-purple-600" />} titulo="Reingresos" valor={estadisticas.clientesReingresados || 0} unidad="" color={{ bg: 'bg-purple-50' }} />
              <MetricaIcon icono={<Users className="w-5 h-5 text-gray-600" />} titulo="Capacidad máx." valor={estadisticas.capacidadMaxima || '∞'} unidad="" color={{ bg: 'bg-gray-50' }} />
            </div>
            {/* Sección de análisis eliminada por solicitud del usuario */}
          </div>
        </div>
      </motion.div>
    );
  }

  if (procesoId === 'manufactura') {
    const estaciones = estadisticas.estaciones || [];
    return (
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className={`bg-gradient-to-r ${estilo.header} border-b px-6 py-4`}>
            <h3 className="flex items-center gap-2 text-gray-800 font-semibold text-lg">
              <BarChart3 className={`w-5 h-5 ${estilo.icono}`} /> Resultados - Línea de Producción
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricaIcon icono={<Factory className={`w-5 h-5 ${estilo.icono}`} />} titulo="Unidades producidas" valor={estadisticas.totalUnidadesProducidas || 0} unidad="" color={estilo} />
              <MetricaIcon icono={<TrendingUp className="w-5 h-5 text-red-500" />} titulo="Defectuosas" valor={estadisticas.totalUnidadesDefectuosas || 0} unidad="" color={{ bg: 'bg-red-50' }} />
              <MetricaIcon icono={<RefreshCw className="w-5 h-5 text-purple-600" />} titulo="Reprocesadas" valor={estadisticas.totalUnidadesReprocesadas || 0} unidad="" color={{ bg: 'bg-purple-50' }} />
              <MetricaIcon icono={<Package className="w-5 h-5 text-orange-600" />} titulo="Perdidas por almacén" valor={estadisticas.unidadesPerdidasPorAlmacen || 0} unidad="" color={{ bg: 'bg-orange-50' }} />
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Detalle por estación</h4>
              {estaciones.map((est, idx) => (
                <div key={idx} className="border rounded-xl p-4">
                  <h5 className="font-bold">{est.nombre} (trabajadores: {est.trabajadores})</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mt-2">
                    <div><span className="text-gray-600">Procesadas:</span> {est.clientesAtendidos}</div>
                    <div><span className="text-gray-600">Tiempo servicio:</span> {est.tiempoPromedioServicio} min</div>
                    <div><span className="text-gray-600">Espera promedio:</span> {est.tiempoPromedioEspera} min</div>
                    <div><span className="text-gray-600">Utilización:</span> {est.utilizacion}%</div>
                    {est.fallas !== undefined && (
                      <>
                        <div><span className="text-gray-600">Fallas:</span> {est.fallas}</div>
                        <div><span className="text-gray-600">Tiempo muerto:</span> {est.tiempoMuerto} min</div>
                      </>
                    )}
                  </div>
                  <div className="mt-2 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-full ${parseFloat(est.utilizacion) > 80 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${est.utilizacion}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className={`${estilo.bgAnalisis} rounded-xl p-4 border ${estilo.borderAnalisis}`}>
              <h4 className={`font-semibold ${estilo.textoAnalisis}`}>Resumen de producción</h4>
              <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                <div>Tamaño de lote: {estadisticas.tamanioLote}</div>
                <div>Capacidad máxima: {estadisticas.capacidadProduccionMaxima}</div>
                <div>Capacidad almacén: {estadisticas.capacidadAlmacen}</div>
                <div>Eficiencia global: {((estadisticas.totalUnidadesProducidas - estadisticas.totalUnidadesDefectuosas) / (estadisticas.totalUnidadesProducidas || 1) * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (procesoId === 'urgencias') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className={`bg-gradient-to-r ${estilo.header} border-b px-6 py-4`}>
            <h3 className="flex items-center gap-2 text-gray-800 font-semibold text-lg">
              <BarChart3 className={`w-5 h-5 ${estilo.icono}`} /> Resultados Urgencias
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricaIcon icono={<Hospital className={`w-5 h-5 ${estilo.icono}`} />} titulo="Pacientes atendidos" valor={estadisticas.pacientesAtendidos} unidad="" color={estilo} />
              <MetricaIcon icono={<Clock className="w-5 h-5 text-amber-600" />} titulo="Tiempo promedio total" valor={estadisticas.tiempoPromedioTotal} unidad="min" color={{ bg: 'bg-amber-50' }} />
              <MetricaIcon icono={<Gauge className={`w-5 h-5 ${estilo.icono}`} />} titulo="Utilización médicos" valor={estadisticas.utilizacionConsultorios} unidad="%" color={estilo} />
              <MetricaIcon icono={<Gauge className={`w-5 h-5 ${estilo.icono}`} />} titulo="Utilización enfermeras" valor={estadisticas.utilizacionEnfermeras} unidad="%" color={estilo} />
              <MetricaIcon icono={<Users className="w-5 h-5 text-red-600" />} titulo="Perdidos" valor={estadisticas.pacientesPerdidos || 0} unidad="" color={{ bg: 'bg-red-50' }} />
              <MetricaIcon icono={<TrendingUp className="w-5 h-5 text-orange-500" />} titulo="Empeorados" valor={estadisticas.pacientesEmpeorados || 0} unidad="" color={{ bg: 'bg-orange-50' }} />
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600">
                Críticos: <span className="font-semibold">{estadisticas.criticos}</span> | Urgentes: <span className="font-semibold">{estadisticas.urgentes}</span> | Moderados: <span className="font-semibold">{estadisticas.moderados}</span> | Leves: <span className="font-semibold">{estadisticas.leves}</span>
              </p>
            </div>
            {(estadisticas.accidentesOcurridos > 0 || estadisticas.diasConEscasez > 0) && (
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
                <p className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Accidentes masivos: {estadisticas.accidentesOcurridos}
                </p>
                <p className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-orange-600" />
                  Días con escasez: {estadisticas.diasConEscasez}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
  return null;
}
