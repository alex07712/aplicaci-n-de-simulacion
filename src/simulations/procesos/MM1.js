import { Simulation } from '../base/Simulation.js';
import { Queue } from '../base/Queue.js';
import { distribucionExponencial } from '../../utils/estadisticas.js';

export class MM1Process extends Simulation {
  constructor(config) {
    super('Sistema de Cola Simple');
    this.tasaLlegadaBase = config.tasaLlegada;
    this.tasaServicio = config.tasaServicio;
    this.capacidadMaxima = config.capacidadMaxima || null;
    this.horasPico = config.horasPico || [];
    
    // Reintentos por servicio (clientes atendidos que vuelven)
    this.probabilidadReintento = config.probabilidadReintento || 0;
    this.tiempoReintento = config.tiempoReintento || 0;
    this.maxReintentos = config.maxReintentos || 3;
    
    // Reintentos por cola llena (clientes impacientes que regresan)
    this.reintentosColaLlenaActivo = config.reintentosColaLlenaActivo || false;
    this.probReintentoColaLlena = config.probReintentoColaLlena || 0;
    this.tiempoReintentoColaLlena = config.tiempoReintentoColaLlena || 0;
    this.maxReintentosColaLlena = config.maxReintentosColaLlena || 3;
    
    this.caja = new Queue('Caja', 1);
    this.totalClientesPerdidos = 0;           // los que se pierden definitivamente (sin reintentar)
    this.clientesReingresados = 0;            // reintentos por servicio
    this.clientesReintentadosColaLlena = 0;   // reintentos por cola llena
  }

  obtenerTasaLlegadaActual() {
    const horaDelDia = (this.tiempoActual / 60) % 24;
    let factor = 1.0;
    for (const pico of this.horasPico) {
      if (horaDelDia >= pico.inicio && horaDelDia < pico.fin) {
        factor = pico.factor;
        break;
      }
    }
    return this.tasaLlegadaBase * factor;
  }

  inicializar() {
    this.caja.limpiar();
    this.totalClientesPerdidos = 0;
    this.clientesReingresados = 0;
    this.clientesReintentadosColaLlena = 0;
    this.programarProximaLlegada();
  }

  programarProximaLlegada() {
    const tasaActual = this.obtenerTasaLlegadaActual();
    if (tasaActual > 0) {
      const tiempoProx = distribucionExponencial(tasaActual);
      this.programarEvento(this.tiempoActual + tiempoProx, this.llegadaCliente.bind(this));
    }
  }

  llegadaCliente(sim, datos = {}) {
    const esReintentoColaLlena = datos.esReintentoColaLlena || false;
    const reintentosHechos = datos.reintentosHechos || 0;

    // Verificar límite de capacidad (solo si no es reintento? No, también aplica a reintentos)
    const colaLlena = (this.capacidadMaxima !== null && this.caja.entidadesEnEspera.length >= this.capacidadMaxima);
    
    if (colaLlena) {
      // Cliente rechazado por cola llena (primera vez que llega)
      if (this.reintentosColaLlenaActivo && this.tiempoReintentoColaLlena > 0 && reintentosHechos < this.maxReintentosColaLlena && Math.random() < this.probReintentoColaLlena) {
        // Reintentar después de un tiempo
        const tiempoReint = distribucionExponencial(1 / this.tiempoReintentoColaLlena);
        this.programarEvento(this.tiempoActual + tiempoReint, this.llegadaCliente.bind(this), {
          esReintentoColaLlena: true,
          reintentosHechos: reintentosHechos + 1
        });
        this.clientesReintentadosColaLlena++;
      } else {
        this.totalClientesPerdidos++;
      }
      if (!esReintentoColaLlena) this.programarProximaLlegada();
      return;
    }
    
    // Cliente aceptado
    const clienteID = this.caja.clientesLlegados + 1;
    const cliente = {
      id: clienteID,
      tiempoLlegada: this.tiempoActual,
      esReintento: esReintentoColaLlena,      // para saber si viene de reintento por cola llena
      reintentosHechos: reintentosHechos,      // reintentos por cola llena ya realizados
      reintentosServicioHechos: 0
    };
    
    this.caja.llegarEntidad(cliente, this.tiempoActual);
    if (cliente.tiempoInicio === this.tiempoActual) {
      this.programarServicio(cliente);
    }
    if (!esReintentoColaLlena) this.programarProximaLlegada();
  }

  programarServicio(cliente) {
    const tiempoServicio = distribucionExponencial(this.tasaServicio);
    this.programarEvento(this.tiempoActual + tiempoServicio, this.finServicio.bind(this), { cliente, tiempoServicio });
  }

  finServicio(sim, datos) {
    const { cliente, tiempoServicio } = datos;
    const proximoCliente = this.caja.liberarServidor(cliente, tiempoServicio, this.tiempoActual);
    if (proximoCliente) this.programarServicio(proximoCliente);
    
    // Reintento por servicio (solo si no es un cliente que ya reintentó por cola llena? Se permite también)
    if (this.probabilidadReintento > 0 && this.tiempoReintento > 0 && Math.random() < this.probabilidadReintento && cliente.reintentosServicioHechos < this.maxReintentos) {
      const tiempoReint = distribucionExponencial(1 / this.tiempoReintento);
      const nuevoCliente = {
        id: this.caja.clientesLlegados + 1,
        tiempoLlegada: this.tiempoActual + tiempoReint,
        esReintento: true,                     // marca para no volver a reintentar por servicio
        reintentosHechos: cliente.reintentosHechos,
        reintentosServicioHechos: cliente.reintentosServicioHechos + 1
      };
      this.clientesReingresados++;
      this.programarEvento(this.tiempoActual + tiempoReint, this.llegadaReintento.bind(this), nuevoCliente);
    }
  }

  llegadaReintento(sim, datos) {
    const cliente = datos;
    // Verificar cola llena también para reintentos por servicio
    if (this.capacidadMaxima !== null && this.caja.entidadesEnEspera.length >= this.capacidadMaxima) {
      // Si la cola está llena, este reintento se pierde (no se reintenta de nuevo)
      this.totalClientesPerdidos++;
      return;
    }
    this.caja.llegarEntidad(cliente, this.tiempoActual);
    if (cliente.tiempoInicio === this.tiempoActual) {
      this.programarServicio(cliente);
    }
  }

  finalizarSimulacion() {
    const stats = this.caja.obtenerEstadisticas(this.tiempoFinal);
    this.estadisticas = {
      ...stats,
      clientesPerdidos: this.totalClientesPerdidos,
      clientesReingresados: this.clientesReingresados,
      clientesReintentadosColaLlena: this.clientesReintentadosColaLlena,
      capacidadMaxima: this.capacidadMaxima || 'sin límite',
      maxReintentos: this.maxReintentos,
      reintentosColaLlenaActivo: this.reintentosColaLlenaActivo
    };
  }
}
