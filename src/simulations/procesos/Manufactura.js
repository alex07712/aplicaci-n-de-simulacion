/**
 * PROCESO PREDEFINIDO: MANUFACTURA
 * Línea de montaje con 3-5 estaciones en serie
 * 
 * Ejemplo: Línea de producción de autos, cadena de empaquetado, etc.
 */

import { Simulation } from '../base/Simulation.js';
import { Queue } from '../base/Queue.js';
import { distribucionNormal } from '../../utils/estadisticas.js';

export class ManufacturaProcess extends Simulation {
  constructor(config) {
    super('Manufactura - Línea de Montaje');
    
    // Parámetros
    this.tiempoLlegadaUnidades = config.tiempoLlegadaUnidades || 5; // minutos
    this.numEstaciones = config.numEstaciones || 3; // 3, 4 o 5 estaciones
    
    // Crear estaciones
    this.estaciones = [];
    for (let i = 0; i < this.numEstaciones; i++) {
      this.estaciones.push(new Queue(`Estación ${i + 1}`, 1));
    }

    // Parámetros de tiempo por estación (media, desviación)
    this.tiemposEstacion = config.tiemposEstacion || [
      { media: 4, desviacion: 1 },   // Estación 1
      { media: 5, desviacion: 1.5 }, // Estación 2
      { media: 3, desviacion: 0.8 }, // Estación 3
    ];
  }

  inicializar() {
    this.estaciones.forEach(e => e.limpiar());
    
    // Programar primera unidad
    this.programarEvento(this.tiempoLlegadaUnidades, this.llegadaUnidad.bind(this));
  }

  /**
   * Evento: llegada de unidad a la línea
   */
  llegadaUnidad(sim, datos) {
    const unidadID = this.estaciones[0].clientesLlegados + 1;
    const unidad = { 
      id: unidadID, 
      tiempoLlegada: this.tiempoActual,
      estacionesCompletadas: 0
    };

    // Enviar a primera estación
    this.enviarEstacion(unidad, 0);

    // Programar próxima llegada
    this.programarEvento(
      this.tiempoActual + this.tiempoLlegadaUnidades,
      this.llegadaUnidad.bind(this)
    );
  }

  /**
   * Enviar unidad a una estación
   */
  enviarEstacion(unidad, indexEstacion) {
    if (indexEstacion >= this.numEstaciones) {
      // Unidad completó todas las estaciones
      return;
    }

    const estacion = this.estaciones[indexEstacion];
    estacion.llegarEntidad(unidad, this.tiempoActual);

    // Si fue atendida inmediatamente, programar fin
    if (unidad.tiempoInicio === this.tiempoActual) {
      this.programarFinEstacion(unidad, indexEstacion);
    }
  }

  /**
   * Programar fin de procesamiento en estación
   */
  programarFinEstacion(unidad, indexEstacion) {
    const config = this.tiemposEstacion[indexEstacion] || 
                   { media: 4, desviacion: 1 };
    
    const tiempoServicio = distribucionNormal(config.media, config.desviacion);
    const tiempoServicioPositivo = Math.max(0.5, tiempoServicio); // Mínimo 0.5 min

    this.programarEvento(
      this.tiempoActual + tiempoServicioPositivo,
      this.finEstacion.bind(this),
      { unidad, indexEstacion, tiempoServicio: tiempoServicioPositivo }
    );
  }

  /**
   * Evento: fin de procesamiento en estación
   */
  finEstacion(sim, datos) {
    const { unidad, indexEstacion, tiempoServicio } = datos;
    const estacion = this.estaciones[indexEstacion];

    const proximaUnidad = estacion.liberarServidor(unidad, tiempoServicio, this.tiempoActual);

    // Si hay otra unidad esperando en esta estación
    if (proximaUnidad) {
      this.programarFinEstacion(proximaUnidad, indexEstacion);
    }

    // Enviar unidad a próxima estación
    unidad.estacionesCompletadas++;
    this.enviarEstacion(unidad, indexEstacion + 1);
  }

  finalizarSimulacion() {
    this.estadisticas = this.estaciones.map((e, i) => ({
      nombre: `Estación ${i + 1}`,
      ...e.obtenerEstadisticas()
    }));
  }
}