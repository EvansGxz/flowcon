# Reporte: Cambios y Actualizaciones Requeridas en Frontend - AgentCore MVP2

## Resumen Ejecutivo

Con la implementación de AgentCore MVP2, el backend ahora soporta dos modos de ejecución:
- **Modo Secuencial**: Flujos lineales sin agentes (caso de uso principal)
- **Modo AgentCore**: Flujos con `agent.core` que controla dinámicamente las capabilities

Este documento detalla los cambios que el frontend debe contemplar y actualizar.

---

## 🔴 CAMBIOS CRÍTICOS (Obligatorios)

### 1. Campo `execution_mode` en Run

**Cambio:** El modelo `Run` ahora incluye el campo `execution_mode`.

**Ubicación:** `GET /api/v1/runs/{run_id}` y `GET /api/v1/runs`

**Estructura:**
```typescript
interface Run {
  runId: string;
  flow_id: string | null;
  status: "pending" | "running" | "completed" | "error" | "cancelled" | "timeout";
  execution_mode: "sequential" | "agent" | null;  // ⬅️ NUEVO
  started_at: string | null;
  ended_at: string | null;
  trace: NodeRun[];
  result: any;
}
```

**Valores posibles:**
- `"sequential"`: Flujo lineal sin agentes (ejecución tradicional)
- `"agent"`: Flujo con `agent.core` que controla dinámicamente
- `null`: Runs antiguos creados antes de MVP2 (compatibilidad)

**Acción requerida:**
- ✅ Agregar `execution_mode` al tipo/interfaz `Run` en TypeScript
- ✅ Mostrar el modo de ejecución en la UI (opcional pero recomendado)
- ✅ Usar `execution_mode` para determinar cómo visualizar el trace

---

### 2. NodeRun por Iteración del AgentCore

**Cambio:** Cada iteración del AgentCore genera un NodeRun separado.

**Estructura del NodeRun de AgentCore:**
```typescript
interface NodeRun {
  runId: string;
  nodeId: string;  // ID del agent.core
  status: "success" | "error" | "skipped";
  startedAt: string;
  durationMs: number;
  input: any;
  output: {
    iteration: number;           // ⬅️ NUEVO: número de iteración
    action: {                     // ⬅️ NUEVO: acción decidida
      type: "llm" | "memory" | "tool" | "response" | "end";
      capability_id: string;
      capability_type: string;
      reasoning: string;
      confidence: number;          // ⬅️ NUEVO: 0.0-1.0
    };
    should_continue: boolean;      // ⬅️ NUEVO
  };
  error: any;
}
```

**Implicaciones:**
- El mismo `nodeId` (agent.core) puede aparecer múltiples veces en el trace
- Cada aparición representa una iteración diferente
- El `output.iteration` indica el número de iteración
- El `output.action` muestra qué capability decidió invocar

**Acción requerida:**
- ✅ Actualizar visualización del trace para mostrar iteraciones del AgentCore
- ✅ Agrupar NodeRuns del mismo `nodeId` si es `agent.core` y mostrar como "Iteración N"
- ✅ Mostrar `confidence` en la UI (opcional pero útil para debugging)
- ✅ Mostrar `reasoning` para entender por qué el agente tomó esa decisión

**Ejemplo de visualización:**
```
Trace:
  - trigger.manual (success)
  - agent.core [Iteración 1] (success)
    → Decisión: llm -> llm1 (confidence: 0.85)
    → Reasoning: "Necesito generar respuesta usando LLM"
  - model.llm (success)  [invocado por agent.core]
  - agent.core [Iteración 2] (success)
    → Decisión: response -> chat1 (confidence: 0.90)
    → Reasoning: "Tengo la respuesta, debo enviarla al usuario"
  - response.chat (success)  [invocado por agent.core]
```

---

### 3. Contexto Namespaceado `ctx["agent"]`

**Cambio:** El contexto del AgentCore ahora está namespaceado en `ctx["agent"]`.

**Estructura:**
```typescript
interface ExecutionContext {
  input: any;
  vars: any;
  agent?: {                    // ⬅️ NUEVO: namespace del AgentCore
    next_action: {
      type: string;
      capability_id: string;
      capability_type: string;
      reasoning: string;
      confidence: number;
    };
    should_continue: boolean;
    iteration: number;
    previous_actions: Array<{
      iteration: number;
      action: string;
      capability_id: string;
      confidence: number;
    }>;
    max_iterations: number;
    started_at: string;
  };
  output: any;
}
```

**Acción requerida:**
- ✅ Si el frontend muestra el `execution_context`, actualizar para mostrar `ctx["agent"]` separado
- ✅ No es crítico si el frontend no muestra el contexto interno

