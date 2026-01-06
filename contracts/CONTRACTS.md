# REDMIND Contracts Bridge - Documentación Completa

**Versión Actual:** v1.0.2  
**Última Actualización:** 2025-01-30

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Objetivo y Reglas de Oro](#objetivo-y-reglas-de-oro)
4. [Validación](#validación)
5. [Integridad del Grafo](#integridad-del-grafo)
6. [Tipos de Nodos Disponibles](#tipos-de-nodos-disponibles)
7. [Versionado](#versionado)
8. [Historial de Cambios](#historial-de-cambios)
9. [Guías de Migración](#guías-de-migración)
10. [Checklist para Integración](#checklist-para-integración)

---

## Introducción

El **Contracts Bridge** es el contrato único que permite que Frontend (TypeScript) y Backend (Python) trabajen en paralelo sin romperse. La fuente de verdad es un JSON Schema v1 versionado. Ambos lados deben validar contra el mismo schema y aplicar reglas de integridad adicionales.

---

## Estructura del Proyecto

```
contracts/
├── schemas/
│   └── graph.schema.json    # JSON Schema v1 para validación
├── examples/
│   ├── hello-agent.json        # Ejemplo: Hello Agent (trigger → agent → response)
│   ├── route-intent.json         # Ejemplo: Route Intent (con condition.expr)
│   ├── http-api-call.json       # Ejemplo: HTTP GET request
│   ├── http-post-example.json  # Ejemplo: HTTP POST con agent
│   └── input-llm-end-flow.json  # Ejemplo: Flujo completo con trigger.input → model.llm → response.end
└── CONTRACTS.md                # Este archivo (documentación unificada)
```

---

## Objetivo y Reglas de Oro

### Objetivo

Permitir que frontend y backend se desarrollen en repos separados sin divergencias. La fuente de verdad es un JSON Schema v1 versionado. Ambos lados deben validar contra el mismo schema y aplicar reglas de integridad adicionales.

### Reglas de Oro

- ✅ **El contrato (schema) es el puente:** front/back NO inventan campos fuera del schema.
- ✅ **Cambios breaking → subir versión mayor del contrato (v2)** o incrementar `Node.typeVersion`.
- ✅ **IDs estables:** no regenerar ids al importar/exportar.
- ✅ **La semántica del flujo NO depende de ui.x/ui.y** (solo presentación).

---

## Validación

### Frontend (TypeScript) con AJV

```typescript
import Ajv from "ajv";
import addFormats from "ajv-formats";
import schema from "./schemas/graph.schema.json";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

export function validateGraph(graph: unknown) {
  const ok = validate(graph);
  return { ok: !!ok, errors: validate.errors ?? [] };
}
```

### Backend (Python) con fastjsonschema

```python
import json
import fastjsonschema

with open("contracts/schemas/graph.schema.json", "r", encoding="utf-8") as f:
    schema = json.load(f)

validate = fastjsonschema.compile(schema)

def validate_schema(graph: dict) -> None:
    validate(graph)  # levanta exception si falla
```

**Importante:** Después de `validate_schema()`, correr `validate_integrity()` para IDs únicos, start, edges, cycles.

---

## Integridad del Grafo

Además del schema, el backend (y opcionalmente el frontend) valida integridad:

- ✅ **IDs únicos:** `node.id` y `edge.id` sin duplicados.
- ✅ **start existe:** apunta a un nodo válido.
- ✅ **edges válidos:** `source`/`target` deben existir.
- ✅ **No self-loops:** `source==target` no permitido en v1.
- ✅ **Condition rules:** `rule.to` debe existir.
- ✅ **Ciclos:** en v1 bloquear ciclos (salvo futura bandera explícita).

---

## Tipos de Nodos Disponibles

### Triggers (Punto de Entrada)
- `trigger.manual` - Dispara flujo manualmente
- `trigger.webhook` - Dispara flujo con webhook
- `trigger.input` ⭐ - Valida y estructura datos de entrada (nuevo en v1.0.2)

### Agentes y Modelos
- `agent.core` - Agente core con estrategia
- `model.llm` - Modelo LLM (actualizado en v1.0.2: ahora soporta `prompt`)

### Herramientas (Tools)
- `tool.http` - Request HTTP
- `tool.postgres` - Query PostgreSQL

### Control de Flujo
- `condition.expr` - Condición por expresión

### Respuestas
- `response.chat` - Genera respuesta en formato chat
- `response.end` ⭐ - Finaliza flujo y establece output (nuevo en v1.0.2)

### Memoria
- `memory.kv` - Almacenamiento clave-valor

---

## Versionado

- **Taggear releases:** v1.0.0, v1.0.1, v1.0.2…
- **Cambios no breaking** (agregar campos opcionales) → patch/minor.
- **Cambios breaking** (renombrar/eliminar, cambiar required) → major (v2).

### Versión Actual: v1.0.2

Principales cambios en v1.0.2:
- ✅ Nuevos nodos: `trigger.input`, `response.end`
- ✅ `model.llm` actualizado con soporte para `prompt`
- ✅ Nomenclatura unificada (todos los nodos usan notación de puntos)

---

## Historial de Cambios

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/), y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

### [1.0.2] - 2025-01-30

**⚠️ BREAKING CHANGES:** Esta versión incluye cambios de nomenclatura. Ver sección de migración abajo.

#### Añadido
- Nuevos tipos de nodos agregados al schema:
  - `trigger.input`: Nodo para validar y estructurar datos de entrada (punto de entrada del flujo)
  - `response.end`: Nodo para finalizar ejecución y establecer output final
- Campo `prompt` agregado a `model.llm` (opcional, puede venir de vars.prompt)

#### Eliminado
- Nodo `llm`: eliminado, usar `model.llm` en su lugar

#### Actualizado
- `model.llm` ahora soporta `prompt` además de `provider`, `model`, `temperature`
- La funcionalidad de `llm` ha sido integrada en `model.llm`
- Nomenclatura unificada: todos los nodos ahora usan notación de puntos (dot notation)
  - `input` → `trigger.input` (consistente con `trigger.manual`, `trigger.webhook`)
  - `end` → `response.end` (consistente con `response.chat`)

#### Notas
- Estos nodos fueron implementados en el backend (Semana 3) pero faltaban en el schema JSON
- Ahora el frontend puede validar correctamente grafos que incluyan estos nodos
- `model.llm` es el único nodo LLM soportado, con soporte completo para provider, model, temperature y prompt
- La nomenclatura ahora es consistente: `trigger.*`, `response.*`, `tool.*`, `model.*`, etc.

---

### [1.0.1] - 2025-12-30

#### Actualizado
- Ejemplos actualizados: todos los edges ahora incluyen campo `id` (requerido por schema)
- Agregado ejemplo `http-api-call.json`: muestra uso básico de `tool.http` con GET
- Agregado ejemplo `http-post-example.json`: muestra uso de `tool.http` con POST y procesamiento con agent
- README actualizado con nuevos ejemplos

#### Notas
- El schema ya incluía soporte para `tool.http`, ahora hay ejemplos de uso
- Todos los ejemplos validan correctamente contra el schema actual

---

### [1.0.0] - 2025-12-30

#### Añadido
- JSON Schema v1 inicial para GraphDefinition
- Definiciones de todos los tipos de nodos del MVP1:
  - trigger.manual
  - trigger.webhook
  - agent.core
  - condition.expr
  - memory.kv
  - model.llm
  - tool.http
  - tool.postgres
  - response.chat
- Ejemplos: hello-agent.json y route-intent.json
- Estructura de contratos para compartir entre frontend y backend

#### Notas
- Este es el release inicial del contrato bridge.
- El schema define la estructura base para MVP1 Semana 1.
- Validación de integridad se hace fuera del schema (en backend).

---

## Guías de Migración

### Migración v1.0.1 → v1.0.2

**⚠️ IMPORTANTE:** Se ha unificado la nomenclatura de nodos. Todos los nodos ahora usan notación de puntos (dot notation).

#### Cambios de Nomenclatura

**1. `input` → `trigger.input`**

```json
// Antes (v1.0.1)
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

// Ahora (v1.0.2)
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

**2. `end` → `response.end`**

```json
// Antes (v1.0.1)
{
  "id": "end1",
  "type": "end",
  "typeVersion": 1,
  "config": {
    "output": {
      "result": "{{response}}"
    }
  }
}

// Ahora (v1.0.2)
{
  "id": "end1",
  "type": "response.end",
  "typeVersion": 1,
  "config": {
    "output": {
      "result": "{{response}}"
    }
  }
}
```

**Acción:** Buscar y reemplazar `"type": "end"` → `"type": "response.end"`

---

**3. `llm` → `model.llm`**

```json
// Antes (v1.0.1)
{
  "id": "llm1",
  "type": "llm",
  "typeVersion": 1,
  "config": {
    "prompt": "Answer: {{query}}"
  }
}

// Ahora (v1.0.2)
{
  "id": "llm1",
  "type": "model.llm",
  "typeVersion": 1,
  "config": {
    "provider": "openai",
    "model": "gpt-4",
    "prompt": "Answer: {{query}}"
  }
}
```

**Acción:** 
- Buscar y reemplazar `"type": "llm"` → `"type": "model.llm"`
- Agregar campos requeridos `provider` y `model` en `config`

---

#### Script de Migración Recomendado

```bash
# 1. Reemplazar tipos de nodos
sed -i 's/"type": "input"/"type": "trigger.input"/g' *.json
sed -i 's/"type": "end"/"type": "response.end"/g' *.json

# 2. Migrar nodos llm (requiere edición manual para agregar provider y model)
# Buscar todos los nodos con "type": "llm" y actualizar manualmente
```

**Nota:** La migración de `llm` a `model.llm` requiere agregar `provider` y `model` que son campos requeridos. Esto debe hacerse manualmente o con un script más complejo que analice el contexto.

---

## Checklist para Integración

- [ ] Clonar/consumir repo contracts (submodule o dependencia git).
- [ ] Front: validar local con AJV al exportar/importar; mostrar errores.
- [ ] Back: validar schema con fastjsonschema y luego integridad; devolver errores con path.
- [ ] Mantener ejemplos sincronizados: cualquier cambio del schema requiere actualizar examples.
- [ ] No romper compatibilidad: cambios breaking → v2 o typeVersion.
- [ ] **v1.0.2+:** Si migras desde v1.0.1, actualizar referencias según guía de migración arriba.

---

## Notas Adicionales

### Ejecución Asíncrona (Backend)

Desde la implementación de ejecución asíncrona (Semana 3), el backend ejecuta flows en background. Esto no afecta el schema de contratos, pero es importante saber que:

- `POST /api/v1/runs` retorna inmediatamente con `{"runId": "...", "status": "running"}`
- El frontend debe hacer polling a `GET /api/v1/runs/{run_id}` para obtener el progreso
- Los estados de run son: `pending`, `running`, `completed`, `error`, `cancelled`

### Timeouts

El backend soporta timeouts configurables:
- **Timeout por nodo:** `tool.http` (default: 10s), `model.llm` (default: 30s)
- **Timeout por run:** Configurable en `POST /api/v1/runs` con `timeout_seconds` (default: 300s)

Estos timeouts no afectan el schema de contratos, pero son parte de la ejecución del backend.

---

## Contacto y Soporte

Para preguntas sobre contratos o cambios breaking, contactar al equipo de backend.

**Última revisión:** 2025-01-30  
**Próxima revisión planificada:** v1.1.0 (cuando se agreguen nuevas funcionalidades)

