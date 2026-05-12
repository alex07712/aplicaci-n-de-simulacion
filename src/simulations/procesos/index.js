/**
 * Índice de procesos disponibles
 * Aquí se exportan todos los procesos predefinidos
 */

import { MM1Process } from './MM1.js';
import { ManufacturaProcess } from './Manufactura.js';
import { UrgenciasHospitalProcess } from './UrgenciasHospital.js';

export const PROCESOS_DISPONIBLES = {
  mm1: {
    nombre: 'Cola Simple (M/M/1)',
    descripcion: 'Sistema de colas con un servidor. Ejemplo: caja registradora',
    icono: '🏪',
    clase: MM1Process,
    parametros: [
      {
        id: 'tasaLlegada',
        nombre: 'Tasa de llegada',
        tipo: 'number',
        min: 0.1,
        max: 3,
        step: 0.1,
        default: 0.5,
        unidad: 'clientes/min'
      },
      {
        id: 'tasaServicio',
        nombre: 'Tasa de servicio',
        tipo: 'number',
        min: 0.2,
        max: 5,
        step: 0.1,
        default: 0.75,
        unidad: 'clientes/min'
      }
    ]
  },

  manufactura: {
    nombre: 'Línea de Manufactura',
    descripcion: 'Línea de montaje con múltiples estaciones en serie',
    icono: '🏭',
    clase: ManufacturaProcess,
    parametros: [
      {
        id: 'tiempoLlegadaUnidades',
        nombre: 'Tiempo entre llegadas',
        tipo: 'number',
        min: 2,
        max: 10,
        step: 0.5,
        default: 5,
        unidad: 'minutos'
      },
      {
        id: 'numEstaciones',
        nombre: 'Número de estaciones',
        tipo: 'select',
        opciones: [
          { valor: 3, label: '3 estaciones' },
          { valor: 4, label: '4 estaciones' },
          { valor: 5, label: '5 estaciones' }
        ],
        default: 3
      }
    ]
  },

  urgencias: {
    nombre: 'Urgencias Hospital',
    descripcion: 'Departamento de urgencias con triaje, médicos y enfermeras',
    icono: '🏥',
    clase: UrgenciasHospitalProcess,
    parametros: [
      {
        id: 'tasaLlegada',
        nombre: 'Tasa de llegada',
        tipo: 'number',
        min: 0.3,
        max: 2,
        step: 0.1,
        default: 0.8,
        unidad: 'pacientes/hora'
      },
      {
        id: 'numDoctores',
        nombre: 'Número de doctores',
        tipo: 'select',
        opciones: [
          { valor: 1, label: '1 doctor' },
          { valor: 2, label: '2 doctores' },
          { valor: 3, label: '3 doctores' }
        ],
        default: 2
      },
      {
        id: 'numEnfermeras',
        nombre: 'Número de enfermeras',
        tipo: 'select',
        opciones: [
          { valor: 2, label: '2 enfermeras' },
          { valor: 3, label: '3 enfermeras' },
          { valor: 4, label: '4 enfermeras' },
          { valor: 5, label: '5 enfermeras' }
        ],
        default: 3
      }
    ]
  }
};

/**
 * Obtener lista de procesos para menú
 */
export function obtenerListaProcesos() {
  return Object.entries(PROCESOS_DISPONIBLES).map(([id, config]) => ({
    id,
    nombre: config.nombre,
    descripcion: config.descripcion,
    icono: config.icono
  }));
}

/**
 * Obtener configuración de un proceso
 */
export function obtenerConfiguracionProceso(id) {
  return PROCESOS_DISPONIBLES[id];
}

/**
 * Instanciar un proceso con parámetros
 */
export function instanciarProceso(id, parametros) {
  const config = PROCESOS_DISPONIBLES[id];
  if (!config) {
    throw new Error(`Proceso no encontrado: ${id}`);
  }
  return new config.clase(parametros);
}