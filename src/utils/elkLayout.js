import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

const DEFAULT_NODE_WIDTH = 200;
const DEFAULT_NODE_HEIGHT = 100;

const IN = 'in';
const OUT = 'out';

// ids de puertos únicos en todo el grafo
const portId = (nodeId, handleId) => `${nodeId}:${handleId}`;

const getNodeDimensions = (node, getNodeInternals = null) => {
  if (node.width && node.height) return { width: node.width, height: node.height };

  const internal = typeof getNodeInternals === 'function' ? getNodeInternals(node.id) : null;
  const w = internal?.width ?? internal?.measured?.width;
  const h = internal?.height ?? internal?.measured?.height;

  if (w && h) return { width: w, height: h };
  return { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT };
};

const makePort = (nodeId, handleId, side, index = 0) => ({
  id: portId(nodeId, handleId),
  properties: {
    'org.eclipse.elk.port.side': side, // clave correcta
    'org.eclipse.elk.port.index': String(index),
  },
});

const getNodePorts = (node) => {
  if (node.type === 'trigger') {
    return [makePort(node.id, OUT, 'EAST', 0)];
  }
  return [
    makePort(node.id, IN, 'WEST', 0),
    makePort(node.id, OUT, 'EAST', 1),
  ];
};

export const convertToElkGraph = (nodes, edges, getNodeInternals = null, options = {}) => {
  const {
    algorithm = 'layered',
    direction = 'RIGHT',
    nodeSpacing = '120',
    layerSpacing = '200',
  } = options;

  return {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': algorithm,
      'elk.direction': direction,
      'elk.spacing.nodeNode': nodeSpacing,
      'elk.layered.spacing.nodeNodeBetweenLayers': layerSpacing,

      // para que "ordene" más parecido a TidyUp cuando hay ramas
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      'elk.layered.crossingMinimization.forceNodeModelOrder': 'true',
    },
    children: nodes.map((node) => {
      const { width, height } = getNodeDimensions(node, getNodeInternals);

      return {
        id: node.id,
        width,
        height,
        ports: getNodePorts(node),

        // IMPORTANTÍSIMO: este va por nodo (no solo en root) en el ejemplo oficial
        layoutOptions: {
          'org.eclipse.elk.portConstraints': 'FIXED_ORDER',
        },
      };
    }),
    edges: edges.map((edge) => {
      // "sanitiza" handles: si te llega algo raro, cae a in/out
      const srcHandle = edge.sourceHandle ?? OUT;
      const tgtHandle = edge.targetHandle ?? IN;

      return {
        id: edge.id,
        sources: [portId(edge.source, srcHandle)],
        targets: [portId(edge.target, tgtHandle)],
      };
    }),
  };
};

// --- helpers para Tidy Up ---

const toNum = (v, fallback) => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : fallback;
};

const snap = (v, grid = 20) => Math.round(v / grid) * grid;

const analyzeLinearPath = (nodes, edges) => {
  const indeg = new Map(nodes.map((n) => [n.id, 0]));
  const outdeg = new Map(nodes.map((n) => [n.id, 0]));
  const next = new Map(); // source -> target

  for (const e of edges) {
    outdeg.set(e.source, (outdeg.get(e.source) ?? 0) + 1);
    indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1);

    // Si un source tiene 2 salidas => ya no es lineal
    if (next.has(e.source)) return { isLinear: false, order: [] };
    next.set(e.source, e.target);
  }

  // Si algún nodo tiene indeg>1 o outdeg>1 => no es path
  for (const id of indeg.keys()) {
    if ((indeg.get(id) ?? 0) > 1) return { isLinear: false, order: [] };
    if ((outdeg.get(id) ?? 0) > 1) return { isLinear: false, order: [] };
  }

  const starts = nodes.filter((n) => (indeg.get(n.id) ?? 0) === 0);
  if (starts.length !== 1) return { isLinear: false, order: [] };

  const order = [];
  const seen = new Set();
  let cur = starts[0].id;

  while (cur && !seen.has(cur)) {
    seen.add(cur);
    order.push(cur);
    cur = next.get(cur);
  }

  if (order.length !== nodes.length) return { isLinear: false, order: [] };

  return { isLinear: true, order };
};

const tidyLinear = (nodes, order, direction, spacing, grid, getNodeInternals, getNodeDimensions) => {
  const map = new Map(nodes.map((n) => [n.id, n]));
  const first = map.get(order[0]);
  if (!first) return nodes;

  const baseX = snap(first.position.x, grid);
  const baseY = snap(first.position.y, grid);

  let x = baseX;
  let y = baseY;

  for (const id of order) {
    const node = map.get(id);
    if (!node) continue;

    // respeta tamaños reales si existen
    const { width, height } = getNodeDimensions(node, getNodeInternals);

    if (direction === 'RIGHT' || direction === 'LEFT') {
      node.position = { x: snap(x, grid), y: baseY };      // MISMA Y
      x += width + spacing;
    } else {
      node.position = { x: baseX, y: snap(y, grid) };      // MISMA X
      y += height + spacing;
    }
  }

  return [...map.values()];
};

