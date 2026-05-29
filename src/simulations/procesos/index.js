import { MM1Process } from './MM1.js';
import { ManufacturaProcess } from './Manufactura.js';
import { UrgenciasHospitalProcess } from './UrgenciasHospital.js';

export const PROCESOS_DISPONIBLES = {
  mm1: {
    nombre: 'Cola Simple',
    descripcion: '(fila de un banco, cajero, supermercado)',
    clase: MM1Process,
  },
  manufactura: {
    nombre: 'Línea de Producción',
    descripcion: 'Múltiples estaciones',
    clase: ManufacturaProcess,
  },
  urgencias: {
    nombre: 'Servicio de Urgencias',
    descripcion: 'Triaje, médicos y enfermeras',
    clase: UrgenciasHospitalProcess,
  }
};

export function obtenerListaProcesos() {
  return Object.entries(PROCESOS_DISPONIBLES).map(([id, config]) => ({
    id, nombre: config.nombre, descripcion: config.descripcion
  }));
}

export function obtenerConfiguracionProceso(id) {
  return PROCESOS_DISPONIBLES[id];
}

export function instanciarProceso(id, parametros) {
  const config = PROCESOS_DISPONIBLES[id];
  if (!config) throw new Error(`Proceso no encontrado: ${id}`);
  return new config.clase(parametros);
}
