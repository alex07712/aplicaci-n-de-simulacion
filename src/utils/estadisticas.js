/**
 * Utilidades para generar números aleatorios según distribuciones
 */

export function distribucionExponencial(lambda) {
  return -Math.log(1 - Math.random()) / lambda;
}

export function distribucionNormal(media = 0, desviacion = 1) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return media + z0 * desviacion;
}

export function distribucionUniforme(min, max) {
  return min + Math.random() * (max - min);
}

export function distribucionTriangular(minimo, moda, maximo) {
  const u = Math.random();
  const c = (moda - minimo) / (maximo - minimo);
  if (u < c) {
    return minimo + Math.sqrt(u * (maximo - minimo) * (moda - minimo));
  } else {
    return maximo - Math.sqrt((1 - u) * (maximo - minimo) * (maximo - moda));
  }
}

export function calcularEstadisticas(datos) {
  if (datos.length === 0) return null;
  const suma = datos.reduce((a, b) => a + b, 0);
  const promedio = suma / datos.length;
  const varianza = datos.reduce((acc, val) => acc + Math.pow(val - promedio, 2), 0) / datos.length;
  const desviacion = Math.sqrt(varianza);
  const ordenados = [...datos].sort((a, b) => a - b);
  const mediana = datos.length % 2 === 0
    ? (ordenados[datos.length / 2 - 1] + ordenados[datos.length / 2]) / 2
    : ordenados[Math.floor(datos.length / 2)];
  return {
    promedio: parseFloat(promedio.toFixed(2)),
    minimo: Math.min(...datos),
    maximo: Math.max(...datos),
    mediana: parseFloat(mediana.toFixed(2)),
    desviacion: parseFloat(desviacion.toFixed(2)),
    varianza: parseFloat(varianza.toFixed(2)),
  };
}

export function generarIntervalos(datos, numIntervalos = 10) {
  if (datos.length === 0) return [];
  const min = Math.min(...datos);
  const max = Math.max(...datos);
  const anchura = (max - min) / numIntervalos;
  const intervalos = Array(numIntervalos).fill(0);
  const etiquetas = [];
  datos.forEach(valor => {
    const indice = Math.min(Math.floor((valor - min) / anchura), numIntervalos - 1);
    intervalos[indice]++;
  });
  for (let i = 0; i < numIntervalos; i++) {
    const inicio = (min + i * anchura).toFixed(2);
    const fin = (min + (i + 1) * anchura).toFixed(2);
    etiquetas.push(`${inicio}-${fin}`);
  }
  return { intervalos, etiquetas };
}