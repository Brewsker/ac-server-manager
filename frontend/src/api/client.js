import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Server endpoints
export const getServerStatus = async () => {
  const response = await client.get('/server/status');
  return response.data;
};

export const startServer = async () => {
  const response = await client.post('/server/start');
  return response.data;
};

export const stopServer = async () => {
  const response = await client.post('/server/stop');
  return response.data;
};

export const restartServer = async () => {
  const response = await client.post('/server/restart');
  return response.data;
};

export const getServerLogs = async (lines = 100) => {
  const response = await client.get('/server/logs', { params: { lines } });
  return response.data;
};

// Config endpoints
export const getConfig = async () => {
  const response = await client.get('/config');
  return response.data;
};

export const updateConfig = async (config) => {
  const response = await client.put('/config', config);
  return response.data;
};

export const applyConfig = async () => {
  const response = await client.post('/config/apply');
  return response.data;
};

export const getDefaultConfig = async () => {
  const response = await client.get('/config/default');
  return response.data;
};

export const loadDefaultConfig = async () => {
  const response = await client.post('/config/load-default');
  return response.data;
};

export const getActiveConfig = async () => {
  const response = await client.get('/config/active');
  return response.data;
};

export const loadActiveConfig = async () => {
  const response = await client.post('/config/load-active');
  return response.data;
};

export const getPresets = async () => {
  const response = await client.get('/config/presets');
  return response.data;
};

export const savePreset = async (name, description = '') => {
  const response = await client.post('/config/presets', { name, description });
  return response.data;
};

export const loadPreset = async (id) => {
  const response = await client.post(`/config/presets/${id}/load`);
  return response.data;
};

export const duplicatePreset = async (id, name) => {
  const response = await client.post(`/config/presets/${id}/duplicate`, { name });
  return response.data;
};

export const renamePreset = async (id, name) => {
  const response = await client.patch(`/config/presets/${id}`, { name });
  return response.data;
};

export const deletePreset = async (id) => {
  const response = await client.delete(`/config/presets/${id}`);
  return response.data;
};

export const openPresetsFolder = async () => {
  const response = await client.post('/config/presets/open-folder');
  return response.data;
};

// Process management endpoints
export const checkACInstallation = async () => {
  const response = await client.get('/process/installation');
  return response.data;
};

export const startServerInstance = async (presetId) => {
  const response = await client.post(`/process/start/${presetId}`);
  return response.data;
};

export const stopServerInstance = async (presetId) => {
  const response = await client.post(`/process/stop/${presetId}`);
  return response.data;
};

export const restartServerInstance = async (presetId) => {
  const response = await client.post(`/process/restart/${presetId}`);
  return response.data;
};

export const getServerInstanceStatus = async (presetId) => {
  const response = await client.get(`/process/status/${presetId}`);
  return response.data;
};

export const getAllServerStatuses = async () => {
  const response = await client.get('/process/status');
  return response.data;
};

export const getServerInstanceLogs = async (presetId, lines = 100) => {
  const response = await client.get(`/process/logs/${presetId}`, { params: { lines } });
  return response.data;
};

export const stopAllServerInstances = async () => {
  const response = await client.post('/process/stop-all');
  return response.data;
};

// Content endpoints
export const getTracks = async () => {
  const response = await client.get('/content/tracks');
  return response.data;
};

export const getCars = async () => {
  const response = await client.get('/content/cars');
  return response.data;
};

export const getWeather = async () => {
  const response = await client.get('/content/weather');
  return response.data;
};

export const scanContent = async () => {
  const response = await client.post('/content/scan');
  return response.data;
};

export const getAllTires = async () => {
  const response = await client.get('/content/tires/all');
  return response.data;
};

export const getTiresForCars = async (carIds) => {
  const response = await client.post('/content/tires/for-cars', { carIds });
  return response.data;
};

// Entry endpoints
export const getEntries = async () => {
  const response = await client.get('/entries');
  return response.data;
};

// Player endpoints
export const getPlayers = async () => {
  const response = await client.get('/players');
  return response.data;
};

export const getSessionInfo = async () => {
  const response = await client.get('/players/session');
  return response.data;
};

export const kickPlayer = async (steamId, reason = '') => {
  const response = await client.post(`/players/${steamId}/kick`, { reason });
  return response.data;
};

export const banPlayer = async (steamId, reason = '', duration = 0, playerName = '') => {
  const response = await client.post(`/players/${steamId}/ban`, { reason, duration, playerName });
  return response.data;
};

export const forceSpectator = async (steamId) => {
  const response = await client.post(`/players/${steamId}/spectator`);
  return response.data;
};

export const sendPlayerMessage = async (message, playerId = null) => {
  const response = await client.post('/players/message', { message, playerId });
  return response.data;
};

export const nextSession = async () => {
  const response = await client.post('/players/session/next');
  return response.data;
};

export const getPlayerHistory = async (steamId) => {
  const response = await client.get(`/players/${steamId}/history`);
  return response.data;
};

export const getBans = async () => {
  const response = await client.get('/players/bans');
  return response.data;
};

export const addBan = async (banData) => {
  const response = await client.post('/players/bans', banData);
  return response.data;
};

export const removeBan = async (banId) => {
  const response = await client.delete(`/players/bans/${banId}`);
  return response.data;
};

export const checkBan = async (steamId) => {
  const response = await client.get(`/players/bans/check/${steamId}`);
  return response.data;
};

// Entry endpoints (legacy - will be deprecated)
export const addEntry = async (entry) => {
  const response = await client.post('/entries', entry);
  return response.data;
};

export const updateEntry = async (id, entry) => {
  const response = await client.put(`/entries/${id}`, entry);
  return response.data;
};

export const deleteEntry = async (id) => {
  const response = await client.delete(`/entries/${id}`);
  return response.data;
};

// Setup endpoints
export const getSetupStatus = async () => {
  const response = await client.get('/setup/status');
  return response.data;
};

export const autoDetectAC = async () => {
  const response = await client.get('/setup/auto-detect');
  return response.data;
};

export const validateACPath = async (path) => {
  const response = await client.post('/setup/validate', { path });
  return response.data;
};

export const saveSetup = async (path) => {
  const response = await client.post('/setup/configure', { path });
  return response.data;
};

export default {
  getServerStatus,
  startServer,
  stopServer,
  restartServer,
  getServerLogs,
  getConfig,
  updateConfig,
  applyConfig,
  getDefaultConfig,
  loadDefaultConfig,
  getActiveConfig,
  loadActiveConfig,
  getPresets,
  savePreset,
  loadPreset,
  duplicatePreset,
  renamePreset,
  deletePreset,
  getTracks,
  getCars,
  getWeather,
  scanContent,
  getAllTires,
  getTiresForCars,
  getEntries,
  addEntry,
  updateEntry,
  deleteEntry,
  getPlayers,
  getSessionInfo,
  kickPlayer,
  banPlayer,
  forceSpectator,
  sendPlayerMessage,
  nextSession,
  getPlayerHistory,
  getBans,
  addBan,
  removeBan,
  checkBan,
  getSetupStatus,
  autoDetectAC,
  validateACPath,
  saveSetup,
};