export const applyElkLayout = async (nodes, edges, options = {}, getNodeInternals = null) => {
  try {
    const elkGraph = convertToElkGraph(nodes, edges, getNodeInternals, options);
    const layoutedGraph = await elk.layout(elkGraph);

    // 1) aplicar posiciones ELK
    const byId = new Map(layoutedGraph.children?.map((n) => [String(n.id), n]));
    let laidOut = nodes.map((node) => {
      const elkNode = byId.get(String(node.id));
      if (!elkNode) return node;

      return {
        ...node,
        position: {
          x: elkNode.x ?? node.position.x,
          y: elkNode.y ?? node.position.y,
        },
      };
    });

    // 2) Tidy Up: alineación dura + spacing fijo cuando es lineal
    const direction = options.direction ?? 'RIGHT';
    const grid = toNum(options.grid, 20);
    const spacing =
      (direction === 'RIGHT' || direction === 'LEFT')
        ? toNum(options.layerSpacing, 200)    // separación "entre layers"
        : toNum(options.nodeSpacing, 120);    // separación vertical

    const { isLinear, order } = analyzeLinearPath(laidOut, edges);

    if (options.tidyLinear !== false && isLinear) {
      laidOut = tidyLinear(
        laidOut,
        order,
        direction,
        spacing,
        grid,
        getNodeInternals,
        getNodeDimensions
      );
    } else {
      // si no es lineal, al menos snap a grid para look tidy
      laidOut = laidOut.map((n) => ({
        ...n,
        position: {
          x: snap(n.position.x, grid),
          y: snap(n.position.y, grid),
        },
      }));
    }

    return laidOut;
  } catch (error) {
    console.error('Error al aplicar el layout de ELK:', error);
    return nodes;
  }
};

/**
 * Algoritmos de layout disponibles en ELK
 */
export const ELK_ALGORITHMS = {
  LAYERED: 'layered', // Layout en capas (recomendado para flujos DAG)
  STRESS: 'stress', // Layout basado en fuerza
  MRTREE: 'mrtree', // Layout de árbol
  RADIAL: 'radial', // Layout radial
  FORCE: 'force', // Layout de fuerza
  DISCO: 'disco', // Layout disco
};

/**
 * Direcciones disponibles para el layout
 */
export const ELK_DIRECTIONS = {
  RIGHT: 'RIGHT', // De izquierda a derecha (recomendado para workflows)
  LEFT: 'LEFT',
  DOWN: 'DOWN', // De arriba a abajo
  UP: 'UP',
};

/**
 * Estrategias de minimización de cruces
 */
export const ELK_CROSSING_MINIMIZATION = {
  LAYER_SWEEP: 'LAYER_SWEEP', // Recomendado para DAG
  INTERACTIVE: 'INTERACTIVE',
  GREEDY_SWITCH: 'GREEDY_SWITCH',
};

/**
 * Estrategias de colocación de nodos
 */
export const ELK_NODE_PLACEMENT = {
  BRANDES_KOEPF: 'BRANDES_KOEPF', // Recomendado para workflows
  LINEAR_SEGMENTS: 'LINEAR_SEGMENTS',
  INTERACTIVE: 'INTERACTIVE',
};

/**
 * Configuraciones predefinidas para diferentes tipos de workflows
 */
export const ELK_PRESETS = {
  // Workflow tipo n8n (DAG simple, izquierda a derecha)
  N8N_WORKFLOW: {
    algorithm: ELK_ALGORITHMS.LAYERED,
    direction: ELK_DIRECTIONS.RIGHT,
    nodeSpacing: '120',
    layerSpacing: '200',
    tidyLinear: true,  // fuerza misma Y si es lineal
    grid: 20,          // snap estilo n8n
  },
  
  // Pipeline (flujo lineal)
  PIPELINE: {
    algorithm: ELK_ALGORITHMS.LAYERED,
    direction: ELK_DIRECTIONS.RIGHT,
    nodeSpacing: '150',
    layerSpacing: '250',
  },
  
  // Árbol (jerarquía)
  TREE: {
    algorithm: ELK_ALGORITHMS.MRTREE,
    direction: ELK_DIRECTIONS.DOWN,
    nodeSpacing: '100',
    layerSpacing: '150',
  },
  
  // Fan-out/Fan-in (múltiples conexiones)
  FAN_OUT_IN: {
    algorithm: ELK_ALGORITHMS.LAYERED,
    direction: ELK_DIRECTIONS.RIGHT,
    nodeSpacing: '100',
    layerSpacing: '180',
  },
};
