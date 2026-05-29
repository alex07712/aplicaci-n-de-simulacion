import { Simulation } from '../base/Simulation.js';
import { Queue } from '../base/Queue.js';
import { distribucionExponencial, distribucionNormal } from '../../utils/estadisticas.js';

const GRAVEDAD = {
  CRITICO: { nombre: 'Crítico', indice: 0, color: 'bg-red-600' },
  URGENTE: { nombre: 'Urgente', indice: 1, color: 'bg-orange-500' },
  MODERADO: { nombre: 'Moderado', indice: 2, color: 'bg-yellow-500' },
  LEVE: { nombre: 'Leve', indice: 3, color: 'bg-green-500' }
};

export class UrgenciasHospitalProcess extends Simulation {
  constructor(config) {
    super('Servicio de Urgencias');
    this.tasaLlegadaBase = config.tasaLlegada ?? 0.2;  // pacientes por minuto
    this.numConsultorios = config.numConsultorios ?? 3;
    this.numEnfermeras = config.numEnfermeras ?? 4;
    this.capacidadSalaEspera = config.capacidadSalaEspera ?? 20;
    // TIEMPOS DE ATENCIÓN FIJOS (ya no se configuran desde UI)
    this.tiemposAtencion = {
      [GRAVEDAD.CRITICO.indice]: { media: 30, desviacion: 8 },   // minutos
      [GRAVEDAD.URGENTE.indice]: { media: 20, desviacion: 5 },
      [GRAVEDAD.MODERADO.indice]: { media: 12, desviacion: 3 },
      [GRAVEDAD.LEVE.indice]: { media: 7, desviacion: 2 }
    };
    this.porcentajeCritico = config.porcentajeCritico ?? 10;
    this.porcentajeUrgente = config.porcentajeUrgente ?? 20;
    this.porcentajeModerado = config.porcentajeModerado ?? 35;
    this.porcentajeLeve = config.porcentajeLeve ?? 35;
    this.horasPico = config.horasPico || [];
    this.empeoramientoActivo = config.empeoramientoActivo ?? false;
    this.tiempoEmpeoramiento = config.tiempoEmpeoramiento ?? 30;
    this.probabilidadEmpeoramiento = config.probabilidadEmpeoramiento ?? 0.5;
    this.escasezActivo = config.escasezActivo ?? false;
    this.escasezProbabilidad = config.escasezProbabilidad ?? 0.3;
    this.escasezMultiplicador = config.escasezMultiplicador ?? 1.5;
    this.accidentesActivo = config.accidentesActivo ?? false;
    this.intervaloAccidentes = config.intervaloAccidentes ?? 720; // minutos
    this.duracionAccidente = config.duracionAccidente ?? 120;
    this.factorAccidente = config.factorAccidente ?? 3.0;

    this.salaEspera = [];
    this.triaje = new Queue('Triaje', 1);
    this.consultorios = new Queue('Consultorios', this.numConsultorios);
    this.enfermeras = new Queue('Enfermeras', this.numEnfermeras);
    this.pacientesAtendidos = [];
    this.pacientesPerdidos = 0;
    this.pacientesEmpeorados = 0;
    this.accidentesOcurridos = 0;
    this.diasConEscasez = 0;
    this.escasezActiva = false;
    this.accidenteActivo = false;
  }

  determinarGravedad() {
    const rand = Math.random() * 100;
    let acumulado = 0;
    if (rand < (acumulado += this.porcentajeCritico)) return GRAVEDAD.CRITICO.indice;
    if (rand < (acumulado += this.porcentajeUrgente)) return GRAVEDAD.URGENTE.indice;
    if (rand < (acumulado += this.porcentajeModerado)) return GRAVEDAD.MODERADO.indice;
    return GRAVEDAD.LEVE.indice;
  }

  obtenerFactorHoraPico() {
    const hora = (this.tiempoActual / 60) % 24;
    for (const pico of this.horasPico) if (hora >= pico.inicio && hora < pico.fin) return pico.factor;
    return 1.0;
  }

  obtenerTasaActual() {
    let factor = this.obtenerFactorHoraPico();
    if (this.accidentesActivo && this.accidenteActivo) factor *= this.factorAccidente;
    return this.tasaLlegadaBase * factor;
  }

