import axios from 'axios';

// Centralized API Base URL configuration using Vite environment variables
// For same-origin Vercel deployments, VITE_API_URL can be empty (defaults to relative paths)
const defaultDevUrl = 'http://127.0.0.1:8000';
const rawApiUrl = import.meta.env.VITE_API_URL !== undefined 
  ? import.meta.env.VITE_API_URL 
  : (import.meta.env.DEV ? defaultDevUrl : '');

export const API_BASE_URL = rawApiUrl ? rawApiUrl.replace(/\/+$/, '') : '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Helper to construct absolute image/media URLs for static backend assets
 */
export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (!API_BASE_URL) return path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};


// Centralized API Methods for DEBRIS-SENTRY Backend Integration

export const fetchHealth = async () => {
  try {
    const res = await apiClient.get('/api/v1/health');
    return res.data;
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
};

export const fetchSatellites = async (params = {}) => {
  const res = await apiClient.get('/api/v1/satellites', { params });
  return res.data;
};

export const fetchSatelliteById = async (id) => {
  const res = await apiClient.get(`/api/v1/satellites/${id}`);
  return res.data;
};

export const propagateSatellite = async (id) => {
  const res = await apiClient.get(`/api/v1/propagate/${id}`);
  return res.data;
};

export const fetchTrajectory = async (id, hours = 24) => {
  const res = await apiClient.get(`/api/v1/trajectory/${id}`, { params: { hours } });
  return res.data;
};

export const propagateAll = async () => {
  const res = await apiClient.get('/api/v1/propagate-all');
  return res.data;
};

export const fetchDebrisObjects = async () => {
  const res = await apiClient.get('/api/debris');
  return res.data;
};

export const fetchOrbits = async () => {
  const res = await apiClient.get('/api/orbits');
  return res.data;
};

export const fetchConjunctions = async () => {
  const res = await apiClient.get('/api/v1/conjunctions');
  return res.data;
};

export const screenConjunctionPair = async (primaryId, secondaryId) => {
  const res = await apiClient.post('/api/v1/conjunctions/screen', null, {
    params: { primary_id: primaryId, secondary_id: secondaryId }
  });
  return res.data;
};

export const reviewConjunction = async (id) => {
  const res = await apiClient.post(`/api/v1/conjunctions/${id}/review`);
  return res.data;
};

export const fetchThreatProfile = async (noradId) => {
  const res = await apiClient.get(`/api/v1/conjunctions/${noradId}/threat-profile`);
  return res.data;
};

export const detectAIDebris = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post('/api/v1/detect', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const fetchAIDetectionsLog = async () => {
  const res = await apiClient.get('/api/v1/ai/detections');
  return res.data;
};

export const fetchAnalyticsSummary = async () => {
  const res = await apiClient.get('/api/v1/analytics');
  return res.data;
};

export const fetchConstellations = async () => {
  const res = await apiClient.get('/api/v1/constellations');
  return res.data;
};

export const fetchSpaceEnvironment = async () => {
  const res = await apiClient.get('/api/v1/space-environment');
  return res.data;
};

export const fetchCommunicationRisks = async () => {
  const res = await apiClient.get('/api/v1/communication-risk');
  return res.data;
};

export const fetchProtectedAssets = async () => {
  const res = await apiClient.get('/api/v1/protected-assets');
  return res.data;
};

export const fetchCelestialEvents = async () => {
  const res = await apiClient.get('/api/v1/celestial-events');
  return res.data;
};

export const fetchReEntryRisks = async () => {
  const res = await apiClient.get('/api/v1/reentry-risks');
  return res.data;
};

export const simulateWhatIf = async (id, reqData) => {
  const res = await apiClient.post(`/api/v1/conjunctions/${id}/what-if`, reqData);
  return res.data;
};

export const syncLiveCelesTrak = async () => {
  const res = await apiClient.post('/api/v1/sync-live');
  return res.data;
};

export const fetchForecast = async (horizon = '24h') => {
  const res = await apiClient.get('/api/v1/forecast', { params: { horizon } });
  return res.data;
};

export const fetchNeoWarnings = async () => {
  const res = await apiClient.get('/api/v1/neo-warnings');
  return res.data;
};

export const fetchPublicAlerts = async (severity, region) => {
  const res = await apiClient.get('/api/v1/public-alerts', { params: { severity, region } });
  return res.data;
};

export const acknowledgePublicAlert = async (id) => {
  const res = await apiClient.post(`/api/v1/public-alerts/${id}/acknowledge`);
  return res.data;
};

export const fetchNotificationPreferences = async () => {
  const res = await apiClient.get('/api/v1/notification-preferences');
  return res.data;
};

export const updateNotificationPreferences = async (data) => {
  const res = await apiClient.post('/api/v1/notification-preferences', data);
  return res.data;
};

export default apiClient;
