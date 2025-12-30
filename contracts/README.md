# REDMIND Contracts Bridge v1

Contrato único para Frontend (TypeScript) + Backend (Python) trabajando en paralelo sin romperse.

## Estructura

```
contracts/
├── schemas/
│   └── graph.schema.json    # JSON Schema v1 para validación
├── examples/
│   ├── hello-agent.json     # Ejemplo: Hello Agent
│   └── route-intent.json    # Ejemplo: Route Intent
├── CHANGELOG.md             # Historial de cambios
└── README.md                # Este archivo
```

## Objetivo

Permitir que frontend y backend se desarrollen en repos separados sin divergencias. La fuente de verdad es un JSON Schema v1 versionado. Ambos lados deben validar contra el mismo schema y aplicar reglas de integridad adicionales.

## Reglas de Oro

- El contrato (schema) es el puente: front/back NO inventan campos fuera del schema.
- Cambios breaking → subir versión mayor del contrato (v2) o incrementar Node.typeVersion.
- IDs estables: no regenerar ids al importar/exportar.
- La semántica del flujo NO depende de ui.x/ui.y (solo presentación).

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

Después de `validate_schema()`, correr `validate_integrity()` para IDs únicos, start, edges, cycles.

## Integridad del Grafo

Además del schema, el backend (y opcionalmente el frontend) valida integridad:

- IDs únicos: node.id y edge.id sin duplicados.
- start existe y apunta a un nodo válido.
- edges: source/target deben existir.
- No self-loops (source==target) en v1.
- Condition rules: rule.to debe existir.
- Ciclos: en v1 bloquear ciclos (salvo futura bandera explícita).

## Versionado

- Taggear releases: v1.0.0, v1.0.1…
- Cambios no breaking (agregar campos opcionales) → patch/minor.
- Cambios breaking (renombrar/eliminar, cambiar required) → major (v2).

## Checklist para Integración

- [ ] Clonar/consumir repo contracts (submodule o dependencia git).
- [ ] Front: validar local con AJV al exportar/importar; mostrar errores.
- [ ] Back: validar schema con fastjsonschema y luego integridad; devolver errores con path.
- [ ] Mantener ejemplos sincronizados: cualquier cambio del schema requiere actualizar examples.
- [ ] No romper compatibilidad: cambios breaking → v2 o typeVersion.

