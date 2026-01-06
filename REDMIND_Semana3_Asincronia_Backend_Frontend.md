# REDMIND – Ejecución Asíncrona y Tiempo Real (Semana 3)
_Backend + Frontend – Implementación requerida_

Fecha: 2025-12-30  
Sprint: Semana 3 (MVP1.2)  
Estado: Diseño aprobado – pendiente de implementación

---

## 1. Contexto

Actualmente, REDMIND ejecuta los flows de forma **síncrona**:

- `POST /api/v1/runs` ejecuta el flow completo dentro del request HTTP
- El request queda bloqueado hasta finalizar
- El frontend recibe el resultado final
- No existe visualización de progreso en tiempo real

Esto **impide**:
- polling útil
- vista de ejecución en tiempo real
- cancelación efectiva durante ejecución
- escalabilidad futura

---

## 2. Objetivo de este cambio

Introducir **ejecución asíncrona en background**, manteniendo:
- la API v1
- el modelo de datos
- la compatibilidad con el MVP actual

Sin introducir aún:
- Temporal
- colas externas
- workers distribuidos

---

# 🧠 BACKEND

## 3. Cambio de comportamiento – POST /api/v1/runs

### Comportamiento ACTUAL
- Ejecuta el flow completo
- Retorna `trace` y `result`

### Nuevo comportamiento (Semana 3)

```
POST /api/v1/runs
```

1. Valida auth + project_id  
2. Crea registro `run` con `status = pending`  
3. Lanza ejecución en background  
4. Retorna inmediatamente

**Respuesta**
```json
{
  "runId": "uuid",
  "status": "running"
}
```

> ⚠️ Este endpoint ya NO retorna resultado final

---

## 4. Ejecución en background

### Implementación permitida (Semana 3)

- `FastAPI BackgroundTasks`
- o `asyncio.create_task`

**Responsabilidades del worker local**
- Cambiar estado a `running`
- Ejecutar nodos secuencialmente
- Persistir `node_runs` durante la ejecución
- Actualizar `status` final

---

## 5. Estados de ejecución

Estados válidos del run:

- `pending`
- `running`
- `completed`
- `error`
- `cancelled`
- `timeout`

Cada transición debe persistirse.

---

## 6. Endpoint de consulta – GET /api/v1/runs/{run_id}

Este endpoint **cobra relevancia real** con la asincronía.

Debe retornar:

```json
{
  "runId": "uuid",
  "status": "running",
  "trace": [
    {
      "nodeId": "input",
      "status": "completed"
    },
    {
      "nodeId": "http",
      "status": "running"
    }
  ],
  "result": null
}
```

---

## 7. Cancelación de runs

```
POST /api/v1/runs/{run_id}/cancel
```

Comportamiento:
- Marca run como `cancelled`
- El runner revisa el flag entre nodos
- Detiene ejecución limpiamente

---

## 8. Timeouts

### Timeout por nodo
- Aplicado dentro del executor del nodo
- Ej: HTTP = 10s, LLM = 30s

### Timeout por run
- Hard limit (ej: 300s)
- Cancela ejecución completa

---

# 🎨 FRONTEND

## 9. Cambio de flujo de ejecución

### Antes
```
POST /runs → esperar → mostrar resultado
```

### Ahora
```
POST /runs → recibir runId → polling → actualizar UI
```

---

## 10. Polling de estado

- Endpoint:
```
GET /api/v1/runs/{run_id}
```

- Intervalo recomendado:
  - 1–2 segundos mientras `status = running`

---

## 11. Vista de ejecución en tiempo real

La UI debe:

- Mostrar estado general del run
- Resaltar nodo activo
- Mostrar nodos completados
- Mostrar errores parciales
- Actualizar automáticamente

---

## 12. Cancelación desde UI

- Botón “Cancel run”
- Confirmación
- Feedback inmediato cuando el estado cambia

---

## 13. Manejo de errores

- Si `status = error`:
  - mostrar error del nodo fallido
- Si `status = timeout`:
  - indicar timeout global
- Si `status = cancelled`:
  - indicar cancelación manual

---

# 🤝 CONTRATO COMPARTIDO

## 14. Reglas no negociables

- `POST /runs` nunca bloquea
- El frontend **no asume** éxito
- El backend es fuente de verdad del estado
- Polling es obligatorio
- El modelo de datos no cambia

---

## 15. Definition of Done (Semana 3)

- Ejecución no bloqueante
- Polling funcional
- Vista de progreso en UI
- Cancelación real
- Estados persistidos
- Sin romper API v1

---

## 16. Fuera de alcance

- WebSockets / SSE
- Colas externas
- Temporal
- Workers distribuidos

---

> Nota: Este cambio es el **puente obligatorio** entre el MVP actual y la futura integración con Temporal.