---

## 🟡 CAMBIOS IMPORTANTES (Recomendados)

### 4. Validación de Grafos con AgentCore

**Cambio:** La validación ahora incluye reglas específicas para grafos con `agent.core`.

**Nuevos códigos de error:**
- `MULTIPLE_AGENT_CORES`: El grafo tiene más de un `agent.core` (MVP solo permite 1)
- `CAPABILITY_NOT_CONNECTED`: Una capability no está conectada al `agent.core`

**Acción requerida:**
- ✅ Mostrar mensajes de error específicos para estos códigos
- ✅ Validar en el frontend antes de enviar (opcional pero recomendado):
  - Máximo 1 `agent.core` por grafo
  - Todas las capabilities (`model.llm`, `memory.kv`, `tool.http`, `tool.postgres`) deben tener edge desde `agent.core`

---

### 5. Visualización de Flujos con AgentCore

**Cambio:** Los flujos con `agent.core` tienen una estructura diferente.

**Estructura típica:**
```
trigger.manual → agent.core → [capabilities conectadas]
                                ├─ model.llm
                                ├─ tool.http
                                ├─ memory.kv
                                └─ response.chat
```

**Acción requerida:**
- ✅ Visualizar `agent.core` como nodo central que controla las capabilities
- ✅ Mostrar edges desde `agent.core` a las capabilities
- ✅ Indicar visualmente que `agent.core` "controla" las capabilities (no ejecuta directamente)
- ✅ Opcional: Mostrar modo de ejecución en el editor de flujos

---

### 6. Polling y Estado de Ejecución

**Cambio:** Los runs con `execution_mode: "agent"` pueden tener múltiples NodeRuns del mismo `agent.core`.

**Acción requerida:**
- ✅ El polling a `GET /runs/{id}` sigue funcionando igual
- ✅ El trace puede crecer durante la ejecución (múltiples iteraciones)
- ✅ Mostrar progreso de iteraciones si `execution_mode === "agent"`

**Ejemplo de UI:**
```typescript
if (run.execution_mode === "agent") {
  const agentIterations = trace.filter(nr => nr.nodeId === "agent.core-id");
  const currentIteration = agentIterations.length;
  const maxIterations = 50;
  
  // Mostrar: "Iteración 3/50"
}
```

---

## 🟢 CAMBIOS OPCIONALES (Mejoras UX)

### 7. Indicador de Modo de Ejecución

**Sugerencia:** Mostrar el modo de ejecución en la UI.

**Ejemplo:**
```typescript
// Badge en la lista de runs
{run.execution_mode === "agent" && (
  <Badge color="blue">Agent Mode</Badge>
)}
{run.execution_mode === "sequential" && (
  <Badge color="gray">Sequential Mode</Badge>
)}
```

---

### 8. Visualización de Confidence

**Sugerencia:** Mostrar el `confidence` del AgentCore en la UI.

**Ejemplo:**
```typescript
// En el trace, mostrar confidence
{nodeRun.output?.action?.confidence && (
  <Tooltip title={`Confidence: ${(nodeRun.output.action.confidence * 100).toFixed(0)}%`}>
    <Icon color={nodeRun.output.action.confidence > 0.7 ? "green" : "orange"} />
  </Tooltip>
)}
```

---

### 9. Historial de Acciones del Agente

**Sugerencia:** Mostrar el historial de decisiones del agente.

**Ejemplo:**
```typescript
// Panel lateral con historial
{run.execution_mode === "agent" && (
  <AgentHistoryPanel>
    {trace
      .filter(nr => nr.nodeId === "agent.core-id")
      .map((nr, idx) => (
        <HistoryItem key={idx}>
          Iteración {nr.output.iteration}: {nr.output.action.type}
          → {nr.output.action.capability_id}
          (confidence: {(nr.output.action.confidence * 100).toFixed(0)}%)
        </HistoryItem>
      ))}
  </AgentHistoryPanel>
)}
```

---

## ✅ LO QUE SE MANTIENE (Sin Cambios)

### 1. Contrato API Básico

- ✅ `POST /runs` sigue retornando solo `runId` y `status`
- ✅ `GET /runs/{id}` sigue siendo la única fuente de verdad
- ✅ El frontend no asume ejecución exitosa (sigue verificando `status`)
- ✅ Los IDs de nodos no se regeneran
- ✅ El trace siempre se mapea por `nodeId`
- ✅ Auto-layout solo toca `ui.x / ui.y`

### 2. Estructura de NodeRun

- ✅ La estructura básica de `NodeRun` se mantiene
- ✅ Campos: `runId`, `nodeId`, `status`, `startedAt`, `durationMs`, `input`, `output`, `error`
- ✅ Solo se agregan campos nuevos en `output` para NodeRuns de `agent.core`