  actualizarEscasez() {
    if (!this.escasezActivo) return;
    const diasTranscurridos = Math.floor(this.tiempoActual / 1440);
    const proxEvaluacion = (diasTranscurridos + 1) * 1440;
    if (this.tiempoActual >= proxEvaluacion) {
      this.escasezActiva = Math.random() < this.escasezProbabilidad;
      if (this.escasezActiva) this.diasConEscasez++;
    }
  }

  programarProximoAccidente() {
    if (!this.accidentesActivo) return;
    this.programarEvento(this.tiempoActual + this.intervaloAccidentes, this.activarAccidente.bind(this));
  }

  activarAccidente() {
    if (!this.accidentesActivo) return;
    this.accidenteActivo = true;
    this.tiempoFinAccidente = this.tiempoActual + this.duracionAccidente;
    this.accidentesOcurridos++;
    this.programarEvento(this.tiempoFinAccidente, this.desactivarAccidente.bind(this));
  }

  desactivarAccidente() {
    this.accidenteActivo = false;
    this.programarProximoAccidente();
  }

  inicializar() {
    this.salaEspera = [];
    this.triaje.limpiar();
    this.consultorios.limpiar();
    this.enfermeras.limpiar();
    this.pacientesAtendidos = [];
    this.pacientesPerdidos = 0;
    this.pacientesEmpeorados = 0;
    this.accidentesOcurridos = 0;
    this.diasConEscasez = 0;
    this.escasezActiva = false;
    this.accidenteActivo = false;
    this.programarProximaLlegada();
    if (this.accidentesActivo) this.programarProximoAccidente();
  }

  programarProximaLlegada() {
    const tasa = this.obtenerTasaActual();
    if (tasa > 0) {
      const tiempo = distribucionExponencial(tasa);
      this.programarEvento(this.tiempoActual + tiempo, this.llegadaPaciente.bind(this));
    }
  }

  llegadaPaciente() {
    this.actualizarEscasez();
    if (this.capacidadSalaEspera > 0 && this.salaEspera.length >= this.capacidadSalaEspera) {
      this.pacientesPerdidos++;
      this.programarProximaLlegada();
      return;
    }
    const id = this.triaje.clientesLlegados + 1;
    const gravedadIndice = this.determinarGravedad();
    const gravedad = Object.values(GRAVEDAD).find(g => g.indice === gravedadIndice);
    const paciente = {
      id, tiempoLlegada: this.tiempoActual, gravedad: gravedad.nombre, gravedadIndice,
      tiemposEtapas: {}, empeoro: false, empeoramientos: 0
    };
    this.salaEspera.push(paciente);
    this.procesarSalaEspera();
    this.programarProximaLlegada();
  }

  procesarSalaEspera() {
    if (this.triaje.servidoresLibres > 0 && this.salaEspera.length > 0) {
      this.salaEspera.sort((a, b) => a.gravedadIndice - b.gravedadIndice);
      const paciente = this.salaEspera.shift();
      this.triaje.llegarEntidad(paciente, this.tiempoActual);
      if (paciente.tiempoInicio === this.tiempoActual) this.iniciarTriaje(paciente);
    }
  }

  iniciarTriaje(paciente) {
    const tiempoTriaje = distribucionNormal(3, 0.8);
    this.programarEvento(this.tiempoActual + Math.max(1, tiempoTriaje), this.finTriaje.bind(this), { paciente, tiempoTriaje });
  }

  finTriaje(sim, datos) {
    const { paciente, tiempoTriaje } = datos;
    paciente.tiemposEtapas.triaje = tiempoTriaje;
    const siguiente = this.triaje.liberarServidor(paciente, tiempoTriaje, this.tiempoActual);
    if (siguiente) this.iniciarTriaje(siguiente);
    this.consultorios.llegarEntidad(paciente, this.tiempoActual);
    if (paciente.tiempoInicio === this.tiempoActual) this.iniciarAtencionMedica(paciente);
    this.procesarSalaEspera();
  }

  iniciarAtencionMedica(paciente) {
    const config = this.tiemposAtencion[paciente.gravedadIndice];
    let tiempoBase = distribucionNormal(config.media, config.desviacion);
    tiempoBase = Math.max(2, tiempoBase);
    if (this.escasezActiva) tiempoBase *= this.escasezMultiplicador;
    this.programarEvento(this.tiempoActual + tiempoBase, this.finAtencionMedica.bind(this), { paciente, tiempoServicio: tiempoBase });
  }

