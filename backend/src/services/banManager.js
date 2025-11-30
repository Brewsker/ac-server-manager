/**
 * Ban Manager Service
 * 
 * Manages player bans with persistence to JSON file
 * Supports permanent and timed bans
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const BANS_FILE = path.join(process.cwd(), 'data', 'bans.json');

/**
 * Ensure bans file exists
 */
async function ensureBansFile() {
  try {
    await fs.access(BANS_FILE);
  } catch {
    // File doesn't exist, create it
    const dataDir = path.dirname(BANS_FILE);
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(BANS_FILE, JSON.stringify({ bans: [] }, null, 2));
  }
}

/**
 * Read all bans from file
 */
async function readBans() {
  await ensureBansFile();
  const content = await fs.readFile(BANS_FILE, 'utf-8');
  return JSON.parse(content);
}

/**
 * Write bans to file
 */
async function writeBans(data) {
  await fs.writeFile(BANS_FILE, JSON.stringify(data, null, 2));
}

/**
 * Get all active bans (not expired)
 */
export async function getBans() {
  const data = await readBans();
  const now = Date.now();
  
  // Filter out expired bans
  const activeBans = data.bans.filter(ban => {
    if (ban.duration === 0) return true; // Permanent ban
    
    const expiresAt = ban.bannedAt + (ban.duration * 60 * 60 * 1000);
    return expiresAt > now;
  });
  
  return activeBans;
}

/**
 * Get all bans including expired (for history)
 */
export async function getAllBans() {
  const data = await readBans();
  return data.bans;
}

/**
 * Check if a Steam ID is banned
 * @param {string} steamId
 * @returns {Object|null} Ban object if banned, null if not
 */
export async function checkBan(steamId) {
  const activeBans = await getBans();
  return activeBans.find(ban => ban.steamId === steamId) || null;
}

/**
 * Add a new ban
 * @param {Object} banData - { steamId, reason, duration, bannedBy, bannedAt }
 */
export async function addBan(banData) {
  const data = await readBans();
  
  // Check if already banned
  const existingBan = data.bans.find(b => b.steamId === banData.steamId && b.duration === 0);
  if (existingBan) {
    console.log(`[BanManager] Player ${banData.steamId} already permanently banned`);
    return existingBan;
  }
  
  const ban = {
    id: uuidv4(),
    steamId: banData.steamId,
    playerName: banData.playerName || 'Unknown',
    reason: banData.reason || 'No reason provided',
    duration: banData.duration || 0, // 0 = permanent
    bannedBy: banData.bannedBy || 'system',
    bannedAt: banData.bannedAt || Date.now(),
    expiresAt: banData.duration > 0 
      ? (banData.bannedAt || Date.now()) + (banData.duration * 60 * 60 * 1000)
      : null
  };
  
  data.bans.push(ban);
  await writeBans(data);
  
  console.log(`[BanManager] Added ban for ${ban.steamId}: ${ban.reason} (${ban.duration ? ban.duration + 'h' : 'permanent'})`);
  
  return ban;
}

/**
 * Remove a ban by ID
 * @param {string} banId
 */
export async function removeBan(banId) {
  const data = await readBans();
  const index = data.bans.findIndex(b => b.id === banId);
  
  if (index === -1) {
    throw new Error('Ban not found');
  }
  
  const removed = data.bans.splice(index, 1)[0];
  await writeBans(data);
  
  console.log(`[BanManager] Removed ban for ${removed.steamId}`);
  
  return removed;
}

/**
 * Remove ban by Steam ID
 * @param {string} steamId
 */
export async function removeBanBySteamId(steamId) {
  const data = await readBans();
  const originalLength = data.bans.length;
  
  data.bans = data.bans.filter(b => b.steamId !== steamId);
  
  if (data.bans.length === originalLength) {
    throw new Error('No ban found for this Steam ID');
  }
  
  await writeBans(data);
  
  console.log(`[BanManager] Removed all bans for ${steamId}`);
  
  return { steamId, removed: originalLength - data.bans.length };
}

/**
 * Clean up expired bans from storage
 */
export async function cleanupExpiredBans() {
  const data = await readBans();
  const now = Date.now();
  const originalLength = data.bans.length;
  
  data.bans = data.bans.filter(ban => {
    if (ban.duration === 0) return true; // Keep permanent bans
    
    const expiresAt = ban.bannedAt + (ban.duration * 60 * 60 * 1000);
    return expiresAt > now;
  });
  
  const removed = originalLength - data.bans.length;
  
  if (removed > 0) {
    await writeBans(data);
    console.log(`[BanManager] Cleaned up ${removed} expired bans`);
  }
  
  return { removed };
}
