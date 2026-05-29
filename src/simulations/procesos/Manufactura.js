import { Simulation } from '../base/Simulation.js';
import { Queue } from '../base/Queue.js';
import { distribucionExponencial, distribucionNormal } from '../../utils/estadisticas.js';

export class ManufacturaProcess extends Simulation {
  constructor(config) {
    super('Línea de Producción');
    this.tiempoLlegadaBase = config.tiempoLlegada || 5;
    this.numEstaciones = config.numEstaciones || 3;
    this.numTrabajadoresPorEstacion = config.numTrabajadoresPorEstacion || Array(this.numEstaciones).fill(1);
    this.tiemposEstacion = config.tiemposEstacion || [];
    if (this.tiemposEstacion.length === 0) {
      for (let i = 0; i < this.numEstaciones; i++) this.tiemposEstacion.push({ media: 4, desviacion: 1 });
    }
    this.tamanioLote = 1;  // Sin lotes
    this.capacidadProduccionMaxima = config.capacidadProduccionMaxima || null;
    this.capacidadAlmacen = config.capacidadAlmacen || null;
    this.fallasActivo = config.fallasActivo || false;
    this.probabilidadFalla = config.probabilidadFalla || Array(this.numEstaciones).fill(0);
    this.tiempoReparacion = config.tiempoReparacion || Array(this.numEstaciones).fill(10);
    this.defectosActivo = config.defectosActivo || false;
    this.probabilidadDefecto = config.probabilidadDefecto || Array(this.numEstaciones).fill(0);
    this.reprocesarDefectuosos = config.reprocesarDefectuosos || false;
    // Forzar horas pico a vacío e ignorar
    this.horasPico = [];
    this.estaciones = [];
    for (let i = 0; i < this.numEstaciones; i++) this.estaciones.push(new Queue(`Estación ${i + 1}`, 1));
    this.unidadesProducidas = 0;
    this.unidadesDefectuosas = 0;
    this.unidadesReprocesadas = 0;
    this.unidadesPerdidasPorAlmacen = 0;
    this.fallasRegistradas = Array(this.numEstaciones).fill(0);
    this.tiempoMuertoPorFalla = Array(this.numEstaciones).fill(0);
  }

  obtenerFactorHoraPico() {
    // Siempre devuelve 1.0 para ignorar horas pico
    return 1.0;
  }

  obtenerTiempoEntreLlegadas() {
    return this.tiempoLlegadaBase / this.obtenerFactorHoraPico();
  }

  inicializar() {
    this.estaciones.forEach(e => e.limpiar());
    this.unidadesProducidas = 0;
    this.unidadesDefectuosas = 0;
    this.unidadesReprocesadas = 0;
    this.unidadesPerdidasPorAlmacen = 0;
    this.fallasRegistradas.fill(0);
    this.tiempoMuertoPorFalla.fill(0);
    this.programarProximaLlegada();
  }

  programarProximaLlegada() {
    const tiempo = this.obtenerTiempoEntreLlegadas();
    this.programarEvento(this.tiempoActual + tiempo, this.llegadaUnidad.bind(this));
  }

  llegadaUnidad() {
    if (this.capacidadProduccionMaxima !== null && this.unidadesProducidas >= this.capacidadProduccionMaxima) return;
    const unidadId = this.estaciones[0].clientesLlegados + 1;
    const unidad = {
      id: unidadId,
      tiempoLlegada: this.tiempoActual,
      estacionActual: 0,
      defectuosa: false
    };
    this.enviarUnidadPrimeraEstacion(unidad);
    this.programarProximaLlegada();
  }

  enviarUnidadPrimeraEstacion(unidad) {
    const estacion = this.estaciones[0];
    if (this.capacidadAlmacen !== null && estacion.entidadesEnEspera.length >= this.capacidadAlmacen) {
      this.unidadesPerdidasPorAlmacen++;
      return;
    }
    estacion.llegarEntidad(unidad, this.tiempoActual);
    if (unidad.tiempoInicio === this.tiempoActual) {
      this.procesarUnidad(unidad, 0);
    }
  }

