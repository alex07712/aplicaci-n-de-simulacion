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

  llegarEntidad(entidad, tiempo) {
    this.clientesLlegados++;
    entidad.tiempoLlegada = tiempo;
    entidad.tiempoInicio = null;
    if (this.servidoresLibres > 0) {
      this.atenderEntidad(entidad, tiempo);
    } else {
      this.entidadesEnEspera.push(entidad);
    }
  }

  atenderEntidad(entidad, tiempo) {
    this.servidoresLibres--;
    entidad.tiempoInicio = tiempo;
    if (entidad.tiempoLlegada !== undefined && entidad.tiempoInicio !== undefined) {
      const espera = entidad.tiempoInicio - entidad.tiempoLlegada;
      this.tiemposEspera.push(espera);
    }
  }

  liberarServidor(entidad, tiempoServicio, tiempoActual) {
    this.servidoresLibres++;
    this.clientesAtendidos++;
    this.tiemposServicio.push(tiempoServicio);
    if (this.entidadesEnEspera.length > 0) {
      const siguiente = this.entidadesEnEspera.shift();
      this.atenderEntidad(siguiente, tiempoActual);
      return siguiente;
    }
    return null;
  }

  obtenerEstadisticas(tiempoSimulacion = null) {
    const calcularPromedio = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const tiempoServicioTotal = this.tiemposServicio.reduce((a, b) => a + b, 0);
    const utilizacion = tiempoSimulacion && tiempoSimulacion > 0
      ? Math.min(100, (tiempoServicioTotal / (this.capacidadServidores * tiempoSimulacion)) * 100)
      : ((this.capacidadServidores - this.servidoresLibres) / this.capacidadServidores * 100);

    return {
      clientesLlegados: this.clientesLlegados,
      clientesAtendidos: this.clientesAtendidos,
      personasEnEspera: this.entidadesEnEspera.length,
      tiempoPromedioEspera: calcularPromedio(this.tiemposEspera).toFixed(2),
      tiempoPromedioServicio: calcularPromedio(this.tiemposServicio).toFixed(2),
      utilizacion: utilizacion.toFixed(1),
      tiemposEspera: this.tiemposEspera,
      tiemposServicio: this.tiemposServicio,
    };
  }

  limpiar() {
    this.servidoresLibres = this.capacidadServidores;
    this.entidadesEnEspera = [];
    this.tiemposEspera = [];
    this.tiemposServicio = [];
    this.clientesAtendidos = 0;
    this.clientesLlegados = 0;
  }
}
