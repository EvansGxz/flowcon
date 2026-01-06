/**
 * Helper para obtener colores de estado usando variables CSS
 * Estos colores coinciden con las variables definidas en src/index.css
 */

export const statusColors = {
  error: 'var(--error-color)',
  errorBg: 'var(--error-bg)',
  errorBorder: 'var(--error-border)',
  success: 'var(--success-color)',
  successBg: 'var(--success-bg)',
  successBorder: 'var(--success-border)',
  warning: 'var(--warning-color)',
  warningBg: 'var(--warning-bg)',
  warningBorder: 'var(--warning-border)',
  info: 'var(--info-color)',
  infoBg: 'var(--info-bg)',
  infoBorder: 'var(--info-border)',
  neutral: 'var(--neutral-color)',
};

/**
 * Obtiene el color de estado basado en el status y errorCode
 * @param {string} status - Estado del nodo/run
 * @param {string} errorCode - Código de error opcional
 * @returns {string} Color CSS variable
 */
export function getStatusColor(status, errorCode = null) {
  // Si es un error de timeout, usar color warning
  if (errorCode === 'NODE_TIMEOUT' || errorCode === 'RUN_TIMEOUT') {
    return statusColors.warning;
  }
  
  switch (status) {
    case 'success':
    case 'completed':
      return statusColors.success;
    case 'error':
      return statusColors.error;
    case 'running':
    case 'pending':
      return statusColors.warning;
    case 'cancelled':
      return statusColors.neutral;
    default:
      return statusColors.neutral;
  }
}

/**
 * Obtiene el color de fondo de estado
 */
export function getStatusBgColor(status, errorCode = null) {
  if (errorCode === 'NODE_TIMEOUT' || errorCode === 'RUN_TIMEOUT') {
    return statusColors.warningBg;
  }
  
  switch (status) {
    case 'success':
    case 'completed':
      return statusColors.successBg;
    case 'error':
      return statusColors.errorBg;
    case 'running':
    case 'pending':
      return statusColors.warningBg;
    default:
      return 'transparent';
  }
}

/**
 * Obtiene el color de borde de estado
 */
export function getStatusBorderColor(status, errorCode = null) {
  if (errorCode === 'NODE_TIMEOUT' || errorCode === 'RUN_TIMEOUT') {
    return statusColors.warningBorder;
  }
  
  switch (status) {
    case 'success':
    case 'completed':
      return statusColors.successBorder;
    case 'error':
      return statusColors.errorBorder;
    case 'running':
    case 'pending':
      return statusColors.warningBorder;
    default:
      return 'transparent';
  }
}
