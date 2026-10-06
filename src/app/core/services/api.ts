import { environment } from '../../../environments/environment';

/** Prefixe de toutes les routes du module tombola de hkod-api. */
export const API_ROOT = `${environment.apiBaseUrl.replace(/\/+$/, '')}/api/v1/tombola`;
export const PUBLIC_API = `${API_ROOT}/public`;
export const ADMIN_API = `${API_ROOT}/admin-console`;
