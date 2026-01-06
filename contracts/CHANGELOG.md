# Changelog

Todos los cambios notables en los contratos de REDMIND serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.2] - 2025-01-XX

**⚠️ BREAKING CHANGES:** Esta versión incluye cambios de nomenclatura. Ver sección de migración abajo.

### Añadido
- Nuevos tipos de nodos agregados al schema:
  - `trigger.input`: Nodo para validar y estructurar datos de entrada (punto de entrada del flujo)
  - `response.end`: Nodo para finalizar ejecución y establecer output final
- Campo `prompt` agregado a `model.llm` (opcional, puede venir de vars.prompt)

### Eliminado
- Nodo `llm`: eliminado, usar `model.llm` en su lugar

### Actualizado
- `model.llm` ahora soporta `prompt` además de `provider`, `model`, `temperature`
- La funcionalidad de `llm` ha sido integrada en `model.llm`
- Nomenclatura unificada: todos los nodos ahora usan notación de puntos (dot notation)
  - `input` → `trigger.input` (consistente con `trigger.manual`, `trigger.webhook`)
  - `end` → `response.end` (consistente con `response.chat`)

### Notas
- Estos nodos fueron implementados en el backend (Semana 3) pero faltaban en el schema JSON
- Ahora el frontend puede validar correctamente grafos que incluyan estos nodos
- `model.llm` es el único nodo LLM soportado, con soporte completo para provider, model, temperature y prompt
- La nomenclatura ahora es consistente: `trigger.*`, `response.*`, `tool.*`, `model.*`, etc.

### Migración desde v1.0.1

Si tienes grafos creados con versiones anteriores, actualiza:

1. **Nodos `input`:**
   ```json
   // Antes
   {"type": "input", ...}
   
   // Ahora
   {"type": "trigger.input", ...}
   ```

2. **Nodos `end`:**
   ```json
   // Antes
   {"type": "end", ...}
   
   // Ahora
   {"type": "response.end", ...}
   ```

3. **Nodos `llm`:**
   ```json
   // Antes
   {"type": "llm", "config": {"prompt": "..."}}
   
   // Ahora
   {"type": "model.llm", "config": {
     "provider": "openai",
     "model": "gpt-4",
     "prompt": "..."
   }}
   ```

**Script de migración recomendado:**
- Buscar y reemplazar `"type": "input"` → `"type": "trigger.input"`
- Buscar y reemplazar `"type": "end"` → `"type": "response.end"`
- Migrar `llm` a `model.llm` agregando `provider` y `model` requeridos

## [1.0.1] - 2025-12-30

### Actualizado
- Ejemplos actualizados: todos los edges ahora incluyen campo `id` (requerido por schema)
- Agregado ejemplo `http-api-call.json`: muestra uso básico de `tool.http` con GET
- Agregado ejemplo `http-post-example.json`: muestra uso de `tool.http` con POST y procesamiento con agent
- README actualizado con nuevos ejemplos

### Notas
- El schema ya incluía soporte para `tool.http`, ahora hay ejemplos de uso
- Todos los ejemplos validan correctamente contra el schema actual

## [1.0.0] - 2025-12-30

### Añadido
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

### Notas
- Este es el release inicial del contrato bridge.
- El schema define la estructura base para MVP1 Semana 1.
- Validación de integridad se hace fuera del schema (en backend).

