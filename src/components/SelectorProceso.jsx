import { obtenerListaProcesos } from '../simulations/procesos/index.js';

export default function SelectorProceso({ procesoSeleccionado, onSeleccionar }) {
  const procesos = obtenerListaProcesos();

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
        <h2 className="text-white font-bold text-lg">Procesos Disponibles</h2>
      </div>
      
      <div className="divide-y">
        {procesos.map((proceso) => (
          <button
            key={proceso.id}
            onClick={() => onSeleccionar(proceso.id)}
            className={`w-full p-4 text-left transition-all hover:bg-blue-50 ${
              procesoSeleccionado === proceso.id 
                ? 'bg-blue-100 border-l-4 border-blue-600' 
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-1">{proceso.icono}</span>
              <div>
                <h3 className="font-semibold text-gray-800">
                  {proceso.nombre}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {proceso.descripcion}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}