# React Flow - Agent AI Canvas

Aplicación estilo n8n con canvas para nodos orientados a Agent AI construida con React Flow.

## 🚀 Características

- **Canvas interactivo** con React Flow para crear flujos de trabajo de Agent AI
- **Nodos personalizados**:
  - **Trigger Node**: Nodo de inicio que activa el flujo
  - **Agent Node**: Nodo de procesamiento con IA
  - **Action Node**: Nodo de acción para ejecutar tareas
- **Interfaz estilo n8n** con diseño moderno y limpio
- **Controles de navegación**: Zoom, pan, minimap
- **Conexiones animadas** entre nodos

## 📦 Instalación

El proyecto ya tiene React Flow instalado. Para iniciar:

```bash
npm install
npm start
```

La aplicación se abrirá en [http://localhost:3000](http://localhost:3000)

## 🏗️ Estructura del Proyecto

```
src/
├── components/
│   └── FlowCanvas.js      # Componente principal del canvas
├── nodes/
│   ├── TriggerNode.js     # Nodo de trigger
│   ├── AgentNode.js       # Nodo de agente AI
│   ├── ActionNode.js      # Nodo de acción
│   └── NodeStyles.css     # Estilos para los nodos
├── App.js                 # Componente principal
└── index.js               # Punto de entrada
```

## 🎨 Uso

### Nodos Disponibles

1. **Trigger Node** (Verde)
   - Nodo de inicio del flujo
   - Tiene un handle de salida (source)
   - Ejemplo: Webhook Trigger

2. **Agent Node** (Morado)
   - Nodo de procesamiento con IA
   - Tiene handles de entrada y salida
   - Puede incluir información del modelo (ej: GPT-4)

3. **Action Node** (Azul)
   - Nodo de acción final
   - Tiene handles de entrada y salida
   - Puede incluir tipo de acción

### Interacciones

- **Arrastrar nodos**: Click y arrastra para mover nodos
- **Conectar nodos**: Arrastra desde un handle de salida a un handle de entrada
- **Seleccionar nodos**: Click en un nodo para seleccionarlo
- **Zoom**: Usa la rueda del mouse o los controles
- **Pan**: Click y arrastra en el canvas vacío

## 🔧 Personalización

### Agregar Nuevos Nodos

1. Crea un nuevo componente en `src/nodes/`
2. Importa `Handle` y `Position` de `@xyflow/react`
3. Usa los estilos de `NodeStyles.css`
4. Regístralo en `FlowCanvas.js` en el objeto `nodeTypes`

### Modificar Nodos Existentes

Edita los archivos en `src/nodes/` para personalizar la apariencia y funcionalidad de los nodos.

## 📚 Documentación

- [React Flow Documentation](https://reactflow.dev/learn)
- [React Flow API Reference](https://reactflow.dev/api-reference/react-flow)

## 🛠️ Tecnologías

- React 19
- React Flow (@xyflow/react) 12.10.0
- Create React App

## 📝 Próximos Pasos

- [ ] Agregar panel lateral para agregar nuevos nodos
- [ ] Implementar guardado/carga de flujos
- [ ] Agregar validación de conexiones
- [ ] Implementar ejecución de flujos
- [ ] Agregar más tipos de nodos (Condition, Loop, etc.)
