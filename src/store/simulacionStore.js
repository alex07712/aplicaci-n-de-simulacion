import { create } from 'zustand';

const useSimulacionStore = create((set, get) => ({
  procesoSeleccionado: null,
  resultados: null,
  simulando: false,
  progreso: 0,
  abortController: null,
  seleccionarProceso: (id) => set({ procesoSeleccionado: id, resultados: null, progreso: 0 }),
  setResultados: (resultados) => set({ resultados }),
  setSimulando: (simulando) => set({ simulando }),
  setProgreso: (progreso) => set({ progreso }),
  setAbortController: (controller) => set({ abortController: controller }),
  cancelarSimulacionGlobal: () => {
    const { abortController, simulando } = get();
    if (simulando && abortController) {
      abortController.abort();
      set({ simulando: false, progreso: 0, abortController: null });
    }
  },
  limpiar: () => set({ resultados: null, simulando: false, progreso: 0, abortController: null }),
}));

export default useSimulacionStore;