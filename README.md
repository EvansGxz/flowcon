# FlowCon - REDMIND Frontend

Frontend React para REDMIND. Canvas visual estilo n8n para crear y ejecutar flujos de agentes AI.

## Instalacion

```bash
npm install
npm start
```

La aplicacion se abre en [http://localhost:3000](http://localhost:3000)

## Estructura

```
src/
  components/
    canvas/         # FlowCanvas - editor visual de grafos
    runs/           # RunCard, RunDetail, TraceView - ejecucion y traces
    common/         # Sidebar, ProtectedRoute, etc.
  services/
    apiService.ts   # HTTP client base con auth
    flowsService.ts # CRUD de flows
    runsService.ts  # Ejecucion y consulta de runs
    authService.ts  # Login, registro, tokens
  store/
    editorStore.ts  # Zustand store principal (flows, runs, UI state)
  types/
    api.ts          # Tipos compartidos (Flow, Run, NodeRun, etc.)
    index.ts        # Re-exports
  contracts/        # Contratos sincronizados con backend
  nodes/            # Componentes de nodos custom para React Flow
```

## Funcionalidades principales

- **Canvas interactivo**: React Flow con nodos custom para cada tipo
- **Tipos de nodo**: trigger.manual, agent.core, response.chat, condition.expr, model.llm, tool.http, tool.postgres, memory.kv, response.end
- **Ejecucion de flows**: via API backend con polling de status
- **Vista de trace**: TraceView con iteraciones del AgentCore, confidence y reasoning
- **Modos de ejecucion**: badge visual para modo sequential vs agent
- **Proyectos**: CRUD completo con selector en sidebar
- **Autenticacion**: Login/registro con tokens OAuth-like
- **Validacion**: Validacion local y remota de grafos

## Conexion con backend

El frontend se conecta al backend en `http://localhost:8000/api/v1/`.

Headers automaticos:
- `Authorization: Bearer {token}` (auth)
- `X-Project-Id: {projectId}` (contexto de proyecto)

## Scripts

```bash
npm start       # Dev server en puerto 3000
npm run build   # Build de produccion
npm test        # Tests (CI mode)
```

## Tecnologias

- React 19 + TypeScript
- React Flow (@xyflow/react)
- Zustand (state management)
- React Router
- Create React App
