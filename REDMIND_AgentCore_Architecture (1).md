# REDMIND – Arquitectura de Nodos de Agente (AgentCore + Capabilities)
_Documento técnico para Backend y Frontend_

Fecha: 2025-01-30  
Versión: v2.0 (MVP2 + Preparación Temporal)  
Estado: Aprobado para implementación MVP2

---

## 1. Objetivo

Definir la arquitectura oficial de nodos de agente en REDMIND, alineada a n8n,
orientada a sistemas de agentes y preparada para migración a Temporal.

Este diseño:
- evita duplicación de handlers
- evita edges artificiales
- centraliza la lógica en un solo nodo inteligente
- prepara la migración a Temporal sin cambios en el grafo

---

## 2. Regla de oro

**Solo el nodo `agent.core` toma decisiones.**

Todos los demás nodos son *capabilities pasivas*:
- no controlan flujo
- no encadenan ejecución
- solo exponen una capacidad

**Excepción MVP1.2:** Actualmente el runner ejecuta secuencialmente basado en edges.  
**MVP2:** AgentCore tomará control completo del flujo.

---

## 3. AgentCoreNode (`agent.core`)

### Rol
Orquestador cognitivo del agente.

### Estado Actual (MVP1.2)
- ✅ Implementado con heurística simple por keywords
- ✅ Produce `vars.intent` y `vars.params`
- ⚠️ **Limitación:** No controla el flujo aún, el runner ejecuta secuencialmente

### Responsabilidades (MVP2)
- Mantener el contexto de ejecución
- Decidir acciones (plan / act / react)
- Invocar capabilities conectadas dinámicamente
- Interpretar resultados
- Controlar el loop interno
- Decidir cuándo terminar

### No debe
- Llamar APIs directamente
- Acceder DB directamente
- Renderizar respuestas
- Depender de edges para determinar flujo

### Config (Schema)
```json
{
  "type": "agent.core",
  "config": {
    "strategy": "reactive",  // enum: ["reactive"]
    "instructions": "string" // Instrucciones del agente
  }
}
```

### Implementación MVP2 (Plan)
```python
def execute_agent_core(node: Node, ctx: Dict[str, Any], graph: GraphDefinition) -> Dict[str, Any]:
    """
    Ejecuta agent.core con control completo del flujo.
    
    MVP2: AgentCore decide qué capability invocar basado en:
    - Contexto actual
    - Capabilities disponibles (edges conectados)
    - Instrucciones del agente
    
    Returns:
        Contexto actualizado con vars._next_action y vars._should_continue
    """
    # 1. Analizar contexto
    # 2. Decidir acción (usando LLM o heurística mejorada)
    # 3. Invocar capability correspondiente
    # 4. Actualizar contexto
    # 5. Decidir si continuar o terminar
    pass
```

---

## 4. Capability Nodes

| Tipo | Rol |
|----|----|
| model.llm | Conector a modelo |
| memory.kv | Lectura/escritura de memoria |
| tool.http | Llamadas HTTP |
| tool.postgres | Consultas SQL |
| response.chat | Render de salida |
| response.end | Cierre del run |

### Propiedades comunes
- Un solo handler
- Un solo edge visible
- Sin lógica de control

---

## 5. Significado de los edges

Un edge **NO representa ejecución secuencial**.

Representa:
> “Esta capacidad está disponible para el agente”

Ejemplo correcto:

agent.core → model.llm  
agent.core → memory.kv  
agent.core → tool.http  

---

## 6. Ejecución real (backend)

### Estado Actual (MVP1.2) - Ejecución Secuencial

El runner ejecuta nodos secuencialmente basado en edges:

```python
# app/kernel/runner.py - run_graph()
node_id = graph.start
while node_id:
    node = idx_nodes[node_id]
    result = execute_node(node, ctx, run_id)
    ctx = result.next_ctx
    
    # Determinar siguiente nodo por edges
    outgoing = idx_edges.get(node_id, [])
    if outgoing:
        node_id = outgoing[0]  # Primer edge saliente
    else:
        node_id = None
```

**Limitación:** AgentCore no controla el flujo, solo procesa contexto.

### MVP2 - AgentCore Controla Flujo

