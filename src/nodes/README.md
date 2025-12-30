# Estructura de Nodos

## Arquitectura

El sistema de nodos sigue el patrón de **separación de concerns** estilo n8n:

### 1. Componentes de UI (`src/nodes/`)
**Componentes React genéricos que renderizan la apariencia visual:**

- `TriggerNode.js` - Renderiza nodos tipo trigger (verde)
- `AgentNode.js` - Renderiza nodos tipo agente (morado)  
- `ActionNode.js` - Renderiza nodos tipo acción/herramienta (azul)

**Características:**
- Son componentes **reutilizables** y **genéricos**
- Muestran la UI visual (iconos, badges, handles, estados)
- Obtienen metadata desde las **definiciones** usando `getNodeDefinition()`
- Soportan vista compacta y vista completa

### 2. Definiciones de Nodos (`src/nodes/definitions/`)
**Metadata y lógica de negocio de cada tipo de nodo:**

- `registry.js` - Registro central de todas las definiciones
- `NodeDefinition.js` - Clase base para definiciones
- Cada definición incluye:
  - `typeId` - Identidad única (ej: `ap.agent.core`)
  - `displayName` - Nombre para mostrar (ej: "Agent Core")
  - `name` - Nombre técnico para React Flow (ej: `agent_core`)
  - `properties` - Esquema de configuración
  - `inputs/outputs` - Puertos de conexión
  - `defaults` - Valores por defecto
  - `migrate` - Funciones de migración de versiones

### 3. Mapeo en FlowCanvas
**Conecta nombres técnicos con componentes React:**

```javascript
const nodeTypes = {
  agent_core: AgentNode,      // "Agent Core" → usa AgentNode
  manual_trigger: TriggerNode, // "Manual Trigger" → usa TriggerNode
  tool_http: ActionNode,      // "HTTP Tool" → usa ActionNode
  tool_postgres: ActionNode,  // "Postgres Tool" → usa ActionNode
  // ...
};
```

## Ejemplo: Agent Core

### `ap.agent.core` (REDMIND Contract)
- **typeId**: `ap.agent.core`
- **displayName**: "Agent Core"
- **name**: `agent_core`
- **Propiedades**: `strategy`, `instructions`
- **Uso**: Según contrato REDMIND MVP1
- **Componente**: `AgentNode.js`

## Flujo de Datos

```
1. Usuario crea nodo → createNodeInstance('ap.agent.core', ...)
2. Se obtiene definición → nodeRegistry.get('ap.agent.core')
3. Se crea instancia React Flow → { type: 'agent_core', data: {...} }
4. FlowCanvas mapea → nodeTypes['agent_core'] = AgentNode
5. AgentNode renderiza → Obtiene metadata de definition para mostrar UI
```

## ¿Por qué esta separación?

✅ **Ventajas:**
- **Reutilización**: Un solo componente UI puede renderizar múltiples tipos de nodos
- **Mantenibilidad**: Cambios en UI no afectan lógica de negocio
- **Escalabilidad**: Fácil agregar nuevos tipos sin crear nuevos componentes
- **Consistencia**: Todos los nodos de una categoría se ven igual

✅ **Sigue el patrón n8n:**
- Definiciones = "Node Base Files" (metadata + schema)
- Componentes = Renderers genéricos por categoría

## Recomendación

La estructura actual es **correcta y escalable**. Los componentes genéricos (`AgentNode`, `TriggerNode`, `ActionNode`) son suficientes para la mayoría de casos.

Solo crear componentes específicos si:
- Necesitas UI completamente diferente (ej: un nodo de gráfico)
- Necesitas interacciones especiales (ej: drag & drop interno)
- El componente genérico no puede representar el nodo adecuadamente