  procesarUnidad(unidad, idxEstacion) {
    const estacion = this.estaciones[idxEstacion];
    const cfg = this.tiemposEstacion[idxEstacion];
    let tiempoBase = distribucionNormal(cfg.media, cfg.desviacion);
    tiempoBase = Math.max(0.5, tiempoBase);
    const trabajadores = this.numTrabajadoresPorEstacion[idxEstacion] || 1;
    const tiempoServicio = tiempoBase / trabajadores;

    if (this.fallasActivo && Math.random() < this.probabilidadFalla[idxEstacion]) {
      const duracionReparacion = distribucionExponencial(1 / this.tiempoReparacion[idxEstacion]);
      this.fallasRegistradas[idxEstacion]++;
      this.tiempoMuertoPorFalla[idxEstacion] += duracionReparacion;
      this.programarEvento(this.tiempoActual + duracionReparacion, this.reanudarServicio.bind(this), { unidad, idxEstacion, tiempoServicio });
      return;
    }
    this.programarEvento(this.tiempoActual + tiempoServicio, this.finProcesamiento.bind(this), { unidad, idxEstacion, tiempoServicio });
  }

  reanudarServicio(sim, datos) {
    const { unidad, idxEstacion, tiempoServicio } = datos;
    this.programarEvento(this.tiempoActual + tiempoServicio, this.finProcesamiento.bind(this), { unidad, idxEstacion, tiempoServicio });
  }

  finProcesamiento(sim, datos) {
    const { unidad, idxEstacion, tiempoServicio } = datos;
    const estacion = this.estaciones[idxEstacion];
    let esDefectuosa = false;
    if (this.defectosActivo && Math.random() < this.probabilidadDefecto[idxEstacion]) {
      esDefectuosa = true;
      this.unidadesDefectuosas++;
    }
    unidad.defectuosa = esDefectuosa;

    const siguienteUnidad = estacion.liberarServidor(unidad, tiempoServicio, this.tiempoActual);
    if (siguienteUnidad) this.procesarUnidad(siguienteUnidad, idxEstacion);

    const esUltimaEstacion = (idxEstacion + 1 >= this.numEstaciones);
    if (esUltimaEstacion && !esDefectuosa) {
      this.unidadesProducidas++;
    } else if (!esUltimaEstacion && !esDefectuosa) {
      const nuevaUnidad = { ...unidad, estacionActual: idxEstacion + 1, tiempoLlegada: this.tiempoActual };
      const siguienteEstacion = this.estaciones[idxEstacion + 1];
      if (this.capacidadAlmacen !== null && siguienteEstacion.entidadesEnEspera.length >= this.capacidadAlmacen) {
        this.unidadesPerdidasPorAlmacen++;
      } else {
        siguienteEstacion.llegarEntidad(nuevaUnidad, this.tiempoActual);
        if (nuevaUnidad.tiempoInicio === this.tiempoActual) {
          this.procesarUnidad(nuevaUnidad, idxEstacion + 1);
        }
      }
    } else if (esDefectuosa && this.reprocesarDefectuosos) {
      this.unidadesReprocesadas++;
      const nuevaUnidad = { ...unidad, estacionActual: 0, tiempoLlegada: this.tiempoActual, defectuosa: false };
      const primeraEstacion = this.estaciones[0];
      if (this.capacidadAlmacen !== null && primeraEstacion.entidadesEnEspera.length >= this.capacidadAlmacen) {
        this.unidadesPerdidasPorAlmacen++;
      } else {
        primeraEstacion.llegarEntidad(nuevaUnidad, this.tiempoActual);
        if (nuevaUnidad.tiempoInicio === this.tiempoActual) {
          this.procesarUnidad(nuevaUnidad, 0);
        }
      }
    }
  }

  finalizarSimulacion() {
    const statsEstaciones = this.estaciones.map((e, i) => ({
      nombre: `Estación ${i+1}`,
      ...e.obtenerEstadisticas(this.tiempoFinal),
      fallas: this.fallasRegistradas[i],
      tiempoMuerto: this.tiempoMuertoPorFalla[i].toFixed(2),
      trabajadores: this.numTrabajadoresPorEstacion[i]
    }));
    this.estadisticas = {
      estaciones: statsEstaciones,
      totalUnidadesProducidas: this.unidadesProducidas,
      totalUnidadesDefectuosas: this.unidadesDefectuosas,
      totalUnidadesReprocesadas: this.unidadesReprocesadas,
      unidadesPerdidasPorAlmacen: this.unidadesPerdidasPorAlmacen,
      capacidadAlmacen: this.capacidadAlmacen === null ? 'sin límite' : this.capacidadAlmacen,
      capacidadProduccionMaxima: this.capacidadProduccionMaxima === null ? 'sin límite' : this.capacidadProduccionMaxima,
      tamanioLote: this.tamanioLote,
      fallasActivo: this.fallasActivo,
      defectosActivo: this.defectosActivo,
      tiempoSimulacionMinutos: this.tiempoFinal
    };
  }
}
