import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Loader2, Play, Settings2, XCircle, Plus, Trash2, Info } from 'lucide-react';
import { instanciarProceso } from '../simulations/procesos/index.js';
import useSimulacionStore from '../store/simulacionStore.js';

const colores = {
  mm1: { primario: 'from-blue-600 to-blue-700', secundario: 'bg-blue-50', texto: 'text-blue-600', borde: 'border-blue-200', hover: 'hover:from-blue-700 hover:to-blue-800', barra: 'from-blue-500 to-blue-600', cancelar: 'bg-red-500 hover:bg-red-600' },
  manufactura: { primario: 'from-red-500 to-red-600', secundario: 'bg-red-50', texto: 'text-red-600', borde: 'border-red-200', hover: 'hover:from-red-600 hover:to-red-700', barra: 'from-red-500 to-red-600', cancelar: 'bg-red-500 hover:bg-red-600' },
  urgencias: { primario: 'from-green-600 to-green-700', secundario: 'bg-green-50', texto: 'text-green-600', borde: 'border-green-200', hover: 'hover:from-green-700 hover:to-green-800', barra: 'from-green-500 to-green-600', cancelar: 'bg-red-500 hover:bg-red-600' }
};

const UNIDADES_TIEMPO = [
  { id: 'segundos', nombre: 'segundos', abbr: 's', aMinutos: 1/60 },
  { id: 'minutos',  nombre: 'minutos',  abbr: 'min', aMinutos: 1 },
  { id: 'horas',    nombre: 'horas',    abbr: 'h', aMinutos: 60 },
  { id: 'dias',     nombre: 'días',     abbr: 'd', aMinutos: 1440 }
];

const convertirTasaAMinutos = (valor, unidadId) => {
  const u = UNIDADES_TIEMPO.find(u => u.id === unidadId);
  return u ? valor / u.aMinutos : valor;
};
const convertirTiempoAMinutos = (valor, unidadId) => {
  const u = UNIDADES_TIEMPO.find(u => u.id === unidadId);
  return u ? valor * u.aMinutos : valor;
};

