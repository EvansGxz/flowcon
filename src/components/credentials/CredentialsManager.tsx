import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Copy, Check, ChevronDown, Key } from 'lucide-react';
import {
  listCredentials,
  createCredential,
  deleteCredential,
  type Credential,
  type CreateCredentialPayload,
} from '../../services/credentialsService';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CredentialsManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

type CredentialType = Credential['credential_type'];

interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number';
  placeholder?: string;
}

/* ------------------------------------------------------------------ */
/*  Field definitions per credential type                              */
/* ------------------------------------------------------------------ */

const FIELD_MAP: Record<CredentialType, FieldDef[]> = {
  openai: [
    { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'sk-...' },
  ],
  azure_openai: [
    { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Your Azure API key' },
    { key: 'azure_endpoint', label: 'Azure Endpoint', type: 'text', placeholder: 'https://your-resource.openai.azure.com' },
    { key: 'api_version', label: 'API Version', type: 'text', placeholder: '2024-02-01' },
  ],
  postgres: [
    { key: 'host', label: 'Host', type: 'text', placeholder: 'localhost' },
    { key: 'port', label: 'Port', type: 'number', placeholder: '5432' },
    { key: 'database', label: 'Database', type: 'text', placeholder: 'mydb' },
    { key: 'user', label: 'User', type: 'text', placeholder: 'postgres' },
    { key: 'password', label: 'Password', type: 'password', placeholder: 'password' },
  ],
  http_bearer: [
    { key: 'token', label: 'Token', type: 'password', placeholder: 'Bearer token value' },
  ],
};

const TYPE_LABELS: Record<CredentialType, string> = {
  openai: 'OpenAI',
  azure_openai: 'Azure OpenAI',
  postgres: 'PostgreSQL',
  http_bearer: 'HTTP Bearer',
};

const ALL_TYPES: CredentialType[] = ['openai', 'azure_openai', 'postgres', 'http_bearer'];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const CredentialsManager = ({ isOpen, onClose }: CredentialsManagerProps) => {
  // List state
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<CredentialType>('openai');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Copy-to-clipboard feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Deleting state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* ---------- fetch ---------- */
  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listCredentials();
      setCredentials(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load credentials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCredentials();
    }
  }, [isOpen, fetchCredentials]);

  /* ---------- Escape key ---------- */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  /* ---------- helpers ---------- */
  const resetForm = () => {
    setFormName('');
    setFormType('openai');
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
      await fetchCredentials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create credential');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- delete ---------- */
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      await deleteCredential(id);
      setCredentials((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete credential');
    } finally {
      setDeletingId(null);
    }
  };

  /* ---------- copy ---------- */
  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  /* ---------- render gate ---------- */
  if (!isOpen) return null;

  const fields = FIELD_MAP[formType];
  const isFormValid =
    formName.trim().length > 0 &&
    fields.every((f) => (formData[f.key] ?? '').trim().length > 0);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ---- Header ---- */}
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <Key size={20} />
            <h3 style={styles.title}>Credentials</h3>
          </div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* ---- Error banner ---- */}
        {error && (
          <div style={styles.errorBanner}>
            {error}
            <button style={styles.errorDismiss} onClick={() => setError(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* ---- Body ---- */}
        <div style={styles.body}>
          {/* Credentials list */}
          {loading ? (
            <div style={styles.centered}>Loading...</div>
          ) : credentials.length === 0 && !showForm ? (
            <div style={styles.centered}>
              <Key size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ margin: 0 }}>No credentials yet</p>
              <p style={{ ...styles.muted, margin: '4px 0 0' }}>
                Add one to connect your nodes to external services.
              </p>
            </div>
          ) : (
            <div style={styles.list}>
              {credentials.map((cred) => (
                <div key={cred.id} style={styles.credCard}>
                  <div style={styles.credInfo}>
                    <div style={styles.credName}>{cred.name}</div>
                    <div style={styles.credMeta}>
                      <span style={styles.typeBadge}>{TYPE_LABELS[cred.credential_type]}</span>
                      {cred.created_at && (
                        <span style={styles.muted}>
                          {new Date(cred.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div style={styles.credIdRow}>
                      <code style={styles.credId}>{cred.id}</code>
                      <button
                        style={styles.copyBtn}
                        onClick={() => handleCopy(cred.id)}
                        title="Copy ID"
                      >
                        {copiedId === cred.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  <button
                    style={{
                      ...styles.deleteBtn,
                      opacity: deletingId === cred.id ? 0.5 : 1,
                    }}
                    onClick={() => handleDelete(cred.id)}
                    disabled={deletingId === cred.id}
                    title="Delete credential"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ---- New credential form ---- */}
          {showForm && (
            <div style={styles.formSection}>
              <div style={styles.formDivider} />
              <h4 style={styles.formTitle}>New Credential</h4>

              {/* Name */}
              <label style={styles.label}>Name</label>
              <input
                style={styles.input}
                type="text"
                placeholder="My API Key"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
              />

              {/* Type */}
              <label style={styles.label}>Type</label>
              <div style={styles.selectWrapper}>
                <select
                  style={styles.select}
                  value={formType}
                  onChange={(e) => handleTypeChange(e.target.value as CredentialType)}
                >
                  {ALL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} style={styles.selectIcon} />
              </div>

              {/* Dynamic fields */}
              {fields.map((f) => (
                <div key={f.key}>
                  <label style={styles.label}>{f.label}</label>
                  <input
                    style={styles.input}
                    type={f.type}
                    placeholder={f.placeholder}
                    value={formData[f.key] ?? ''}
                    onChange={(e) => handleFieldChange(f.key, e.target.value)}
                  />
                </div>
              ))}

              {/* Actions */}
              <div style={styles.formActions}>
                <button style={styles.cancelBtn} onClick={resetForm}>
                  Cancel
                </button>
                <button
                  style={{
                    ...styles.saveBtn,
                    opacity: isFormValid && !saving ? 1 : 0.5,
                    cursor: isFormValid && !saving ? 'pointer' : 'not-allowed',
                  }}
                  disabled={!isFormValid || saving}
                  onClick={handleCreate}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ---- Footer ---- */}
        {!showForm && (
          <div style={styles.footer}>
            <button style={styles.addBtn} onClick={() => setShowForm(true)}>
              <Plus size={16} />
              New Credential
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Styles (CSS-in-JS using CSS variables from the theme)              */
/* ------------------------------------------------------------------ */

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    position: 'relative',
    zIndex: 2001,
    backgroundColor: 'var(--node-bg)',
    border: '2px solid var(--node-border)',
    borderRadius: 12,
    width: '90%',
    maxWidth: 560,
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-xl)',
  },

  /* Header */
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--node-border)',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: 'var(--node-title-color)',
  },
  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--node-title-color)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--node-description-color)',
    cursor: 'pointer',
    padding: 0,
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },

  /* Error banner */
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 20px',
    backgroundColor: 'var(--error-bg)',
    color: 'var(--error-color)',
    fontSize: 13,
    borderBottom: '1px solid var(--error-border)',
  },
  errorDismiss: {
    background: 'none',
    border: 'none',
    color: 'var(--error-color)',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
  },

  /* Body */
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0',
    color: 'var(--text-primary)',
    textAlign: 'center',
  },
  muted: {
    fontSize: 13,
    color: 'var(--text-secondary)',
  },

  /* List */
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  credCard: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    padding: '14px 16px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 8,
  },
  credInfo: {
    flex: 1,
    minWidth: 0,
  },
  credName: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 4,
  },
  credMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  typeBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 4,
    backgroundColor: 'var(--info-bg)',
    color: 'var(--info-color)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
  },
  credIdRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  credId: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    fontFamily: 'monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    maxWidth: 260,
  },
  copyBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: 2,
    display: 'flex',
    alignItems: 'center',
    borderRadius: 4,
    flexShrink: 0,
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--error-color)',
    cursor: 'pointer',
    padding: 6,
    display: 'flex',
    alignItems: 'center',
    borderRadius: 4,
    flexShrink: 0,
    marginTop: 2,
  },

  /* Form */
  formSection: {
    paddingTop: 8,
  },
  formDivider: {
    height: 1,
    backgroundColor: 'var(--border-color)',
    margin: '12px 0 16px',
  },
  formTitle: {
    margin: '0 0 14px',
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 4,
    marginTop: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    fontSize: 14,
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 6,
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  },
  selectWrapper: {
    position: 'relative',
  },
  select: {
    width: '100%',
    padding: '9px 32px 9px 12px',
    fontSize: 14,
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 6,
    outline: 'none',
    appearance: 'none' as const,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  selectIcon: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none' as const,
    color: 'var(--text-secondary)',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 20,
    paddingBottom: 4,
  },
  cancelBtn: {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-color)',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  saveBtn: {
    padding: '8px 20px',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-on-accent)',
    backgroundColor: 'var(--accent-color)',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  /* Footer */
  footer: {
    padding: '12px 20px',
    borderTop: '1px solid var(--node-border)',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-on-accent)',
    backgroundColor: 'var(--accent-color)',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

export default CredentialsManager;
