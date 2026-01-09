import { useState } from 'react';
import { MessageSquare, ShoppingCart, Database, LayoutDashboard, Plus, X, Play, Pause, RefreshCw, Trash2, Edit2, Users, TrendingUp, Activity, DollarSign } from 'lucide-react';
import './OutputCanvas.css';

export type OutputTemplateType = 'chat' | 'product-sales' | 'etl' | 'dashboard';

interface OutputTemplate {
  id: string;
  type: OutputTemplateType;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const templates: OutputTemplate[] = [
  {
    id: 'chat',
    type: 'chat',
    name: 'Chat',
    description: 'Interfaz de chat para conversaciones con usuarios',
    icon: <MessageSquare size={24} />,
  },
  {
    id: 'product-sales',
    type: 'product-sales',
    name: 'Página de Ventas',
    description: 'Página de venta de artículos con catálogo y carrito',
    icon: <ShoppingCart size={24} />,
  },
  {
    id: 'etl',
    type: 'etl',
    name: 'Procesos ETL',
    description: 'Frontend de administrador de procesos ETL (Extract, Transform, Load)',
    icon: <Database size={24} />,
  },
  {
    id: 'dashboard',
    type: 'dashboard',
    name: 'Panel de Administración',
    description: 'Dashboard administrativo con métricas, gráficos y estadísticas',
    icon: <LayoutDashboard size={24} />,
  },
];

function OutputCanvas() {
  const [selectedTemplate, setSelectedTemplate] = useState<OutputTemplateType | null>(null);
  const [templatesList, setTemplatesList] = useState<Array<{ id: string; type: OutputTemplateType }>>([]);

  const handleCreateTemplate = (templateType: OutputTemplateType) => {
    const newTemplate = {
      id: `template_${Date.now()}`,
      type: templateType,
    };
    setTemplatesList([...templatesList, newTemplate]);
    setSelectedTemplate(templateType);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplatesList(templatesList.filter(t => t.id !== templateId));
    if (templatesList.length === 1) {
      setSelectedTemplate(null);
    }
  };

  const renderTemplatePreview = (template: { id: string; type: OutputTemplateType }) => {
    switch (template.type) {
      case 'chat':
        return <ChatTemplatePreview templateId={template.id} onDelete={() => handleDeleteTemplate(template.id)} />;
      case 'product-sales':
        return <ProductSalesTemplatePreview templateId={template.id} onDelete={() => handleDeleteTemplate(template.id)} />;
      case 'etl':
        return <ETLTemplatePreview templateId={template.id} onDelete={() => handleDeleteTemplate(template.id)} />;
      case 'dashboard':
        return <DashboardTemplatePreview templateId={template.id} onDelete={() => handleDeleteTemplate(template.id)} />;
      default:
        return null;
    }
  };

  return (
    <div className="output-canvas">
      <div className="output-canvas-header">
        <h1 className="output-canvas-title">Salida</h1>
        <p className="output-canvas-subtitle">Diseña dónde recibirá la información procesada</p>
      </div>

      {templatesList.length === 0 ? (
        <div className="output-canvas-empty">
          <div className="output-canvas-empty-content">
            <h2 className="output-canvas-empty-title">Selecciona un template para comenzar</h2>
            <p className="output-canvas-empty-description">
              Elige un template según el tipo de salida que necesites para tu información procesada
            </p>
            <div className="output-canvas-templates-grid">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="output-canvas-template-card"
                  onClick={() => handleCreateTemplate(template.type)}
                >
                  <div className="output-canvas-template-icon">{template.icon}</div>
                  <h3 className="output-canvas-template-name">{template.name}</h3>
                  <p className="output-canvas-template-description">{template.description}</p>
                  <button className="output-canvas-template-button">
                    <Plus size={16} />
                    Crear Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="output-canvas-content">
          <div className="output-canvas-templates-list">
            <h3 className="output-canvas-templates-list-title">Templates Creados</h3>
            {templatesList.map((template) => (
              <div
                key={template.id}
                className={`output-canvas-template-item ${selectedTemplate === template.type ? 'active' : ''}`}
                onClick={() => setSelectedTemplate(template.type)}
              >
                {templates.find(t => t.type === template.type)?.icon}
                <span>{templates.find(t => t.type === template.type)?.name}</span>
                <button
                  className="output-canvas-template-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTemplate(template.id);
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              className="output-canvas-add-template"
              onClick={() => setSelectedTemplate(null)}
            >
              <Plus size={16} />
              Agregar Template
            </button>
          </div>

          <div className="output-canvas-preview">
            {selectedTemplate ? (
              templatesList
                .filter(t => t.type === selectedTemplate)
                .map(template => (
                  <div key={template.id} className="output-canvas-preview-content">
                    {renderTemplatePreview(template)}
                  </div>
                ))
            ) : (
              <div className="output-canvas-preview-empty">
                <p>Selecciona un template de la lista para ver su preview</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de preview para Chat Template
interface ChatTemplatePreviewProps {
  templateId: string;
  onDelete: () => void;
}

function ChatTemplatePreview({ templateId, onDelete }: ChatTemplatePreviewProps) {
  return (
    <div className="output-template-preview chat-template">
      <div className="output-template-preview-header">
        <h3>Chat Template</h3>
        <button className="output-template-preview-delete" onClick={onDelete}>
          <X size={16} />
        </button>
      </div>
      <div className="chat-template-preview">
        <div className="chat-messages">
          <div className="chat-message user">
            <div className="chat-message-content">Hola, ¿cómo puedo ayudarte?</div>
          </div>
          <div className="chat-message bot">
            <div className="chat-message-content">¡Hola! Estoy aquí para ayudarte.</div>
          </div>
        </div>
        <div className="chat-input-area">
          <input
            type="text"
            placeholder="Escribe tu mensaje..."
            className="chat-input"
            disabled
          />
          <button className="chat-send-button" disabled>
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente de preview para Product Sales Template
interface ProductSalesTemplatePreviewProps {
  templateId: string;
  onDelete: () => void;
}

function ProductSalesTemplatePreview({ templateId, onDelete }: ProductSalesTemplatePreviewProps) {
  return (
    <div className="output-template-preview product-sales-template">
      <div className="output-template-preview-header">
        <h3>Página de Ventas Template</h3>
        <button className="output-template-preview-delete" onClick={onDelete}>
          <X size={16} />
        </button>
      </div>
      <div className="product-sales-template-preview">
        <div className="product-sales-header">
          <h2>Catálogo de Productos</h2>
          <div className="product-sales-cart">
            <ShoppingCart size={20} />
            <span>Carrito (0)</span>
          </div>
        </div>
        <div className="product-sales-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="product-card">
              <div className="product-image-placeholder">Imagen</div>
              <div className="product-info">
                <h4 className="product-name">Producto {i}</h4>
                <p className="product-price">$99.99</p>
                <button className="product-add-button" disabled>
                  Agregar al Carrito
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Componente de preview para ETL Template
interface ETLTemplatePreviewProps {
  templateId: string;
  onDelete: () => void;
}

function ETLTemplatePreview({ templateId, onDelete }: ETLTemplatePreviewProps) {
  const etlProcesses = [
    { id: 1, name: 'Importación de Clientes', status: 'running', lastRun: '2024-01-15 10:30', nextRun: '2024-01-15 14:00' },
    { id: 2, name: 'Sincronización de Productos', status: 'success', lastRun: '2024-01-15 09:15', nextRun: '2024-01-15 15:00' },
    { id: 3, name: 'Actualización de Inventario', status: 'error', lastRun: '2024-01-15 08:00', nextRun: '2024-01-15 16:00' },
    { id: 4, name: 'Exportación de Reportes', status: 'idle', lastRun: '2024-01-14 18:00', nextRun: '2024-01-15 17:00' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'var(--accent-color)';
      case 'success':
        return 'var(--success-color)';
      case 'error':
        return 'var(--error-color)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'running':
        return 'Ejecutando';
      case 'success':
        return 'Completado';
      case 'error':
        return 'Error';
      default:
        return 'Inactivo';
    }
  };

  return (
    <div className="output-template-preview etl-template">
      <div className="output-template-preview-header">
        <h3>Administrador de Procesos ETL</h3>
        <button className="output-template-preview-delete" onClick={onDelete}>
          <X size={16} />
        </button>
      </div>
      <div className="etl-template-preview">
        <div className="etl-header">
          <h2>Procesos ETL</h2>
          <button className="etl-create-button" disabled>
            <Plus size={16} />
            Nuevo Proceso
          </button>
        </div>
        <div className="etl-processes-list">
          {etlProcesses.map((process) => (
            <div key={process.id} className="etl-process-card">
              <div className="etl-process-header">
                <div className="etl-process-info">
                  <h4 className="etl-process-name">{process.name}</h4>
                  <div className="etl-process-status">
                    <span
                      className="etl-status-badge"
                      style={{ backgroundColor: getStatusColor(process.status) }}
                    >
                      {getStatusLabel(process.status)}
                    </span>
                  </div>
                </div>
                <div className="etl-process-actions">
                  {process.status === 'running' ? (
                    <button className="etl-action-button" disabled title="Pausar">
                      <Pause size={14} />
                    </button>
                  ) : (
                    <button className="etl-action-button" disabled title="Ejecutar">
                      <Play size={14} />
                    </button>
                  )}
                  <button className="etl-action-button" disabled title="Re-ejecutar">
                    <RefreshCw size={14} />
                  </button>
                  <button className="etl-action-button" disabled title="Editar">
                    <Edit2 size={14} />
                  </button>
                  <button className="etl-action-button" disabled title="Eliminar">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="etl-process-details">
                <div className="etl-process-detail">
                  <span className="etl-detail-label">Última ejecución:</span>
                  <span className="etl-detail-value">{process.lastRun}</span>
                </div>
                <div className="etl-process-detail">
                  <span className="etl-detail-label">Próxima ejecución:</span>
                  <span className="etl-detail-value">{process.nextRun}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Componente de preview para Dashboard Template
interface DashboardTemplatePreviewProps {
  templateId: string;
  onDelete: () => void;
}

function DashboardTemplatePreview({ templateId, onDelete }: DashboardTemplatePreviewProps) {
  const stats = [
    { label: 'Usuarios Activos', value: '1,234', icon: <Users size={20} />, change: '+12%', trend: 'up' },
    { label: 'Ingresos', value: '$45,678', icon: <DollarSign size={20} />, change: '+8%', trend: 'up' },
    { label: 'Procesos', value: '89', icon: <Activity size={20} />, change: '+5%', trend: 'up' },
    { label: 'Crecimiento', value: '23%', icon: <TrendingUp size={20} />, change: '+3%', trend: 'up' },
  ];

  return (
    <div className="output-template-preview dashboard-template">
      <div className="output-template-preview-header">
        <h3>Panel de Administración</h3>
        <button className="output-template-preview-delete" onClick={onDelete}>
          <X size={16} />
        </button>
      </div>
      <div className="dashboard-template-preview">
        <div className="dashboard-header">
          <h2>Dashboard</h2>
          <div className="dashboard-date-range">
            <span>Últimos 30 días</span>
          </div>
        </div>

        <div className="dashboard-stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="dashboard-stat-card">
              <div className="dashboard-stat-icon">{stat.icon}</div>
              <div className="dashboard-stat-content">
                <div className="dashboard-stat-label">{stat.label}</div>
                <div className="dashboard-stat-value">{stat.value}</div>
                <div className={`dashboard-stat-change ${stat.trend}`}>
                  {stat.change} vs mes anterior
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-charts-grid">
          <div className="dashboard-chart-card">
            <h3 className="dashboard-chart-title">Actividad Reciente</h3>
            <div className="dashboard-chart-placeholder">
              <Activity size={48} />
              <p>Gráfico de actividad</p>
            </div>
          </div>
          <div className="dashboard-chart-card">
            <h3 className="dashboard-chart-title">Tendencias</h3>
            <div className="dashboard-chart-placeholder">
              <TrendingUp size={48} />
              <p>Gráfico de tendencias</p>
            </div>
          </div>
        </div>

        <div className="dashboard-table-section">
          <h3 className="dashboard-section-title">Actividad Reciente</h3>
          <div className="dashboard-table">
            <div className="dashboard-table-header">
              <div className="dashboard-table-cell">Usuario</div>
              <div className="dashboard-table-cell">Acción</div>
              <div className="dashboard-table-cell">Fecha</div>
              <div className="dashboard-table-cell">Estado</div>
            </div>
            {[
              { user: 'Juan Pérez', action: 'Creó nuevo flujo', date: '2024-01-15 10:30', status: 'success' },
              { user: 'María García', action: 'Ejecutó proceso ETL', date: '2024-01-15 09:15', status: 'success' },
              { user: 'Carlos López', action: 'Actualizó base de datos', date: '2024-01-15 08:45', status: 'running' },
              { user: 'Ana Martínez', action: 'Exportó reporte', date: '2024-01-14 18:20', status: 'success' },
            ].map((row, index) => (
              <div key={index} className="dashboard-table-row">
                <div className="dashboard-table-cell">{row.user}</div>
                <div className="dashboard-table-cell">{row.action}</div>
                <div className="dashboard-table-cell">{row.date}</div>
                <div className="dashboard-table-cell">
                  <span className={`dashboard-status-badge ${row.status}`}>
                    {row.status === 'success' ? 'Completado' : row.status === 'running' ? 'En proceso' : 'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OutputCanvas;
