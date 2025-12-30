# Changelog

Todos los cambios notables en los contratos de REDMIND serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

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

