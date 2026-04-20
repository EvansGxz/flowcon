import { useEffect, useState, useCallback } from 'react';
import { Key, Plus, Trash2, Copy, Check, X, Loader2, Pencil, Zap } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import {
  listCredentials,
  createCredential,
  updateCredential,
  deleteCredential,
  testCredential,
  type Credential,
  type CreateCredentialPayload,
} from '../../services/credentialsService';
import './CredentialsList.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type CredentialType = Credential['credential_type'];

interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number';
  placeholder?: string;
}

const FIELD_MAP: Record<CredentialType, FieldDef[]> = {
  openai: [
    { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'sk-...' },
  ],
  azure_openai: [
    { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Tu Azure API key' },
    { key: 'azure_endpoint', label: 'Azure Endpoint (solo base URL, sin /openai/...)', type: 'text', placeholder: 'https://tu-recurso.openai.azure.com/' },
    { key: 'api_version', label: 'API Version', type: 'text', placeholder: '2025-01-01-preview' },
  ],
  postgres: [
    { key: 'host', label: 'Host', type: 'text', placeholder: 'localhost' },
    { key: 'port', label: 'Puerto', type: 'number', placeholder: '5432' },
    { key: 'database', label: 'Base de datos', type: 'text', placeholder: 'mydb' },
    { key: 'user', label: 'Usuario', type: 'text', placeholder: 'postgres' },
    { key: 'password', label: 'Contraseña', type: 'password', placeholder: 'password' },
  ],
  http_bearer: [
    { key: 'token', label: 'Token', type: 'password', placeholder: 'Bearer token' },
  ],
};

const TYPE_LABELS: Record<CredentialType, string> = {
  openai: 'OpenAI',
  azure_openai: 'Azure OpenAI',
  postgres: 'PostgreSQL',
  http_bearer: 'HTTP Bearer',
};

const TYPE_DESCRIPTIONS: Record<CredentialType, string> = {
  openai: 'Conecta con la API de OpenAI para modelos GPT',
  azure_openai: 'Conecta con Azure OpenAI Service',
  postgres: 'Conexión a base de datos PostgreSQL',
  http_bearer: 'Token de autenticación HTTP Bearer',
};

const ALL_TYPES: CredentialType[] = ['openai', 'azure_openai', 'postgres', 'http_bearer'];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const CredentialsList = () => {
  const { checkConnection, connectionStatus } = useEditorStore();

  // List state
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<CredentialType>('azure_openai');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [editType, setEditType] = useState<CredentialType>('azure_openai');

  // UI state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; message: string }>>({});

  /* ---------- fetch ---------- */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await checkConnection();
    } catch (e) {
      console.warn('[Credentials] checkConnection:', e);
    }
    try {
      const list = await listCredentials();
      setCredentials(list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('401') || msg.includes('Authorization') || msg.includes('token')) {
        setError('Inicia sesion para ver tus credenciales');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [checkConnection]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ---------- helpers ---------- */
  const resetForm = () => {
    setFormName('');
    setFormType('azure_openai');
    setFormData({});
    setShowForm(false);
  };

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleTypeChange = (type: CredentialType) => {
    setFormType(type);
    setFormData({});
  };

  /* ---------- create ---------- */
  const handleCreate = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload: CreateCredentialPayload = {
        name: formName.trim(),
        credential_type: formType,
        data: { ...formData },
      };
      await createCredential(payload);
      resetForm();
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear credencial');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- delete ---------- */
  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar esta credencial? Los nodos que la usen dejarán de funcionar.')) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteCredential(id);
      setCredentials((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar credencial');
    } finally {
      setDeletingId(null);
    }
  };

  /* ---------- copy ---------- */
  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* ---------- test ---------- */
  const handleTest = async (id: string) => {
    setTestingId(id);
    setTestResult((prev) => ({ ...prev, [id]: { success: false, message: 'Probando...' } }));
    try {
      const result = await testCredential(id);
      setTestResult((prev) => ({ ...prev, [id]: result }));
    } catch (err) {
      setTestResult((prev) => ({ ...prev, [id]: { success: false, message: err instanceof Error ? err.message : 'Error' } }));
    } finally {
      setTestingId(null);
    }
  };

  /* ---------- edit ---------- */
  const handleStartEdit = (cred: Credential) => {
    setEditingId(cred.id);
    setEditName(cred.name);
    setEditType(cred.credential_type);
    setEditData({}); // Campos vacíos -- el usuario solo llena lo que quiere cambiar
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    setError(null);
    try {
      const payload: { name?: string; data?: Record<string, unknown> } = {};
      if (editName.trim()) payload.name = editName.trim();
      // Solo enviar data si el usuario llenó al menos un campo
      const filledData = Object.fromEntries(
        Object.entries(editData).filter(([, v]) => v.trim().length > 0)
      );
      if (Object.keys(filledData).length > 0) payload.data = filledData;
      await updateCredential(editingId, payload);
      setEditingId(null);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- render ---------- */
  const fields = FIELD_MAP[formType];
  const isFormValid =
    formName.trim().length > 0 &&
    fields.every((f) => (formData[f.key] ?? '').trim().length > 0);

  if (loading) {
    return (
      <div className="credentials-list-container">
        <div className="credentials-list-loading">
          <Loader2 size={24} className="animate-spin" style={{ marginBottom: 8 }} />
          Cargando credenciales...
        </div>
      </div>
    );
  }

  return (
    <div className="credentials-list-container">
      {/* Header */}
      <div className="credentials-list-header">
        <div>
          <h1 className="credentials-list-title">Credenciales</h1>
          <p className="credentials-list-subtitle">
            Gestiona las claves de API y conexiones a servicios externos.
            Estado: <span className={`connection-status ${connectionStatus}`}>{connectionStatus}</span>
          </p>
        </div>
        <button className="cred-add-btn" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Nueva Credencial
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="cred-error-banner">
          <span>{error}</span>
          <button className="cred-error-dismiss" onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* New credential form */}
      {showForm && (
        <div className="cred-form-card">
          <div className="cred-form-header">
            <h3 className="cred-form-title">Nueva Credencial</h3>
            <button className="cred-form-close" onClick={resetForm}>
              <X size={16} />
            </button>
          </div>

          <div className="cred-form-body">
            {/* Name */}
            <label className="cred-label">Nombre</label>
            <input
              className="cred-input"
              type="text"
              placeholder="Ej: Azure OpenAI Producción"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              autoFocus
            />

            {/* Type */}
            <label className="cred-label">Tipo</label>
            <div className="cred-type-grid">
              {ALL_TYPES.map((t) => (
                <button
                  key={t}
                  className={`cred-type-option ${formType === t ? 'active' : ''}`}
                  onClick={() => handleTypeChange(t)}
                >
                  <span className="cred-type-option-name">{TYPE_LABELS[t]}</span>
                  <span className="cred-type-option-desc">{TYPE_DESCRIPTIONS[t]}</span>
                </button>
              ))}
            </div>

            {/* Dynamic fields */}
            <div className="cred-fields-section">
              <label className="cred-label">Configuración — {TYPE_LABELS[formType]}</label>
              {fields.map((f) => (
                <div key={f.key} className="cred-field-row">
                  <label className="cred-field-label">{f.label}</label>
                  <input
                    className="cred-input"
                    type={f.type}
                    placeholder={f.placeholder}
                    value={formData[f.key] ?? ''}
                    onChange={(e) => handleFieldChange(f.key, e.target.value)}
                  />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="cred-form-actions">
              <button className="cred-cancel-btn" onClick={resetForm}>Cancelar</button>
              <button
                className="cred-save-btn"
                disabled={!isFormValid || saving}
                onClick={handleCreate}
              >
                {saving ? 'Guardando...' : 'Guardar Credencial'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials list */}
      {credentials.length === 0 && !showForm ? (
        <div className="credentials-list-empty">
          <Key size={48} strokeWidth={1.5} />
          <p>No hay credenciales configuradas</p>
          <p className="credentials-list-empty-note">
            Agrega credenciales para conectar tus nodos con Azure OpenAI, PostgreSQL y otros servicios.
          </p>
        </div>
      ) : (
        <div className="cred-grid">
          {credentials.map((cred) => (
            <div key={cred.id} className="cred-card">
              <div className="cred-card-header">
                <div className="cred-card-name">{cred.name}</div>
                <div className="cred-card-actions">
                  <button
                    className="cred-card-action"
                    onClick={() => handleStartEdit(cred)}
                    title="Editar"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="cred-card-action"
                    onClick={() => handleTest(cred.id)}
                    disabled={testingId === cred.id}
                    title="Probar conexion"
                  >
                    {testingId === cred.id ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                  </button>
                  <button
                    className="cred-card-action cred-card-action-danger"
                    onClick={() => handleDelete(cred.id)}
                    disabled={deletingId === cred.id}
                    title="Eliminar"
                  >
                    {deletingId === cred.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </div>

              <div className="cred-card-type-row">
                <span className={`cred-card-badge cred-badge-${cred.credential_type}`}>
                  {TYPE_LABELS[cred.credential_type]}
                </span>
                {cred.created_at && (
                  <span className="cred-card-date">
                    {new Date(cred.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Test result */}
              {testResult[cred.id] && (
                <div className={`cred-test-result ${testResult[cred.id].success ? 'cred-test-success' : 'cred-test-fail'}`}>
                  {testResult[cred.id].success ? <Check size={12} /> : <X size={12} />}
                  <span>{testResult[cred.id].message}</span>
                </div>
              )}

              {/* Edit form inline */}
              {editingId === cred.id && (
                <div className="cred-edit-inline">
                  <div className="cred-field-row">
                    <label className="cred-field-label">Nombre</label>
                    <input
                      className="cred-input"
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="cred-field-row">
                    <label className="cred-field-label" style={{ fontSize: '11px', opacity: 0.6 }}>
                      Deja en blanco los campos que no quieras cambiar
                    </label>
                  </div>
                  {FIELD_MAP[editType].map((f) => (
                    <div key={f.key} className="cred-field-row">
                      <label className="cred-field-label">{f.label}</label>
                      <input
                        className="cred-input"
                        type={f.type}
                        placeholder={f.placeholder}
                        value={editData[f.key] ?? ''}
                        onChange={(e) => setEditData((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <div className="cred-form-actions">
                    <button className="cred-cancel-btn" onClick={() => setEditingId(null)}>Cancelar</button>
                    <button className="cred-save-btn" onClick={handleSaveEdit} disabled={saving}>
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              )}

              <div className="cred-card-id-row">
                <code className="cred-card-id">{cred.id}</code>
                <button
                  className="cred-card-copy"
                  onClick={() => handleCopy(cred.id)}
                  title="Copiar ID"
                >
                  {copiedId === cred.id ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CredentialsList;