### 3. Estados de Run

- ✅ Estados: `"pending"`, `"running"`, `"completed"`, `"error"`, `"cancelled"`, `"timeout"`
- ✅ Sin cambios en la lógica de estados

---

## 📋 Checklist de Implementación Frontend

### Críticos (Obligatorios)
- [ ] Agregar `execution_mode` al tipo/interfaz `Run`
- [ ] Actualizar visualización del trace para mostrar iteraciones del AgentCore
- [ ] Manejar múltiples NodeRuns del mismo `nodeId` cuando es `agent.core`
- [ ] Mostrar `output.iteration` y `output.action` en NodeRuns de AgentCore

### Importantes (Recomendados)
- [ ] Mostrar mensajes de error específicos para validación de AgentCore
- [ ] Validar en frontend: máximo 1 `agent.core` por grafo
- [ ] Validar en frontend: capabilities conectadas al `agent.core`
- [ ] Visualizar `agent.core` como nodo central que controla capabilities
- [ ] Mostrar progreso de iteraciones en runs con `execution_mode: "agent"`

### Opcionales (Mejoras UX)
- [ ] Indicador de modo de ejecución en la UI
- [ ] Visualización de `confidence` en decisiones del agente
- [ ] Panel de historial de acciones del agente
- [ ] Tooltips explicativos sobre el modo AgentCore

---

## 🔍 Ejemplos de Código TypeScript

### Tipo Run Actualizado

```typescript
interface Run {
  runId: string;
  flow_id: string | null;
  status: "pending" | "running" | "completed" | "error" | "cancelled" | "timeout";
  execution_mode: "sequential" | "agent" | null;  // NUEVO
  started_at: string | null;
  ended_at: string | null;
  trace: NodeRun[];
  result: any;
}

interface NodeRun {
  runId: string;
  nodeId: string;
  status: "success" | "error" | "skipped";
  startedAt: string;
  durationMs: number;
  input: any;
  output: any;  // Para agent.core: { iteration, action, should_continue }
  error: any;
}

interface AgentAction {
  type: "llm" | "memory" | "tool" | "response" | "end";
  capability_id: string;
  capability_type: string;
  reasoning: string;
  confidence: number;  // 0.0-1.0
}
```

### Función para Agrupar Iteraciones

```typescript
function groupAgentCoreIterations(trace: NodeRun[], agentCoreId: string) {
  return trace
    .filter(nr => nr.nodeId === agentCoreId)
    .map(nr => ({
      iteration: nr.output?.iteration ?? 0,
      action: nr.output?.action,
      shouldContinue: nr.output?.should_continue ?? false,
      nodeRun: nr
    }))
    .sort((a, b) => a.iteration - b.iteration);
}
```

### Componente de Visualización

```typescript
function TraceView({ run }: { run: Run }) {
  const isAgentMode = run.execution_mode === "agent";
  const agentCoreId = run.trace.find(nr => nr.nodeId.includes("agent.core"))?.nodeId;
  
  return (
    <div>
      {run.trace.map((nodeRun, idx) => {
        const isAgentCore = nodeRun.nodeId === agentCoreId;
        const isIteration = isAgentMode && isAgentCore;
        
        return (
          <TraceItem key={idx}>
            {isIteration && (
              <Badge>Iteración {nodeRun.output?.iteration}</Badge>
            )}
            <NodeName>{nodeRun.nodeId}</NodeName>
            {isIteration && nodeRun.output?.action && (
              <ActionInfo>
                → {nodeRun.output.action.type} ({nodeRun.output.action.capability_id})
                {nodeRun.output.action.confidence && (
                  <ConfidenceBadge>
                    {(nodeRun.output.action.confidence * 100).toFixed(0)}%
                  </ConfidenceBadge>
                )}
              </ActionInfo>
            )}
          </TraceItem>
        );
      })}
    </div>
  );
}
```

---

## 📝 Notas Finales

1. **Compatibilidad hacia atrás**: Los runs antiguos sin `execution_mode` seguirán funcionando (`null`)

2. **Detección automática**: El backend detecta automáticamente el modo según la presencia de `agent.core`

3. **Sin breaking changes**: Los endpoints y estructuras básicas se mantienen, solo se agregan campos nuevos

4. **Testing**: Probar especialmente:
   - Flujos lineales sin agentes (deben funcionar igual que antes)
   - Flujos con `agent.core` (nuevo comportamiento)
   - Visualización de múltiples iteraciones del mismo `agent.core`

---

**Última actualización:** 2025-01-30
**Versión Backend:** MVP2 (AgentCore Architecture)

