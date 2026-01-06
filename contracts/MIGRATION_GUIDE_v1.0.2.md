# Guía de Migración: v1.0.1 → v1.0.2

Esta guía te ayudará a migrar tus grafos desde la versión 1.0.1 a la 1.0.2.

## ⚠️ Cambios Breaking

La versión 1.0.2 introduce cambios de nomenclatura para mantener consistencia. Todos los nodos ahora usan notación de puntos (dot notation).

## Cambios de Nomenclatura

### 1. `input` → `trigger.input`

**Antes (v1.0.1):**
```json
{
  "id": "input1",
  "type": "input",
  "typeVersion": 1,
  "config": {
    "schema": {
      "required": ["field1"]
    }
  }
}
```

**Ahora (v1.0.2):**
```json
{
  "id": "input1",
  "type": "trigger.input",
  "typeVersion": 1,
  "config": {
    "schema": {
      "required": ["field1"]
    }
  }
}
```

**Acción:** Buscar y reemplazar `"type": "input"` → `"type": "trigger.input"`

---

### 2. `end` → `response.end`

**Antes (v1.0.1):**
```json
{
  "id": "end1",
  "type": "end",
  "typeVersion": 1,
  "config": {
    "output": {"result": "success"}
  }
}
```

**Ahora (v1.0.2):**
```json
{
  "id": "end1",
  "type": "response.end",
  "typeVersion": 1,
  "config": {
    "output": {"result": "success"}
  }
}
```

**Acción:** Buscar y reemplazar `"type": "end"` → `"type": "response.end"`

---

### 3. `llm` → `model.llm` (con campos adicionales)

**Antes (v1.0.1):**
```json
{
  "id": "llm1",
  "type": "llm",
  "typeVersion": 1,
  "config": {
    "prompt": "Answer this question"
  }
}
```

**Ahora (v1.0.2):**
```json
{
  "id": "llm1",
  "type": "model.llm",
  "typeVersion": 1,
  "config": {
    "provider": "openai",    // ✅ NUEVO: Requerido
    "model": "gpt-4",        // ✅ NUEVO: Requerido
    "temperature": 0.2,      // Opcional
    "prompt": "Answer this question"  // Mantiene funcionalidad
  }
}
```

**Acción:** 
1. Cambiar `"type": "llm"` → `"type": "model.llm"`
2. Agregar campos requeridos `provider` y `model`
3. Mantener `prompt` si existía

---

## Script de Migración Automática

### JavaScript/TypeScript

```typescript
function migrateGraph(graph: GraphDefinition): GraphDefinition {
  // Migrar input → trigger.input
  graph.nodes = graph.nodes.map(node => {
    if (node.type === "input") {
      return { ...node, type: "trigger.input" };
    }
    return node;
  });

  // Migrar end → response.end
  graph.nodes = graph.nodes.map(node => {
    if (node.type === "end") {
      return { ...node, type: "response.end" };
    }
    return node;
  });

  // Migrar llm → model.llm
  graph.nodes = graph.nodes.map(node => {
    if (node.type === "llm") {
      return {
        ...node,
        type: "model.llm",
        config: {
          provider: "openai",  // Valor por defecto, ajustar según necesidad
          model: "gpt-4",       // Valor por defecto, ajustar según necesidad
          ...node.config        // Mantiene prompt y otros campos
        }
      };
    }
    return node;
  });

  return graph;
}
```

### Python

```python
def migrate_graph(graph: dict) -> dict:
    """Migra un grafo de v1.0.1 a v1.0.2."""
    for node in graph.get("nodes", []):
        # Migrar input → trigger.input
        if node.get("type") == "input":
            node["type"] = "trigger.input"
        
        # Migrar end → response.end
        elif node.get("type") == "end":
            node["type"] = "response.end"
        
        # Migrar llm → model.llm
        elif node.get("type") == "llm":
            node["type"] = "model.llm"
            config = node.get("config", {})
            # Agregar campos requeridos si no existen
            if "provider" not in config:
                config["provider"] = "openai"  # Valor por defecto
            if "model" not in config:
                config["model"] = "gpt-4"  # Valor por defecto
            node["config"] = config
    
    return graph
```

## Validación Post-Migración

Después de migrar, valida que el grafo sea válido:

### Frontend (TypeScript)
```typescript
import { validateGraph } from "./validation";

const migratedGraph = migrateGraph(oldGraph);
const result = validateGraph(migratedGraph);

if (!result.ok) {
  console.error("Errores de validación:", result.errors);
}
```

### Backend (Python)
```python
from app.validate.validate_graph import validate_graph
from app.contracts.graph import GraphDefinition

migrated_graph = migrate_graph(old_graph_dict)
graph = GraphDefinition(**migrated_graph)
result = validate_graph(graph)

if not result.ok:
    print("Errores de validación:", result.errors)
```

## Checklist de Migración

- [ ] Identificar todos los grafos que usan `input`, `end`, o `llm`
- [ ] Ejecutar script de migración o migrar manualmente
- [ ] Validar cada grafo migrado contra el schema v1.0.2
- [ ] Actualizar referencias en código frontend/backend
- [ ] Probar ejecución de grafos migrados
- [ ] Actualizar documentación interna

## Soporte

Si encuentras problemas durante la migración:
1. Verifica que estés usando el schema JSON v1.0.2
2. Revisa los ejemplos en `contracts/examples/`
3. Consulta `CHANGELOG.md` para detalles completos

## Ejemplo Completo de Migración

**Grafo Antes (v1.0.1):**
```json
{
  "id": "my-flow",
  "version": 1,
  "start": "i1",
  "nodes": [
    {"id": "i1", "type": "input", "typeVersion": 1, "config": {}},
    {"id": "l1", "type": "llm", "typeVersion": 1, "config": {"prompt": "test"}},
    {"id": "e1", "type": "end", "typeVersion": 1, "config": {}}
  ],
  "edges": [
    {"id": "e1", "source": "i1", "target": "l1"},
    {"id": "e2", "source": "l1", "target": "e1"}
  ]
}
```

**Grafo Después (v1.0.2):**
```json
{
  "id": "my-flow",
  "version": 1,
  "start": "i1",
  "nodes": [
    {"id": "i1", "type": "trigger.input", "typeVersion": 1, "config": {}},
    {"id": "l1", "type": "model.llm", "typeVersion": 1, "config": {
      "provider": "openai",
      "model": "gpt-4",
      "prompt": "test"
    }},
    {"id": "e1", "type": "response.end", "typeVersion": 1, "config": {}}
  ],
  "edges": [
    {"id": "e1", "source": "i1", "target": "l1"},
    {"id": "e2", "source": "l1", "target": "e1"}
  ]
}
```

