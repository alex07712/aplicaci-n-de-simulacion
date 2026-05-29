import { motion, AnimatePresence } from 'framer-motion';
import SelectorProceso from './SelectorProceso';
import ControlesSimulacion from './ControlesSimulacion';
import ResultadosSimulacion from './ResultadosSimulacion';
import useSimulacionStore from '../store/simulacionStore';
import { Settings2 } from 'lucide-react';

export default function SimuladorUI() {
  const { procesoSeleccionado, seleccionarProceso, resultados, simulando, progreso, setResultados, setSimulando, setProgreso, cancelarSimulacionGlobal } = useSimulacionStore();
  const manejarCambioProc = (id) => { if (simulando) cancelarSimulacionGlobal(); seleccionarProceso(id); };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-12 text-center"><h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Simulador de Procesos</h1><div className="flex items-center justify-center gap-3"><img src="/icono pagina.png" alt="Model Pro" className="h-12 w-auto" /><span className="text-2xl font-semibold text-gray-700">model pro</span></div></header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1"><SelectorProceso procesoSeleccionado={procesoSeleccionado} onSeleccionar={manejarCambioProc} /></div>
          <div className="lg:col-span-2 space-y-8">
            {procesoSeleccionado ? (
              <>
                <motion.div key={`controles-${procesoSeleccionado}`} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}><ControlesSimulacion procesoId={procesoSeleccionado} simulando={simulando} progreso={progreso} onSimulando={setSimulando} onProgreso={setProgreso} onResultados={setResultados} /></motion.div>
                <AnimatePresence mode="wait">{resultados && (<motion.div key="resultados" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><ResultadosSimulacion resultados={resultados} procesoId={procesoSeleccionado} /></motion.div>)}</AnimatePresence>
              </>
            ) : (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-gray-100"><Settings2 className="mx-auto mb-4 h-14 w-14 text-gray-500" /><h3 className="text-2xl font-semibold text-gray-800">Selecciona un proceso</h3><p className="text-gray-500 mt-2">Elige uno de los procesos del panel izquierdo para comenzar la simulación</p></motion.div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