```python
# Pseudo-código para MVP2
context = initialize_context(input_data)
agent_core_node = find_agent_core(graph)
capabilities = get_connected_capabilities(agent_core_node, graph)

while agent_should_continue(context):
    # AgentCore decide acción
    action = agent_decide(context, capabilities, agent_core_node.config)
    
    # Invocar capability correspondiente
    if action.type == "llm":
        capability_node = find_capability_node("model.llm", capabilities)
        result = execute_capability(capability_node, context)
    
    elif action.type == "memory":
        capability_node = find_capability_node("memory.kv", capabilities)
        result = execute_capability(capability_node, context)
    
    elif action.type == "tool":
        capability_node = find_capability_node(action.tool_type, capabilities)
        result = execute_capability(capability_node, context)
    
    # AgentCore interpreta resultado
    context = agent_interpret(result, context)
    
    # AgentCore decide si continuar
    if not context.get("_should_continue", True):
        break
```

**El grafo no dicta orden.**  
**El AgentCore sí.**

---

## 7. Triggers

`trigger.*`:
- inicializan contexto
- arrancan el run
- no participan en el loop del agente

---

## 8. Implicaciones para Frontend

- AgentCore es el nodo central
- Tools/Memory/LLM se conectan solo al AgentCore
- No permitir conexiones arbitrarias entre capabilities
- UX clara: “este agente tiene acceso a estas herramientas”

---

## 9. Implicaciones para Backend

### Validaciones Requeridas (MVP2)

```python
def validate_agent_core_graph(graph: GraphDefinition) -> ValidationResult:
    """
    Valida que el grafo cumple con la arquitectura AgentCore.
    """
    errors = []
    
    # 1. Debe tener exactamente un agent.core
    agent_cores = [n for n in graph.nodes if n.type == "agent.core"]
    if len(agent_cores) == 0:
        errors.append(ValidationError(
            code="NO_AGENT_CORE",
            message="Grafo debe tener al menos un nodo agent.core",
            path="nodes"
        ))
    elif len(agent_cores) > 1:
        errors.append(ValidationError(
            code="MULTIPLE_AGENT_CORES",
            message=f"Grafo tiene {len(agent_cores)} nodos agent.core (máximo 1)",
            path="nodes"
        ))
    
    # 2. Capabilities deben estar conectadas al AgentCore
    agent_core_id = agent_cores[0].id if agent_cores else None
    if agent_core_id:
        capability_types = ["model.llm", "memory.kv", "tool.http", "tool.postgres"]
        for node in graph.nodes:
            if node.type in capability_types:
                # Verificar que hay un edge desde agent.core a esta capability
                has_edge = any(
                    e.source == agent_core_id and e.target == node.id
                    for e in graph.edges
                )
                if not has_edge:
                    errors.append(ValidationError(
                        code="CAPABILITY_NOT_CONNECTED",
                        message=f"Capability '{node.id}' ({node.type}) no está conectada al agent.core",
                        path=f"nodes[{node.id}]"
                    ))
    
    return ValidationResult(ok=len(errors) == 0, errors=errors)
```

### Implementación Backend

- ✅ Resolver AgentCore como único nodo activo (MVP2)
- ✅ Exponer capabilities como handlers
- ✅ Error si:
  - capability no está conectada al AgentCore
  - hay más de un AgentCore
  - AgentCore no está presente en el grafo

---

## 10. Preparación para Temporal

### Mapeo Conceptual

| REDMIND | Temporal | Descripción |
|------|------|-------------|
| AgentCore | Workflow | Orquestador principal, mantiene estado |
| Capability | Activity | Operación atómica ejecutable |
| Context | Workflow State | Estado persistente del agente |
| Loop | Durable Loop | Loop que puede reanudarse |
| Run | Workflow Execution | Instancia de ejecución |

### Migración sin Cambios en el Grafo

El grafo **NO cambia** entre MVP2 y Temporal. Solo el motor de ejecución:

**MVP2 (Actual):**
```python
# Ejecución en memoria, sincrónica
result = run_graph(graph, input_data, run_id, db)
```

**Temporal (Futuro):**
```python
# Ejecución distribuida, durable
@workflow.defn
class AgentCoreWorkflow:
    @workflow.run
    async def run(self, graph: GraphDefinition, input_data: dict) -> dict:
        # Mismo grafo, mismo flujo
        # Pero ejecutado por Temporal
        pass
```

### Ventajas de Temporal

1. **Durabilidad:** Si el worker cae, Temporal reanuda desde el último checkpoint
2. **Escalabilidad:** Workers distribuidos ejecutan Activities
3. **Observabilidad:** UI nativa de Temporal para debugging
4. **Timeouts:** Timeouts a nivel de Workflow y Activity
5. **Retries:** Retries automáticos con backoff

