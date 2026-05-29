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

  programarEvento(tiempo, funcion, datos = {}) {
    this.cola_eventos.push({ tiempo, funcion, datos, id: Math.random() });
    this.cola_eventos.sort((a, b) => a.tiempo - b.tiempo);
  }

  async ejecutar(tiempoFinal, signal) {
    this.tiempoFinal = tiempoFinal;
    this.tiempoActual = 0;
    this.cola_eventos = [];
    this.inicializar();

    const CHUNK_SIZE = 50;
    let eventosProcesados = 0;

    while (this.tiempoActual < this.tiempoFinal && this.cola_eventos.length > 0) {
      if (signal?.aborted) throw new DOMException('Simulación cancelada', 'AbortError');

      const limite = Math.min(CHUNK_SIZE, this.cola_eventos.length);
      for (let i = 0; i < limite; i++) {
        const evento = this.cola_eventos.shift();
        if (evento.tiempo > this.tiempoFinal) break;
        this.tiempoActual = evento.tiempo;
        await evento.funcion(this, evento.datos);
        eventosProcesados++;
        if (eventosProcesados % 20 === 0) {
          const progreso = (this.tiempoActual / this.tiempoFinal) * 100;
          this.notificar({ tipo: 'evento', tiempo: this.tiempoActual, progreso: Math.min(100, progreso) });
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    this.finalizarSimulacion();
    this.notificar({ tipo: 'fin', progreso: 100 });
  }

  inicializar() {}
  finalizarSimulacion() {}

  subscribe(listener) { this.listeners.push(listener); }
  notificar(datos) { this.listeners.forEach(listener => listener(datos)); }
  pausar() { this.paused = true; }
  reanudar() { this.paused = false; }
  detener() { this.cola_eventos = []; this.tiempoActual = this.tiempoFinal; }
}