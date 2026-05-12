# 🎯 Simulador de Procesos - ProModel Style

Un simulador de eventos discretos tipo **ProModel** para simular procesos de colas, manufactura y servicios. Construido con **React**, **Tailwind CSS** y una lógica de simulación personalizada.

## 📋 Características

✅ **3 Procesos Predefinidos:**
- **M/M/1**: Cola simple con un servidor (ej: caja registradora)
- **Manufactura**: Línea de montaje con múltiples estaciones en serie
- **Urgencias Hospital**: Departamento de urgencias con triaje, médicos y enfermeras

✅ **Parámetros Ajustables:**
- Tasas de llegada
- Tasas de servicio
- Número de recursos
- Tiempo de simulación

✅ **Resultados Detallados:**
- Estadísticas por proceso
- Gráficos y métricas
- Análisis de utilización
- Recomendaciones de optimización

✅ **Interfaz Moderna:**
- Diseño responsivo con Tailwind CSS
- Controles intuitivos
- Visualización clara de resultados

## 🚀 Instalación

### Requisitos
- Node.js 16+ 
- npm o yarn

### Pasos

```bash
# 1. Navega al directorio del proyecto
cd simulador-procesos

# 2. Instala las dependencias
npm install

# 3. Inicia el servidor de desarrollo
npm run dev

# 4. Abre en tu navegador
# http://localhost:5173
```

## 📁 Estructura del Proyecto

```
simulador-procesos/
├── src/
│   ├── components/
│   │   ├── SimuladorUI.jsx           # Componente principal
│   │   ├── SelectorProceso.jsx       # Selector de procesos
│   │   ├── ControlesSimulacion.jsx   # Controles y parámetros
│   │   └── ResultadosSimulacion.jsx  # Mostrador de resultados
│   │
│   ├── simulations/
│   │   ├── base/
│   │   │   ├── Simulation.js         # Clase base de simulación
│   │   │   └── Queue.js              # Clase para colas
│   │   │
│   │   └── procesos/
│   │       ├── MM1.js                # Proceso M/M/1
│   │       ├── Manufactura.js        # Proceso de manufactura
│   │       ├── UrgenciasHospital.js  # Proceso de urgencias
│   │       └── index.js              # Índice de procesos
│   │
│   ├── utils/
│   │   └── estadisticas.js           # Funciones estadísticas
│   │
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
│
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── README.md
```

## 🎮 Uso

### 1. Selecciona un proceso
En el panel izquierdo, haz clic en uno de los 3 procesos disponibles.

### 2. Ajusta los parámetros
Usa los controles deslizantes y menús desplegables para configurar:
- Tasa de llegada
- Recursos disponibles
- Tiempo de simulación

### 3. Ejecuta la simulación
Haz clic en **"▶️ Ejecutar Simulación"** y espera a que termine.

### 4. Analiza los resultados
Observa:
- Clientes procesados
- Tiempos de espera
- Utilización de recursos
- Cuellos de botella

## 📊 Procesos Disponibles

### M/M/1 - Cola Simple
Perfecto para simular:
- Cajas registradoras
- Atención al cliente
- Peajes
- Cines

**Parámetros:**
- Tasa de llegada (0.1-3 clientes/min)
- Tasa de servicio (0.2-5 clientes/min)

---

### Manufactura - Línea de Montaje
Perfecto para simular:
- Líneas de producción
- Cadenas de empaquetado
- Procesos de ensamble
- Plantas industriales

**Características:**
- 3, 4 o 5 estaciones
- Procesamiento en serie
- Análisis por estación

---

### Urgencias Hospital
Perfecto para simular:
- Departamentos de urgencias
- Procesos médicos
- Gestión de personal
- Optimización de recursos

**Flujo:**
1. Llegada de paciente
2. Triaje (clasificación)
3. Atención médica
4. Enfermería
5. Salida

## 🔧 Agregar Nuevos Procesos

Para crear un nuevo proceso:

### 1. Crea un archivo en `src/simulations/procesos/NuevoProceso.js`

```javascript
import { Simulation } from '../base/Simulation.js';
import { Queue } from '../base/Queue.js';
import { distribucionExponencial } from '../../utils/estadisticas.js';

export class NuevoProceso extends Simulation {
  constructor(config) {
    super('Mi Nuevo Proceso');
    // Tus parámetros aquí
  }

  inicializar() {
    // Inicializar colas y recursos
  }

  finalizarSimulacion() {
    // Procesar estadísticas finales
  }
}
```

### 2. Registra el proceso en `src/simulations/procesos/index.js`

```javascript
import { NuevoProceso } from './NuevoProceso.js';

export const PROCESOS_DISPONIBLES = {
  // ... procesos existentes
  
  nuevoProceso: {
    nombre: 'Mi Nuevo Proceso',
    descripcion: 'Descripción del proceso',
    icono: '🎯',
    clase: NuevoProceso,
    parametros: [
      // Define los parámetros aquí
    ]
  }
};
```

## 📈 Distribuciones Disponibles

```javascript
// En utils/estadisticas.js

distribucionExponencial(lambda)    // Para tiempos entre llegadas
distribucionNormal(media, desv)    // Para variabilidad
distribucionUniforme(min, max)     // Para uniformidad
distribucionTriangular(min, moda, max) // Para estimaciones
```

## 🛠️ Personalización

### Cambiar colores
Edita `tailwind.config.js` para personalizar el tema.

### Agregar gráficos
La lógica de simulación almacena todos los datos. Puedes integrar librerías como:
- **Recharts**: Para gráficos interactivos
- **Chart.js**: Para visualizaciones avanzadas
- **D3.js**: Para dashboards complejos

### Exportar resultados
Modifica `ResultadosSimulacion.jsx` para exportar a CSV o Excel.

## 🎓 Conceptos Clave

### Distribución Exponencial
Para tiempos entre llegadas (tasa de Poisson):
```javascript
λ = 0.5  // 0.5 clientes por minuto
tiempo = -ln(U) / λ
```

### Rho (ρ) - Factor de Utilización
```
ρ = λ / μ

ρ < 1   → Sistema estable
ρ > 1   → Sistema saturado
ρ ≈ 1   → Sistema al límite
```

### Métricas Importantes
- **Lq**: Largo promedio de cola
- **Ls**: Largo promedio del sistema
- **Wq**: Tiempo promedio en cola
- **Ws**: Tiempo promedio en sistema

## 🐛 Troubleshooting

### Error: "Cannot find module"
```bash
npm install
```

### Puerto 5173 ya está en uso
```bash
npm run dev -- --port 3000
```

### Simulación muy lenta
Reduce el tiempo de simulación o ajusta los parámetros.

## 📝 Licencia

Libre para uso educativo y comercial.

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Para agregar nuevos procesos o mejorar la interfaz:

1. Crea un nuevo proceso siguiendo la estructura
2. Pruébalo completamente
3. Documenta los parámetros
4. Envía un PR

## 📧 Contacto

Para preguntas o sugerencias, abre un issue en GitHub.

---

**Hecho con ❤️ para ingenieros y estudiantes de simulación**