  finAtencionMedica(sim, datos) {
    const { paciente, tiempoServicio } = datos;
    paciente.tiemposEtapas.medico = tiempoServicio;
    const siguiente = this.consultorios.liberarServidor(paciente, tiempoServicio, this.tiempoActual);
    if (siguiente) this.iniciarAtencionMedica(siguiente);
    if (paciente.gravedadIndice === GRAVEDAD.CRITICO.indice) {
      this.finalizarPaciente(paciente);
    } else {
      this.enfermeras.llegarEntidad(paciente, this.tiempoActual);
      if (paciente.tiempoInicio === this.tiempoActual) this.iniciarEnfermeria(paciente);
    }
  }

  iniciarEnfermeria(paciente) {
    const tiempoEnfermeria = distribucionNormal(8, 2);
    this.programarEvento(this.tiempoActual + Math.max(2, tiempoEnfermeria), this.finEnfermeria.bind(this), { paciente, tiempoEnfermeria });
  }

  finEnfermeria(sim, datos) {
    const { paciente, tiempoEnfermeria } = datos;
    paciente.tiemposEtapas.enfermeria = tiempoEnfermeria;
    const siguiente = this.enfermeras.liberarServidor(paciente, tiempoEnfermeria, this.tiempoActual);
    if (siguiente) this.iniciarEnfermeria(siguiente);
    this.finalizarPaciente(paciente);
  }

  finalizarPaciente(paciente) {
    paciente.tiempoSalida = this.tiempoActual;
    paciente.tiempoTotal = paciente.tiempoSalida - paciente.tiempoLlegada;

    if (this.empeoramientoActivo && !paciente.empeoro && paciente.empeoramientos < 2) {
      const tiempoEspera = (paciente.tiempoInicio || paciente.tiempoSalida) - paciente.tiempoLlegada;
      if (tiempoEspera > this.tiempoEmpeoramiento && Math.random() < this.probabilidadEmpeoramiento) {
        paciente.empeoro = true;
        paciente.empeoramientos++;
        paciente.gravedadIndice = Math.max(0, paciente.gravedadIndice - 1);
        paciente.gravedad = Object.values(GRAVEDAD).find(g => g.indice === paciente.gravedadIndice)?.nombre || 'Crítico';
        this.pacientesEmpeorados++;
        this.salaEspera.push(paciente);
        this.procesarSalaEspera();
        return;
      }
    }
    this.pacientesAtendidos.push(paciente);
  }

  finalizarSimulacion() {
    const tiemposTotal = this.pacientesAtendidos.map(p => p.tiempoTotal);
    const tiempoPromedio = tiemposTotal.length ? (tiemposTotal.reduce((a,b)=>a+b,0)/tiemposTotal.length).toFixed(2) : 0;
    const criticos = this.pacientesAtendidos.filter(p => p.gravedad === 'Crítico').length;
    const urgentes = this.pacientesAtendidos.filter(p => p.gravedad === 'Urgente').length;
    const moderados = this.pacientesAtendidos.filter(p => p.gravedad === 'Moderado').length;
    const leves = this.pacientesAtendidos.filter(p => p.gravedad === 'Leve').length;

    this.estadisticas = {
      pacientesAtendidos: this.pacientesAtendidos.length,
      pacientesPerdidos: this.pacientesPerdidos,
      pacientesEmpeorados: this.pacientesEmpeorados,
      tiempoPromedioTotal: tiempoPromedio,
      utilizacionConsultorios: this.consultorios.obtenerEstadisticas(this.tiempoFinal).utilizacion,
      utilizacionEnfermeras: this.enfermeras.obtenerEstadisticas(this.tiempoFinal).utilizacion,
      utilizacionTriaje: this.triaje.obtenerEstadisticas(this.tiempoFinal).utilizacion,
      criticos, urgentes, moderados, leves,
      capacidadSalaEspera: this.capacidadSalaEspera,
      accidentesOcurridos: this.accidentesOcurridos,
      diasConEscasez: this.diasConEscasez,
      tiempoSimulacionMinutos: this.tiempoFinal
    };
  }
}
