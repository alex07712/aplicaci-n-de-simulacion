import { motion } from 'framer-motion';
import { Store, Factory, Hospital, ChevronRight, ClipboardList } from 'lucide-react';
import { obtenerListaProcesos } from '../simulations/procesos/index.js';

const iconos = { mm1: <Store className="w-8 h-8" />, manufactura: <Factory className="w-8 h-8" />, urgencias: <Hospital className="w-8 h-8" /> };
const colores = {
  mm1: { borde: 'border-blue-300', hover: 'hover:border-blue-400', fondoSeleccionado: 'from-blue-600 to-blue-700', textoSeleccionado: 'text-white', iconoFondo: 'bg-blue-100 group-hover:bg-blue-200', iconoSelected: 'bg-white/20 text-white' },
  manufactura: { borde: 'border-red-300', hover: 'hover:border-red-400', fondoSeleccionado: 'from-red-500 to-red-600', textoSeleccionado: 'text-white', iconoFondo: 'bg-red-100 group-hover:bg-red-200', iconoSelected: 'bg-white/20 text-white' },
  urgencias: { borde: 'border-green-300', hover: 'hover:border-green-400', fondoSeleccionado: 'from-green-600 to-green-700', textoSeleccionado: 'text-white', iconoFondo: 'bg-green-100 group-hover:bg-green-200', iconoSelected: 'bg-white/20 text-white' }
};

export default function SelectorProceso({ procesoSeleccionado, onSeleccionar }) {
  const procesos = obtenerListaProcesos();
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ClipboardList className="w-6 h-6 text-gray-700" />Procesos disponibles</h2>
      <div className="grid gap-4">
        {procesos.map((proceso, idx) => {
          const estilo = colores[proceso.id];
          const isSelected = procesoSeleccionado === proceso.id;
          return (
            <motion.button
              key={proceso.id}
              onClick={() => onSeleccionar(proceso.id)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`group w-full text-left p-5 rounded-2xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border ${isSelected ? `bg-gradient-to-r ${estilo.fondoSeleccionado} ${estilo.textoSeleccionado} shadow-xl border-transparent` : `bg-white text-gray-800 border ${estilo.borde} ${estilo.hover}`}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl transition-colors ${isSelected ? estilo.iconoSelected : `${estilo.iconoFondo} text-gray-700`}`}>
                    {iconos[proceso.id]}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{proceso.nombre}</h3>
                    <p className={`text-sm mt-1 ${isSelected ? "text-white/80" : "text-gray-500"}`}>{proceso.descripcion}</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 transition-all ${isSelected ? "translate-x-1 opacity-100 text-white" : "opacity-0 group-hover:translate-x-1 group-hover:opacity-100 text-gray-400"}`} />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}