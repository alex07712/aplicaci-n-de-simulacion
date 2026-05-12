/**
 * Clase base para todas las simulaciones
 * Maneja el tiempo, eventos y estadísticas
 */
export class Simulation {
  constructor(nombre = 'Simulación') {
    this.nombre = nombre;
    this.tiempoActual = 0;
    this.tiempoFinal = 0;
    this.cola_eventos = [];
    this.entidades = [];
    this.recursos = [];
    this.estadisticas = {};
    this.paused = false;
    this.listeners = [];
  }

  /**
   * Programar un evento en el tiempo
   */
  programarEvento(tiempo, funcion, datos = {}) {
    this.cola_eventos.push({
      tiempo,
      funcion,
      datos,
      id: Math.random(),
    });
    this.cola_eventos.sort((a, b) => a.tiempo - b.tiempo);
  }

  /**
   * Ejecutar la simulación
   */
  async ejecutar(tiempoFinal) {
    this.tiempoFinal = tiempoFinal;
    this.tiempoActual = 0;
    this.cola_eventos = [];
    this.inicializar();

    while (this.tiempoActual < this.tiempoFinal && this.cola_eventos.length > 0) {
      if (this.paused) {
        await new Promise(resolve => setTimeout(resolve, 50));
        continue;
      }

      const evento = this.cola_eventos.shift();
      if (evento.tiempo > this.tiempoFinal) break;

      this.tiempoActual = evento.tiempo;
      await evento.funcion(this, evento.datos);

      this.notificar({
        tipo: 'evento',
        tiempo: this.tiempoActual,
        progreso: (this.tiempoActual / this.tiempoFinal) * 100,
      });

      // Pequeña pausa para no bloquear UI
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    this.finalizarSimulacion();
  }

  /**
   * Método para sobrescribir - inicialización
   */
  inicializar() {}

  /**
   * Método para sobrescribir - lógica de finalización
   */
  finalizarSimulacion() {}

  /**
   * Suscribirse a eventos
   */
  subscribe(listener) {
    this.listeners.push(listener);
  }

  /**
   * Notificar a los listeners
   */
  notificar(datos) {
    this.listeners.forEach(listener => listener(datos));
  }

  /**
   * Pausar simulación
   */
  pausar() {
    this.paused = true;
  }

  /**
   * Reanudar simulación
   */
  reanudar() {
    this.paused = false;
  }

  /**
   * Detener simulación
   */
  detener() {
    this.cola_eventos = [];
    this.tiempoActual = this.tiempoFinal;
  }
}