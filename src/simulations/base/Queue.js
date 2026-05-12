/**
 * Clase para manejar colas de espera y servidores
 */
export class Queue {
  constructor(nombre = 'Cola', capacidadServidores = 1) {
    this.nombre = nombre;
    this.capacidadServidores = capacidadServidores;
    this.servidoresLibres = capacidadServidores;
    this.entidadesEnEspera = [];
    this.tiemposEspera = [];
    this.tiemposServicio = [];
    this.clientesAtendidos = 0;
    this.clientesLlegados = 0;
  }

  /**
   * Una entidad llega a la cola
   */
  llegarEntidad(entidad, tiempo) {
    this.clientesLlegados++;
    entidad.tiempoLlegada = tiempo;
    entidad.tiempoInicio = null;

    if (this.servidoresLibres > 0) {
      // Atender inmediatamente
      this.atenderEntidad(entidad, tiempo);
    } else {
      // Poner en espera
      this.entidadesEnEspera.push(entidad);
    }
  }

  /**
   * Atender una entidad
   */
  atenderEntidad(entidad, tiempo) {
    this.servidoresLibres--;
    entidad.tiempoInicio = tiempo;
    
    if (entidad.tiempoLlegada !== undefined && entidad.tiempoInicio !== undefined) {
      const espera = entidad.tiempoInicio - entidad.tiempoLlegada;
      this.tiemposEspera.push(espera);
    }
  }

  /**
   * Liberar un servidor (entidad termina servicio)
   */
  liberarServidor(entidad, tiempoServicio, tiempoActual) {
    this.servidoresLibres++;
    this.clientesAtendidos++;
    this.tiemposServicio.push(tiempoServicio);

    // Si hay alguien esperando, atender al siguiente
    if (this.entidadesEnEspera.length > 0) {
      const siguiente = this.entidadesEnEspera.shift();
      this.atenderEntidad(siguiente, tiempoActual);
      return siguiente;
    }
    return null;
  }

  /**
   * Obtener estadísticas
   */
  obtenerEstadisticas() {
    const calcularPromedio = (arr) => 
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    return {
      clientesLlegados: this.clientesLlegados,
      clientesAtendidos: this.clientesAtendidos,
      personasEnEspera: this.entidadesEnEspera.length,
      tiempoPromedioEspera: calcularPromedio(this.tiemposEspera).toFixed(2),
      tiempoPromedioServicio: calcularPromedio(this.tiemposServicio).toFixed(2),
      utilizacion: ((this.capacidadServidores - this.servidoresLibres) / this.capacidadServidores * 100).toFixed(1),
      tiemposEspera: this.tiemposEspera,
      tiemposServicio: this.tiemposServicio,
    };
  }

  /**
   * Limpiar estadísticas
   */
  limpiar() {
    this.servidoresLibres = this.capacidadServidores;
    this.entidadesEnEspera = [];
    this.tiemposEspera = [];
    this.tiemposServicio = [];
    this.clientesAtendidos = 0;
    this.clientesLlegados = 0;
  }
}