/**
 * PROCESO PREDEFINIDO: URGENCIAS HOSPITAL
 * Simulación de departamento de urgencias con triaje y múltiples servidores
 * 
 * Flujo: Llegada → Triaje → Espera → Atención médica → Salida
 */

import { Simulation } from '../base/Simulation.js';
import { Queue } from '../base/Queue.js';
import { distribucionExponencial, distribucionNormal } from '../../utils/estadisticas.js';

export class UrgenciasHospitalProcess extends Simulation {
  constructor(config) {
    super('Urgencias - Hospital');
    
    // Parámetros
    this.tasaLlegada = config.tasaLlegada || 0.8; // pacientes por hora / 60 minutos
    this.numDoctores = config.numDoctores || 2;
    this.numEnfermeras = config.numEnfermeras || 3;
    
    // Crear recursos
    this.triaje = new Queue('Triaje', 2); // 2 enfermeras de triaje
    this.medicos = new Queue('Médicos', this.numDoctores);
    this.enfermeras = new Queue('Enfermeras', this.numEnfermeras);
    
    this.pacientesAtendidos = [];
  }

  inicializar() {
    this.triaje.limpiar();
    this.medicos.limpiar();
    this.enfermeras.limpiar();
    this.pacientesAtendidos = [];
    
    // Programar primera llegada
    const tiempoProxLlegada = distribucionExponencial(this.tasaLlegada);
    this.programarEvento(tiempoProxLlegada, this.llegadaPaciente.bind(this));
  }

  /**
   * Evento: llegada de paciente
   */
  llegadaPaciente(sim, datos) {
    const pacienteID = this.triaje.clientesLlegados + 1;
    const urgencia = Math.random(); // 0-1, para determinar prioridad
    
    const paciente = {
      id: pacienteID,
      tiempoLlegada: this.tiempoActual,
      urgencia: urgencia < 0.2 ? 'CRÍTICA' : urgencia < 0.5 ? 'URGENTE' : 'NORMAL',
      tiemposEtapas: {}
    };

    this.triaje.llegarEntidad(paciente, this.tiempoActual);

    if (paciente.tiempoInicio === this.tiempoActual) {
      this.programarTriaje(paciente);
    }

    // Programar próxima llegada
    const tiempoProxLlegada = distribucionExponencial(this.tasaLlegada);
    this.programarEvento(
      this.tiempoActual + tiempoProxLlegada,
      this.llegadaPaciente.bind(this)
    );
  }

  /**
   * Evento: triaje (evaluación inicial)
   */
  programarTriaje(paciente) {
    const tiempoTriaje = distribucionNormal(3, 1); // 3 minutos promedio
    
    this.programarEvento(
      this.tiempoActual + Math.max(1, tiempoTriaje),
      this.finTriaje.bind(this),
      { paciente, tiempoTriaje }
    );
  }

  /**
   * Evento: fin de triaje
   */
  finTriaje(sim, datos) {
    const { paciente, tiempoTriaje } = datos;
    
    paciente.tiemposEtapas.triaje = tiempoTriaje;
    const proximoPaciente = this.triaje.liberarServidor(paciente, tiempoTriaje, this.tiempoActual);

    if (proximoPaciente) {
      this.programarTriaje(proximoPaciente);
    }

    // Paciente va a espera para médico
    this.medicos.llegarEntidad(paciente, this.tiempoActual);
    
    if (paciente.tiempoInicio === this.tiempoActual) {
      this.programarAtencionMedica(paciente);
    }
  }

  /**
   * Evento: atención médica
   */
  programarAtencionMedica(paciente) {
    // Tiempo según urgencia
    let tiempoMedio = 15;
    if (paciente.urgencia === 'CRÍTICA') tiempoMedio = 25;
    else if (paciente.urgencia === 'URGENTE') tiempoMedio = 20;

    const tiempoServicio = distribucionNormal(tiempoMedio, 5);
    
    this.programarEvento(
      this.tiempoActual + Math.max(5, tiempoServicio),
      this.finAtencionMedica.bind(this),
      { paciente, tiempoServicio }
    );
  }

  /**
   * Evento: fin de atención médica
   */
  finAtencionMedica(sim, datos) {
    const { paciente, tiempoServicio } = datos;
    
    paciente.tiemposEtapas.medico = tiempoServicio;
    const proximoPaciente = this.medicos.liberarServidor(paciente, tiempoServicio, this.tiempoActual);

    if (proximoPaciente) {
      this.programarAtencionMedica(proximoPaciente);
    }

    // Paciente va a enfermería (si no es crítica)
    if (paciente.urgencia !== 'CRÍTICA') {
      this.enfermeras.llegarEntidad(paciente, this.tiempoActual);
      
      if (paciente.tiempoInicio === this.tiempoActual) {
        this.programarEnfermeria(paciente);
      }
    } else {
      // Paciente crítico se va
      this.finalizarPaciente(paciente);
    }
  }

  /**
   * Evento: enfermería
   */
  programarEnfermeria(paciente) {
    const tiempoEnfermeria = distribucionNormal(8, 2);
    
    this.programarEvento(
      this.tiempoActual + Math.max(3, tiempoEnfermeria),
      this.finEnfermeria.bind(this),
      { paciente, tiempoEnfermeria }
    );
  }

  /**
   * Evento: fin de enfermería
   */
  finEnfermeria(sim, datos) {
    const { paciente, tiempoEnfermeria } = datos;
    
    paciente.tiemposEtapas.enfermeria = tiempoEnfermeria;
    const proximoPaciente = this.enfermeras.liberarServidor(paciente, tiempoEnfermeria, this.tiempoActual);

    if (proximoPaciente) {
      this.programarEnfermeria(proximoPaciente);
    }

    // Paciente se va
    this.finalizarPaciente(paciente);
  }

  /**
   * Finalizar paciente
   */
  finalizarPaciente(paciente) {
    paciente.tiempoSalida = this.tiempoActual;
    paciente.tiempoTotal = paciente.tiempoSalida - paciente.tiempoLlegada;
    this.pacientesAtendidos.push(paciente);
  }

  finalizarSimulacion() {
    const tiemposTotal = this.pacientesAtendidos.map(p => p.tiempoTotal);
    const tiemposPromedio = tiemposTotal.length > 0 
      ? (tiemposTotal.reduce((a, b) => a + b, 0) / tiemposTotal.length).toFixed(2)
      : 0;

    this.estadisticas = {
      pacientesAtendidos: this.pacientesAtendidos.length,
      tiempoPromedioTotal: tiemposPromedio,
      utilizacionMedicos: this.medicos.obtenerEstadisticas().utilizacion,
      utilizacionEnfermeras: this.enfermeras.obtenerEstadisticas().utilizacion,
      pacientesCriticos: this.pacientesAtendidos.filter(p => p.urgencia === 'CRÍTICA').length,
      pacientesUrgentes: this.pacientesAtendidos.filter(p => p.urgencia === 'URGENTE').length,
    };
  }
}