export default function ControlesSimulacion({ procesoId, simulando, progreso, onSimulando, onProgreso, onResultados }) {
  const { setAbortController: setGlobalAbortController } = useSimulacionStore();
  const estilo = colores[procesoId] || colores.mm1;

  // --------------------------------------------------------------
  // VALORES POR DEFECTO SEGÚN PROCESO
  // --------------------------------------------------------------
  const getDefaultTiempoValor = () => {
    if (procesoId === 'mm1') return 8;              // 8 horas
    if (procesoId === 'manufactura') return 480;    // 480 minutos = 8 horas
    return 8;                                       // urgencias: 8 horas
  };
  const getDefaultTiempoUnidad = () => procesoId === 'manufactura' ? 'minutos' : 'horas';

  const getDefaultLlegadaValor = () => {
    if (procesoId === 'mm1') return 30;          // 30 clientes/hora
    if (procesoId === 'manufactura') return 5;   // 5 minutos entre llegadas
    return 10;                                   // urgencias: 10 pacientes/hora
  };
  const getDefaultLlegadaUnidad = () => procesoId === 'manufactura' ? 'minutos' : 'horas';

  const getDefaultServicioValor = () => {
    if (procesoId === 'mm1') return 40;           // 40 clientes/hora
    if (procesoId === 'manufactura') return 4;    // 4 minutos por estación
    return 0;                                     // urgencias no usa este campo
  };
  const getDefaultServicioUnidad = () => procesoId === 'manufactura' ? 'minutos' : 'horas';

  // --------------------------------------------------------------
  // ESTADOS COMUNES
  // --------------------------------------------------------------
  const [tiempoValor, setTiempoValor] = useState(getDefaultTiempoValor());
  const [tiempoUnidad, setTiempoUnidad] = useState(getDefaultTiempoUnidad());
  const [llegadaValor, setLlegadaValor] = useState(getDefaultLlegadaValor());
  const [llegadaUnidad, setLlegadaUnidad] = useState(getDefaultLlegadaUnidad());
  const [servicioValor, setServicioValor] = useState(getDefaultServicioValor());
  const [servicioUnidad, setServicioUnidad] = useState(getDefaultServicioUnidad());

  // Estados avanzados comunes (solo mm1)
  const [capacidadActiva, setCapacidadActiva] = useState(false);
  const [capacidadMaxima, setCapacidadMaxima] = useState(10);
  const [reintentosColaLlenaActivo, setReintentosColaLlenaActivo] = useState(false);
  const [probReintentoColaLlena, setProbReintentoColaLlena] = useState(0.5);
  const [tiempoReintentoColaLlenaValor, setTiempoReintentoColaLlenaValor] = useState(5);
  const [tiempoReintentoColaLlenaUnidad, setTiempoReintentoColaLlenaUnidad] = useState('minutos');
  const [reintentosActivo, setReintentosActivo] = useState(false);
  const [probReintento, setProbReintento] = useState(0.3);
  const [tiempoReintentoValor, setTiempoReintentoValor] = useState(10);
  const [tiempoReintentoUnidad, setTiempoReintentoUnidad] = useState('minutos');
  const [horasPico, setHorasPico] = useState([]);
  const [abortController, setAbortController] = useState(null);

  // Estados de MANUFACTURA
  const [numEstaciones, setNumEstaciones] = useState(3);
  const [capacidadMaxActivo, setCapacidadMaxActivo] = useState(false);
  const [capacidadMaximaProduccion, setCapacidadMaximaProduccion] = useState(1000);
  const [almacenActivo, setAlmacenActivo] = useState(false);
  const [capacidadAlmacen, setCapacidadAlmacen] = useState(20);
  const [fallasActivo, setFallasActivo] = useState(false);
  const [probFalla, setProbFalla] = useState([0.1, 0.1, 0.1]);
  const [tiempoReparacion, setTiempoReparacion] = useState([10, 10, 10]);
  const [defectosActivo, setDefectosActivo] = useState(false);
  const [probDefecto, setProbDefecto] = useState([0.05, 0.05, 0.05]);
  const [reprocesarDefectos, setReprocesarDefectos] = useState(false);
  const [numTrabajadores, setNumTrabajadores] = useState([1, 1, 1]);

  // Estados de URGENCIAS
  const [numConsultorios, setNumConsultorios] = useState(3);
  const [numEnfermeras, setNumEnfermeras] = useState(4);   // ahora input numérico
  const [capacidadSalaEspera, setCapacidadSalaEspera] = useState(20);
  // Se ELIMINAN todos los tiempos de atención y desviaciones
  const [porcCritico, setPorcCritico] = useState(10);
  const [porcUrgente, setPorcUrgente] = useState(20);
  const [porcModerado, setPorcModerado] = useState(35);
  const [porcLeve, setPorcLeve] = useState(35);
  const [empeoramientoActivo, setEmpeoramientoActivo] = useState(false);
  const [tiempoEmpeoramiento, setTiempoEmpeoramiento] = useState(30);
  const [probEmpeoramiento, setProbEmpeoramiento] = useState(0.5);
  const [escasezActivo, setEscasezActivo] = useState(false);
  const [escasezProbabilidad, setEscasezProbabilidad] = useState(0.3);
  const [escasezMultiplicador, setEscasezMultiplicador] = useState(1.5);
  const [accidentesActivo, setAccidentesActivo] = useState(false);
  const [intervaloAccidentesHoras, setIntervaloAccidentesHoras] = useState(12);
  const [duracionAccidenteHoras, setDuracionAccidenteHoras] = useState(2);
  const [factorAccidente, setFactorAccidente] = useState(3.0);

  const totalProbabilidadesUrgencias = porcCritico + porcUrgente + porcModerado + porcLeve;

  useEffect(() => {
    if (procesoId === 'manufactura') {
      const newLen = Math.max(1, numEstaciones);
      setProbFalla(prev => { let a = [...prev]; while(a.length<newLen) a.push(0.1); while(a.length>newLen) a.pop(); return a; });
      setTiempoReparacion(prev => { let a = [...prev]; while(a.length<newLen) a.push(10); while(a.length>newLen) a.pop(); return a; });
      setProbDefecto(prev => { let a = [...prev]; while(a.length<newLen) a.push(0.05); while(a.length>newLen) a.pop(); return a; });
      setNumTrabajadores(prev => { let a = [...prev]; while(a.length<newLen) a.push(1); while(a.length>newLen) a.pop(); return a; });
    }
  }, [numEstaciones, procesoId]);

  useEffect(() => {
    if (abortController) { abortController.abort(); onSimulando(false); onProgreso(0); setAbortController(null); setGlobalAbortController(null); }
  }, [procesoId]);

  const agregarHoraPico = () => setHorasPico([...horasPico, { id: Date.now(), inicio: 8, fin: 12, factor: 1.5 }]);
  const eliminarHoraPico = (id) => setHorasPico(horasPico.filter(h => h.id !== id));
  const actualizarHoraPico = (id, campo, valor) => setHorasPico(horasPico.map(h => h.id === id ? { ...h, [campo]: parseFloat(valor) } : h));

  const actualizarTrabajadores = (idx, val) => { const nuevos = [...numTrabajadores]; nuevos[idx] = val; setNumTrabajadores(nuevos); };
  const actualizarProbFalla = (idx, val) => { const nuevos = [...probFalla]; nuevos[idx] = val; setProbFalla(nuevos); };
  const actualizarTiempoReparacion = (idx, val) => { const nuevos = [...tiempoReparacion]; nuevos[idx] = val; setTiempoReparacion(nuevos); };
  const actualizarProbDefecto = (idx, val) => { const nuevos = [...probDefecto]; nuevos[idx] = val; setProbDefecto(nuevos); };

  const ejecutarSimulacion = async () => {
    if (abortController) abortController.abort();
    const controller = new AbortController();
    setAbortController(controller);
    setGlobalAbortController(controller);
    onSimulando(true);
    onProgreso(0);
    try {
      const tiempoSimulacionMin = convertirTiempoAMinutos(tiempoValor, tiempoUnidad);
      let parametros = {};
      // --------------------------------------------------------------
      // PROCESO M/M/1
      // --------------------------------------------------------------
      if (procesoId === 'mm1') {
        parametros = {
          tasaLlegada: convertirTasaAMinutos(llegadaValor, llegadaUnidad),
          tasaServicio: convertirTasaAMinutos(servicioValor, servicioUnidad),
          capacidadMaxima: capacidadActiva ? capacidadMaxima : null,
          reintentosColaLlenaActivo: capacidadActiva ? reintentosColaLlenaActivo : false,
          probReintentoColaLlena: (capacidadActiva && reintentosColaLlenaActivo) ? probReintentoColaLlena : 0,
          tiempoReintentoColaLlena: (capacidadActiva && reintentosColaLlenaActivo) ? convertirTiempoAMinutos(tiempoReintentoColaLlenaValor, tiempoReintentoColaLlenaUnidad) : 0,
          maxReintentosColaLlena: 3,
          probabilidadReintento: reintentosActivo ? probReintento : 0,
          tiempoReintento: reintentosActivo ? convertirTiempoAMinutos(tiempoReintentoValor, tiempoReintentoUnidad) : 0,
          maxReintentos: reintentosActivo ? 3 : 0,
          horasPico: horasPico.map(p => ({ inicio: p.inicio, fin: p.fin, factor: p.factor }))
        };
      }
      // --------------------------------------------------------------
      // PROCESO MANUFACTURA
      // --------------------------------------------------------------
      else if (procesoId === 'manufactura') {
        const tiempoLlegadaMin = convertirTiempoAMinutos(llegadaValor, llegadaUnidad);
        const tiempoServicioMin = convertirTiempoAMinutos(servicioValor, servicioUnidad);
        const tiemposEstacion = [];
        for (let i = 0; i < numEstaciones; i++) tiemposEstacion.push({ media: tiempoServicioMin, desviacion: tiempoServicioMin * 0.2 });
        parametros = {
          tiempoLlegada: tiempoLlegadaMin,
          numEstaciones,
          numTrabajadoresPorEstacion: numTrabajadores.slice(0, numEstaciones),
          tiemposEstacion,
          tamanioLote: 1,
          capacidadProduccionMaxima: capacidadMaxActivo ? capacidadMaximaProduccion : null,
          capacidadAlmacen: almacenActivo ? capacidadAlmacen : null,
          fallasActivo,
          probabilidadFalla: probFalla.slice(0, numEstaciones),
          tiempoReparacion: tiempoReparacion.slice(0, numEstaciones),
          defectosActivo,
          probabilidadDefecto: probDefecto.slice(0, numEstaciones),
          reprocesarDefectuosos: reprocesarDefectos
        };
      }
      // --------------------------------------------------------------
      // PROCESO URGENCIAS
      // --------------------------------------------------------------
      else if (procesoId === 'urgencias') {
        parametros = {
          tasaLlegada: convertirTasaAMinutos(llegadaValor, llegadaUnidad),
          numConsultorios,
          numEnfermeras,
          capacidadSalaEspera,
          // Se eliminan tiempos de atención: usaremos valores fijos dentro del modelo
          porcentajeCritico: porcCritico,
          porcentajeUrgente: porcUrgente,
          porcentajeModerado: porcModerado,
          porcentajeLeve: porcLeve,
          empeoramientoActivo,
          tiempoEmpeoramiento,
          probabilidadEmpeoramiento: probEmpeoramiento,
          escasezActivo,
          escasezProbabilidad,
          escasezMultiplicador,
          accidentesActivo,
          intervaloAccidentes: intervaloAccidentesHoras * 60,
          duracionAccidente: duracionAccidenteHoras * 60,
          factorAccidente,
          horasPico: horasPico.map(p => ({ inicio: p.inicio, fin: p.fin, factor: p.factor }))
        };
      }
      const simulacion = instanciarProceso(procesoId, parametros);
      let cancelled = false;
      simulacion.subscribe((evento) => {
        if (controller.signal.aborted) cancelled = true;
        if (evento.tipo === 'evento') onProgreso(evento.progreso);
      });
      await simulacion.ejecutar(tiempoSimulacionMin, controller.signal);
      if (!cancelled && !controller.signal.aborted) {
        onResultados({ tiempoSimulacion: tiempoSimulacionMin, simulacion, estadisticas: simulacion.estadisticas, parametros });
      }
    } catch (error) {
      if (error.name !== 'AbortError') console.error(error);
    } finally {
      if (!controller.signal.aborted) onSimulando(false);
      setAbortController(null);
      setGlobalAbortController(null);
    }
  };

  const cancelarSimulacion = () => {
    if (abortController) { abortController.abort(); onSimulando(false); onProgreso(0); setAbortController(null); setGlobalAbortController(null); }
  };

  const renderInputConUnidad = (valor, setValor, unidad, setUnidad, label, step = "any") => (
    <div className="space-y-2 border-b pb-3">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input type="number" value={isNaN(valor) ? 0 : valor} onChange={e => setValor(parseFloat(e.target.value) || 0)} className="w-32 px-3 py-2 border rounded-lg text-right" step={step} />
        <span className="text-xl font-bold text-gray-400">×</span>
        <select value={unidad} onChange={e => setUnidad(e.target.value)} className="px-3 py-2 border rounded-lg bg-white">
          {UNIDADES_TIEMPO.map(u => <option key={u.id} value={u.id}>{u.abbr}</option>)}
        </select>
      </div>
    </div>
  );
  const renderInputSinX = (valor, setValor, unidad, setUnidad, label, step = "any") => (
    <div className="space-y-2 border-b pb-3">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input type="number" value={isNaN(valor) ? 0 : valor} onChange={e => setValor(parseFloat(e.target.value) || 0)} className="w-32 px-3 py-2 border rounded-lg text-right" step={step} />
        <select value={unidad} onChange={e => setUnidad(e.target.value)} className="px-3 py-2 border rounded-lg bg-white">
          {UNIDADES_TIEMPO.map(u => <option key={u.id} value={u.id}>{u.abbr}</option>)}
        </select>
      </div>
    </div>
  );

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
      <div className={`bg-gradient-to-r ${estilo.secundario} border-b px-6 py-4`}>
        <h3 className="flex items-center gap-2 text-gray-800 font-semibold text-lg">
          <Settings2 className={`w-5 h-5 ${estilo.texto}`} />
          Configuración de simulación
        </h3>
      </div>
      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* ------------------------------------------------------ */}
        {/* M/M/1 */}
        {/* ------------------------------------------------------ */}
        {procesoId === 'mm1' && (
          <>
            {renderInputConUnidad(llegadaValor, setLlegadaValor, llegadaUnidad, setLlegadaUnidad, "Tasa de llegada (personas por unidad de tiempo)")}
            {renderInputConUnidad(servicioValor, setServicioValor, servicioUnidad, setServicioUnidad, "Tasa de servicio (personas atendidas por unidad de tiempo)")}
          </>
        )}
        {/* ------------------------------------------------------ */}
        {/* MANUFACTURA */}
        {/* ------------------------------------------------------ */}
        {procesoId === 'manufactura' && (
          <>
            {renderInputConUnidad(llegadaValor, setLlegadaValor, llegadaUnidad, setLlegadaUnidad, "Tiempo entre llegadas de materia prima")}
            <p className="text-xs text-gray-500 -mt-4 border-b pb-3">
              Significa que entra 1 unidad de materia prima cada vez que pasa este tiempo. Ejemplo: 5 min = llega 1 unidad cada 5 minutos, no 5 unidades por minuto.
            </p>
            {renderInputConUnidad(servicioValor, setServicioValor, servicioUnidad, setServicioUnidad, "Tiempo de procesamiento base por estación (media)")}
            <p className="text-xs text-gray-500 -mt-4 border-b pb-3">
              Significa que cada estación tarda en promedio este tiempo para procesar 1 unidad. Si agregas trabajadores, el tiempo efectivo baja.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Número de estaciones</label>
              <select value={numEstaciones} onChange={e => setNumEstaciones(parseInt(e.target.value))} className="w-full px-3 py-2 border rounded-lg bg-white">
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} estaciones</option>)}
              </select>
            </div>
            <div className="space-y-2 border-t pt-2">
              <label className="text-sm font-medium text-gray-700">Trabajadores por estación</label>
              <div className="flex flex-wrap gap-3">
                {Array(numEstaciones).fill().map((_, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="text-xs font-medium">E{i+1}:</span>
                    <input type="number" min="1" max="10" value={numTrabajadores[i] || 1} onChange={e => actualizarTrabajadores(i, parseInt(e.target.value) || 1)} className="w-16 px-2 py-1 border rounded text-sm" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400">Más trabajadores reducen el tiempo de procesamiento.</p>
            </div>
            <div className="space-y-2"><div className="flex items-center gap-2"><input type="checkbox" checked={capacidadMaxActivo} onChange={e => setCapacidadMaxActivo(e.target.checked)} /><label className="text-sm font-medium text-gray-700">Capacidad máxima de producción</label></div>{capacidadMaxActivo && (<div className="pl-6"><input type="number" min="1" value={capacidadMaximaProduccion} onChange={e => setCapacidadMaximaProduccion(parseInt(e.target.value) || 1)} className="w-24 px-2 py-1 border rounded" /><span className="text-xs text-gray-500 ml-2">unidades totales</span></div>)}</div>
            <div className="space-y-2"><div className="flex items-center gap-2"><input type="checkbox" checked={almacenActivo} onChange={e => setAlmacenActivo(e.target.checked)} /><label className="text-sm font-medium text-gray-700">Almacén intermedio (capacidad limitada)</label></div>{almacenActivo && (<div className="pl-6"><input type="number" min="1" value={capacidadAlmacen} onChange={e => setCapacidadAlmacen(parseInt(e.target.value) || 1)} className="w-24 px-2 py-1 border rounded" /><span className="text-xs text-gray-500 ml-2">unidades máximas en cola entre estaciones</span></div>)}</div>
            <div className="space-y-2"><div className="flex items-center gap-2"><input type="checkbox" checked={fallasActivo} onChange={e => setFallasActivo(e.target.checked)} /><label className="text-sm font-medium text-gray-700">Fallas por máquina</label></div>{fallasActivo && (<div className="pl-6 space-y-3"><div className="flex flex-wrap gap-4">{Array(numEstaciones).fill().map((_, i) => (<div key={i} className="border p-2 rounded text-sm w-40"><div className="font-semibold">Estación {i+1}</div><div className="flex flex-col gap-1 mt-1"><div className="flex justify-between"><label className="text-xs">Prob. falla:</label><input type="number" min="0" max="1" step="0.05" value={probFalla[i] || 0} onChange={e => actualizarProbFalla(i, parseFloat(e.target.value) || 0)} className="w-16 px-1 border rounded" /></div><div className="flex justify-between"><label className="text-xs">Tiempo reparación (min):</label><input type="number" min="0" value={tiempoReparacion[i] || 0} onChange={e => actualizarTiempoReparacion(i, parseFloat(e.target.value) || 0)} className="w-20 px-1 border rounded" /></div></div></div>))}</div></div>)}</div>
            <div className="space-y-2"><div className="flex items-center gap-2"><input type="checkbox" checked={defectosActivo} onChange={e => setDefectosActivo(e.target.checked)} /><label className="text-sm font-medium text-gray-700">Productos defectuosos</label></div>{defectosActivo && (<div className="pl-6 space-y-3"><div className="flex flex-wrap gap-4">{Array(numEstaciones).fill().map((_, i) => (<div key={i} className="border p-2 rounded text-sm w-40"><div className="font-semibold">Estación {i+1}</div><div className="flex justify-between mt-1"><label className="text-xs">Prob. defecto:</label><input type="number" min="0" max="1" step="0.05" value={probDefecto[i] || 0} onChange={e => actualizarProbDefecto(i, parseFloat(e.target.value) || 0)} className="w-16 px-1 border rounded" /></div></div>))}</div><div className="flex items-center gap-2"><input type="checkbox" checked={reprocesarDefectos} onChange={e => setReprocesarDefectos(e.target.checked)} /><label className="text-xs">Reprocesar productos defectuosos</label></div></div>)}</div>
          </>
        )}
        {/* ------------------------------------------------------ */}
        {/* URGENCIAS */}
        {/* ------------------------------------------------------ */}
        {procesoId === 'urgencias' && (
          <>
            {renderInputConUnidad(llegadaValor, setLlegadaValor, llegadaUnidad, setLlegadaUnidad, "Tasa de llegada (pacientes por unidad de tiempo)")}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Número de consultorios (médicos)</label>
              <select value={numConsultorios} onChange={e => setNumConsultorios(parseInt(e.target.value))} className="w-full px-3 py-2 border rounded-lg bg-white">
                {[...Array(10)].map((_,i)=>i+1).map(n=><option key={n} value={n}>{n} consultorio(s)</option>)}
              </select>
              <p className="text-xs text-gray-400">Cada consultorio tiene 1 médico. Afecta la capacidad de atención simultánea.</p>
            </div>
            {/* Número de enfermeras como INPUT NUMÉRICO */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Número de enfermeras</label>
              <input type="number" min="1" max="20" value={numEnfermeras} onChange={e => setNumEnfermeras(parseInt(e.target.value) || 1)} className="w-32 px-3 py-2 border rounded-lg" />
              <p className="text-xs text-gray-400">Atienden a pacientes después del médico (excepto críticos).</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Capacidad de sala de espera</label>
              <input type="number" min="1" max="100" value={capacidadSalaEspera} onChange={e => setCapacidadSalaEspera(parseInt(e.target.value) || 20)} className="w-32 px-3 py-2 border rounded-lg" />
              <p className="text-xs text-gray-400">Máximo de pacientes que pueden esperar antes de triaje. Si se llena, los nuevos pacientes se pierden.</p>
            </div>
            {/* Distribución de gravedad (probabilidades) */}
            <div className="space-y-2 border-t pt-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <BarChart3 className={`w-4 h-4 ${estilo.texto}`} />
                Distribución de gravedad (probabilidades de llegada)
              </label>
              <div className="space-y-1">
                <div className="flex items-center gap-2"><span className="w-16 text-xs text-red-600">Crítico:</span><input type="number" min="0" max="100" value={porcCritico} onChange={e => setPorcCritico(parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded" /><span className="text-xs">%</span></div>
                <div className="flex items-center gap-2"><span className="w-16 text-xs text-orange-500">Urgente:</span><input type="number" min="0" max="100" value={porcUrgente} onChange={e => setPorcUrgente(parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded" /><span className="text-xs">%</span></div>
                <div className="flex items-center gap-2"><span className="w-16 text-xs text-yellow-500">Moderado:</span><input type="number" min="0" max="100" value={porcModerado} onChange={e => setPorcModerado(parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded" /><span className="text-xs">%</span></div>
                <div className="flex items-center gap-2"><span className="w-16 text-xs text-green-600">Leve:</span><input type="number" min="0" max="100" value={porcLeve} onChange={e => setPorcLeve(parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded" /><span className="text-xs">%</span></div>
              </div>
              <p className={`text-xs ${totalProbabilidadesUrgencias > 100 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>Total actual: {totalProbabilidadesUrgencias}%. No debe pasar de 100%.</p>
            </div>
            {/* Opciones avanzadas de urgencias: siempre visibles, separadas por líneas */}
            <div className="space-y-4 border-t pt-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2"><input type="checkbox" checked={empeoramientoActivo} onChange={e => setEmpeoramientoActivo(e.target.checked)} /><label className="text-sm font-medium">Empeoramiento de pacientes</label></div>
                {empeoramientoActivo && (
                  <div className="pl-6 flex flex-wrap gap-4">
                    <div><label className="text-xs">Tiempo de espera para empeorar (min):</label><input type="number" min="5" value={tiempoEmpeoramiento} onChange={e => setTiempoEmpeoramiento(parseInt(e.target.value))} className="w-24 ml-2 px-2 py-1 border rounded" /></div>
                    <div><label className="text-xs">Probabilidad de empeorar:</label><input type="number" min="0" max="1" step="0.05" value={probEmpeoramiento} onChange={e => setProbEmpeoramiento(parseFloat(e.target.value))} className="w-24 ml-2 px-2 py-1 border rounded" /></div>
                  </div>
                )}
              </div>
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center gap-2"><input type="checkbox" checked={escasezActivo} onChange={e => setEscasezActivo(e.target.checked)} /><label className="text-sm font-medium">Escasez de suministros</label></div>
                {escasezActivo && (
                  <div className="pl-6 flex flex-wrap gap-4">
                    <div><label className="text-xs">Probabilidad diaria:</label><input type="number" min="0" max="1" step="0.05" value={escasezProbabilidad} onChange={e => setEscasezProbabilidad(parseFloat(e.target.value))} className="w-24 ml-2 px-2 py-1 border rounded" /></div>
                    <div><label className="text-xs">Multiplicador de tiempo:</label><input type="number" min="1" max="3" step="0.1" value={escasezMultiplicador} onChange={e => setEscasezMultiplicador(parseFloat(e.target.value))} className="w-24 ml-2 px-2 py-1 border rounded" /></div>
                  </div>
                )}
              </div>
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center gap-2"><input type="checkbox" checked={accidentesActivo} onChange={e => setAccidentesActivo(e.target.checked)} /><label className="text-sm font-medium">Accidentes masivos</label></div>
                {accidentesActivo && (
                  <div className="pl-6 flex flex-wrap gap-4">
                    <div><label className="text-xs">Intervalo entre accidentes (horas):</label><input type="number" min="1" value={intervaloAccidentesHoras} onChange={e => setIntervaloAccidentesHoras(parseFloat(e.target.value))} className="w-24 ml-2 px-2 py-1 border rounded" /></div>
                    <div><label className="text-xs">Duración (horas):</label><input type="number" min="0.5" step="0.5" value={duracionAccidenteHoras} onChange={e => setDuracionAccidenteHoras(parseFloat(e.target.value))} className="w-24 ml-2 px-2 py-1 border rounded" /></div>
                    <div><label className="text-xs">Factor de llegada:</label><input type="number" min="1" max="5" step="0.5" value={factorAccidente} onChange={e => setFactorAccidente(parseFloat(e.target.value))} className="w-24 ml-2 px-2 py-1 border rounded" /></div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        {/* Tiempo de simulación (común) */}
        {renderInputSinX(tiempoValor, setTiempoValor, tiempoUnidad, setTiempoUnidad, "Tiempo de simulación")}
        {/* ------------------------------------------------------ */}
        {/* OPCIONES AVANZADAS M/M/1 */}
        {/* ------------------------------------------------------ */}
        {procesoId === 'mm1' && (
          <div className="space-y-2 border-b pb-3">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={capacidadActiva} onChange={e => setCapacidadActiva(e.target.checked)} />
              <label className="text-sm font-medium text-gray-700">Limitar capacidad de la cola (espera)</label>
            </div>
            {capacidadActiva && (
              <div className="pl-6 space-y-3">
                <div className="flex items-center gap-2">
                  <input type="number" min="1" value={capacidadMaxima} onChange={e => setCapacidadMaxima(parseInt(e.target.value) || 1)} className="w-32 px-3 py-2 border rounded-lg" />
                  <span className="text-sm text-gray-500">entidades máximo en cola</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={reintentosColaLlenaActivo} onChange={e => setReintentosColaLlenaActivo(e.target.checked)} />
                    <label className="text-sm font-medium text-gray-700">Clientes impacientes que intentan regresar</label>
                  </div>
                  {reintentosColaLlenaActivo && (
                    <div className="pl-6 mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs">Probabilidad de reintentar:</label>
                        <input type="number" min="0" max="1" step="0.05" value={probReintentoColaLlena} onChange={e => setProbReintentoColaLlena(parseFloat(e.target.value) || 0)} className="w-24 px-2 py-1 border rounded" />
                      </div>
                      {renderInputConUnidad(
                        tiempoReintentoColaLlenaValor, setTiempoReintentoColaLlenaValor,
                        tiempoReintentoColaLlenaUnidad, setTiempoReintentoColaLlenaUnidad,
                        "Tiempo medio de reintento", "any"
                      )}
                      <p className="text-xs text-gray-400">El cliente que se va por cola llena puede volver después de este tiempo (distribución exponencial). Máximo 3 reintentos por cliente.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {procesoId === 'mm1' && (
          <div className="space-y-2 border-b pb-3">
            <div className="flex items-center gap-2"><input type="checkbox" checked={reintentosActivo} onChange={e => setReintentosActivo(e.target.checked)} /><label className="text-sm font-medium text-gray-700">Reintentos (entidades pueden volver después de ser atendidas)</label></div>
            {reintentosActivo && (<div className="pl-6 space-y-2"><div className="flex items-center gap-2"><label className="text-xs">Probabilidad de reintento:</label><input type="number" min="0" max="1" step="0.05" value={probReintento} onChange={e => setProbReintento(parseFloat(e.target.value) || 0)} className="w-24 px-2 py-1 border rounded" /></div>{renderInputConUnidad(tiempoReintentoValor, setTiempoReintentoValor, tiempoReintentoUnidad, setTiempoReintentoUnidad, "Tiempo medio de reintento", "any")}<p className="text-xs text-gray-400">Máximo 3 reintentos por cliente para evitar bucles.</p></div>)}
          </div>
        )}
        {/* Horas pico (no para manufactura) */}
        {procesoId !== 'manufactura' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Horas pico (franjas horarias)</label>
                <div className="group relative">
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <strong>Factor de llegada</strong> - Multiplica la tasa de llegada base.<br/>
                    • 1.5 = +50% llegadas<br/>
                    • 2.0 = +100% llegadas (el doble)<br/>
                    • 0.5 = -50% llegadas (la mitad)
                  </div>
                </div>
              </div>
              <button type="button" onClick={agregarHoraPico} className={`text-xs flex items-center gap-1 px-2 py-1 rounded-full ${estilo.texto} border ${estilo.borde}`}>
                <Plus className="w-3 h-3" /> Agregar
              </button>
            </div>
            <AnimatePresence>
              {horasPico.map(pico => (
                <motion.div key={pico.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex flex-wrap gap-2 items-center bg-gray-50 p-2 rounded-lg">
                  <input type="number" placeholder="Inicio" value={pico.inicio} onChange={e => actualizarHoraPico(pico.id, 'inicio', e.target.value)} className="w-20 px-2 py-1 border rounded text-sm" step="0.5" />
                  <span className="text-xs text-gray-500">a</span>
                  <input type="number" placeholder="Fin" value={pico.fin} onChange={e => actualizarHoraPico(pico.id, 'fin', e.target.value)} className="w-20 px-2 py-1 border rounded text-sm" step="0.5" />
                  <span className="text-xs text-gray-500 ml-2 font-medium">Factor ×</span>
                  <input type="number" step="0.1" placeholder="Factor" value={pico.factor} onChange={e => actualizarHoraPico(pico.id, 'factor', e.target.value)} className="w-20 px-2 py-1 border rounded text-sm" />
                  <button onClick={() => eliminarHoraPico(pico.id)} className="text-red-500 ml-auto"><Trash2 className="w-4 h-4" /></button>
                </motion.div>
              ))}
            </AnimatePresence>
            <p className="text-xs text-gray-400">El <strong>Factor de llegada</strong> multiplica la tasa base. Ej: de 8 a 12 h con factor 1.5 → 50% más personas/hora.</p>
          </div>
        )}
        <button onClick={ejecutarSimulacion} disabled={simulando} className={`w-full bg-gradient-to-r ${estilo.primario} ${estilo.hover} text-white font-medium py-3 px-6 rounded-xl shadow-md transition-all disabled:opacity-50`}>
          {simulando ? <><Loader2 className="inline mr-2 h-4 w-4 animate-spin" /> Simulando... {Math.round(progreso)}%</> : <><Play className="inline mr-2 h-4 w-4" /> Ejecutar simulación</>}
        </button>
        {simulando && (
          <>
            <button onClick={cancelarSimulacion} className={`w-full mt-2 ${estilo.cancelar} text-white font-medium py-2 px-4 rounded-xl flex items-center justify-center gap-2`}>
              <XCircle className="h-4 w-4" /> Cancelar simulación
            </button>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div className={`h-full bg-gradient-to-r ${estilo.barra}`} initial={{ width: 0 }} animate={{ width: `${progreso}%` }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
