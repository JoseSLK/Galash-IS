import { environment } from '../../../environments/environment';

const configuredApiBaseUrl = (environment as typeof environment & { apiBaseUrl?: string }).apiBaseUrl;

export const API_BASE_URL = (configuredApiBaseUrl ?? '/api').replace(/\/+$/, '') || '/api';