### Plan de Migración

**Fase 1 (MVP2):** Implementar AgentCore con control de flujo
- AgentCore decide acciones
- Capabilities se invocan dinámicamente
- Ejecución aún en memoria

**Fase 2 (MVP3):** Preparar abstracción
- Crear interfaz `ExecutionEngine`
- Implementar `InMemoryEngine` (actual)
- Preparar `TemporalEngine` (stub)

**Fase 3 (MVP4):** Migrar a Temporal
- Implementar `TemporalEngine`
- Migrar workflows existentes
- Mantener compatibilidad con grafos existentes

---

## 11. Anti‑patterns

- Tools encadenándose
- Memory decidiendo flujo
- Dobles handlers
- Edges secuenciales falsos
- Lógica distribuida fuera del AgentCore

---

## 12. Roadmap de Implementación

### MVP1.2 (Actual) ✅
- ✅ AgentCore implementado con heurística simple
- ✅ Ejecución secuencial basada en edges
- ✅ Capabilities básicas funcionando

### MVP2 (Próximo)
- [ ] AgentCore toma control completo del flujo
- [ ] Validación de arquitectura AgentCore
- [ ] Capabilities se invocan dinámicamente
- [ ] Loop interno controlado por AgentCore
- [ ] Tests de integración AgentCore + Capabilities

### MVP3 (Preparación Temporal)
- [ ] Abstracción `ExecutionEngine`
- [ ] `InMemoryEngine` (refactor del actual)
- [ ] `TemporalEngine` (stub/preparación)
- [ ] Documentación de migración

### MVP4 (Temporal)
- [ ] Implementación completa de `TemporalEngine`
- [ ] Migración de workflows existentes
- [ ] UI de observabilidad Temporal
- [ ] Retries y timeouts a nivel Temporal

---

## 13. Ejemplos de Grafos

### Ejemplo Correcto (MVP2)

```json
{
  "id": "agent-example",
  "version": 1,
  "start": "trigger1",
  "nodes": [
    {"id": "trigger1", "type": "trigger.input"},
    {"id": "agent1", "type": "agent.core", "config": {
      "strategy": "reactive",
      "instructions": "Eres un asistente útil"
    }},
    {"id": "llm1", "type": "model.llm", "config": {
      "provider": "openai",
      "model": "gpt-4"
    }},
    {"id": "memory1", "type": "memory.kv"},
    {"id": "http1", "type": "tool.http", "config": {
      "method": "GET",
      "url": "https://api.example.com/data"
    }},
    {"id": "response1", "type": "response.chat", "config": {
      "format": "text"
    }}
  ],
  "edges": [
    {"id": "e1", "source": "trigger1", "target": "agent1"},
    {"id": "e2", "source": "agent1", "target": "llm1"},
    {"id": "e3", "source": "agent1", "target": "memory1"},
    {"id": "e4", "source": "agent1", "target": "http1"},
    {"id": "e5", "source": "agent1", "target": "response1"}
  ]
}
```

**Interpretación:**
- `trigger1` → `agent1`: Inicializa contexto
- `agent1` → `llm1`: AgentCore puede usar LLM
- `agent1` → `memory1`: AgentCore puede usar memoria
- `agent1` → `http1`: AgentCore puede hacer HTTP
- `agent1` → `response1`: AgentCore puede responder

**Ejecución MVP2:**
1. `trigger1` ejecuta → contexto inicializado
2. `agent1` ejecuta → decide usar `llm1`
3. `llm1` ejecuta → resultado agregado al contexto
4. `agent1` ejecuta de nuevo → decide usar `http1`
5. `http1` ejecuta → resultado agregado al contexto
6. `agent1` ejecuta de nuevo → decide usar `response1`
7. `response1` ejecuta → finaliza

---

## 14. Conclusión

Este documento es **normativo para MVP2 y posteriores**.

**Beneficios:**
- ✅ Centraliza la lógica en AgentCore
- ✅ Simplifica el grafo (edges = disponibilidad, no secuencia)
- ✅ Permite escalar a Temporal sin rediseño del grafo
- ✅ Facilita testing (AgentCore es el único punto de control)
- ✅ Mejora observabilidad (todo pasa por AgentCore)

**Próximos Pasos:**
1. Implementar validación de arquitectura AgentCore
2. Refactorizar `execute_agent_core` para control de flujo
3. Actualizar `run_graph` para soportar modo AgentCore
4. Agregar tests de integración
5. Documentar migración de grafos existentes
