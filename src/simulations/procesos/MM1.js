/**
 * PROCESO PREDEFINIDO: M/M/1
 * Sistema de colas simple - una llegada, un servidor
 * 
 * Ejemplo: Caja registradora, atención al cliente, etc.
 */

import { Simulation } from '../base/Simulation.js';
import { Queue } from '../base/Queue.js';
import { distribucionExponencial } from '../../utils/estadisticas.js';

export class MM1Process extends Simulation {
  constructor(config) {
    super('M/M/1 - Cola Simple');
    
    // Parámetros con valores por defecto
    this.tasaLlegada = config.tasaLlegada || 0.5; // clientes por minuto
    this.tasaServicio = config.tasaServicio || 0.75; // clientes por minuto
    
    // Crear recurso (servidor)
    this.caja = new Queue('Caja', 1);
  }

  inicializar() {
    this.caja.limpiar();
    
    // Programar primera llegada
    const tiempoProxLlegada = distribucionExponencial(this.tasaLlegada);
    this.programarEvento(tiempoProxLlegada, this.llegadaCliente.bind(this));
  }

  /**
   * Evento: llegada de cliente
   */
  llegadaCliente(sim, datos) {
    const clienteID = this.caja.clientesLlegados + 1;
    const cliente = { id: clienteID, tiempoLlegada: this.tiempoActual };
    
    this.caja.llegarEntidad(cliente, this.tiempoActual);

    // Si el cliente fue atendido inmediatamente, programar servicio
    if (cliente.tiempoInicio === this.tiempoActual) {
      this.programarServicio(cliente);
    }

    // Programar próxima llegada
    const tiempoProxLlegada = distribucionExponencial(this.tasaLlegada);
    this.programarEvento(this.tiempoActual + tiempoProxLlegada, this.llegadaCliente.bind(this));
  }

  /**
   * Evento: inicio/servicio de cliente
   */
  programarServicio(cliente) {
    const tiempoServicio = distribucionExponencial(this.tasaServicio);
    
    this.programarEvento(
      this.tiempoActual + tiempoServicio,
      this.finServicio.bind(this),
      { cliente, tiempoServicio }
    );
  }

  /**
   * Evento: fin de servicio
   */
  finServicio(sim, datos) {
    const { cliente, tiempoServicio } = datos;

    const proximoCliente = this.caja.liberarServidor(cliente, tiempoServicio, this.tiempoActual);

    // Si hay cliente esperando, atenderlo
    if (proximoCliente) {
      this.programarServicio(proximoCliente);
    }
  }

  finalizarSimulacion() {
    this.estadisticas = this.caja.obtenerEstadisticas();
  }
}