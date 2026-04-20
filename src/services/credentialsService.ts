/**
 * Servicio para CRUD de credenciales.
 * Las credenciales se guardan cifradas en el backend.
 * El frontend nunca ve los datos sensibles después de crearlas.
 */
import { apiGet, apiPost, apiPut, apiDelete } from './apiService';

export interface Credential {
  id: string;
  name: string;
  credential_type: 'openai' | 'azure_openai' | 'postgres' | 'http_bearer';
  created_at?: string;
  updated_at?: string;
}

export interface CreateCredentialPayload {
  name: string;
  credential_type: Credential['credential_type'];
  data: Record<string, unknown>;
}

/**
 * Lista credenciales del proyecto actual (sin datos sensibles).
 */
export async function listCredentials(): Promise<Credential[]> {
  return apiGet<Credential[]>('/credentials');
}

/**
 * Crea una credencial.
 */
export async function createCredential(
  payload: CreateCredentialPayload
): Promise<Credential> {
  return apiPost<Credential>('/credentials', payload);
}

/**
 * Actualiza nombre y/o datos de una credencial.
 */
export async function updateCredential(
  credentialId: string,
  payload: { name?: string; data?: Record<string, unknown> }
): Promise<Credential> {
  return apiPut<Credential>(`/credentials/${credentialId}`, payload);
}

/**
 * Elimina una credencial.
 */
export async function deleteCredential(
  credentialId: string
): Promise<void> {
  await apiDelete(`/credentials/${credentialId}`);
}

/**
 * Testea una credencial intentando conectar al servicio.
 */
export async function testCredential(
  credentialId: string
): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>(`/credentials/${credentialId}/test`, {});
}
