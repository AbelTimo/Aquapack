import * as SQLite from 'expo-sqlite';
import uuid from 'react-native-uuid';

let db: SQLite.SQLiteDatabase;

export const initDatabase = async (): Promise<void> => {
  db = await SQLite.openDatabaseAsync('aquapack.db');

  // Create tables
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- Projects (cached from server)
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      client TEXT,
      region TEXT,
      description TEXT,
      isActive INTEGER DEFAULT 1,
      userRole TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      lastSyncedAt TEXT
    );

    -- Sites
    CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      localId TEXT UNIQUE,
      projectId TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      accuracy REAL,
      altitude REAL,
      description TEXT,
      siteType TEXT,
      accessNotes TEXT,
      qaStatus TEXT DEFAULT 'PENDING',
      syncStatus TEXT DEFAULT 'PENDING',
      createdBy TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY (projectId) REFERENCES projects(id)
    );

    -- Boreholes
    CREATE TABLE IF NOT EXISTS boreholes (
      id TEXT PRIMARY KEY,
      localId TEXT UNIQUE,
      siteId TEXT NOT NULL,
      name TEXT NOT NULL,
      wellType TEXT NOT NULL,
      totalDepth REAL NOT NULL,
      depthUnit TEXT DEFAULT 'meters',
      drillingDate TEXT,
      drillingMethod TEXT,
      driller TEXT,
      diameter REAL,
      casingDetails TEXT,
      screenIntervals TEXT,
      lithologyLog TEXT,
      staticWaterLevel REAL,
      notes TEXT,
      qaStatus TEXT DEFAULT 'PENDING',
      syncStatus TEXT DEFAULT 'PENDING',
      createdBy TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY (siteId) REFERENCES sites(id)
    );

    -- Water Level Measurements
    CREATE TABLE IF NOT EXISTS water_levels (
      id TEXT PRIMARY KEY,
      localId TEXT UNIQUE,
      siteId TEXT NOT NULL,
      boreholeId TEXT,
      measurementDatetime TEXT NOT NULL,
      depthToWater REAL NOT NULL,
      depthUnit TEXT DEFAULT 'meters',
      measurementMethod TEXT NOT NULL,
      measurementType TEXT DEFAULT 'static',
      referencePoint TEXT,
      notes TEXT,
      qaStatus TEXT DEFAULT 'PENDING',
      syncStatus TEXT DEFAULT 'PENDING',
      createdBy TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY (siteId) REFERENCES sites(id),
      FOREIGN KEY (boreholeId) REFERENCES boreholes(id)
    );

    -- Pump Tests
    CREATE TABLE IF NOT EXISTS pump_tests (
      id TEXT PRIMARY KEY,
      localId TEXT UNIQUE,
      siteId TEXT NOT NULL,
      boreholeId TEXT,
      testType TEXT NOT NULL,
      testName TEXT,
      startDatetime TEXT NOT NULL,
      endDatetime TEXT,
      staticWaterLevel REAL,
      pumpDepth REAL,
      pumpType TEXT,
      notes TEXT,
      qaStatus TEXT DEFAULT 'PENDING',
      syncStatus TEXT DEFAULT 'PENDING',
      createdBy TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY (siteId) REFERENCES sites(id),
      FOREIGN KEY (boreholeId) REFERENCES boreholes(id)
    );

    -- Pump Test Entries
    CREATE TABLE IF NOT EXISTS pump_test_entries (
      id TEXT PRIMARY KEY,
      localId TEXT UNIQUE,
      pumpTestId TEXT NOT NULL,
      elapsedMinutes REAL NOT NULL,
      elapsedSeconds REAL,
      depthToWater REAL NOT NULL,
      drawdown REAL,
      discharge REAL,
      dischargeUnit TEXT DEFAULT 'l/s',
      notes TEXT,
      syncStatus TEXT DEFAULT 'PENDING',
      createdAt TEXT,
      FOREIGN KEY (pumpTestId) REFERENCES pump_tests(id)
    );

    -- Water Quality Readings
    CREATE TABLE IF NOT EXISTS water_quality (
      id TEXT PRIMARY KEY,
      localId TEXT UNIQUE,
      siteId TEXT NOT NULL,
      boreholeId TEXT,
      sampleDatetime TEXT NOT NULL,
      sampleId TEXT,
      temperature REAL,
      temperatureUnit TEXT DEFAULT 'celsius',
      ph REAL,
      electricalConductivity REAL,
      ecUnit TEXT DEFAULT 'uS/cm',
      totalDissolvedSolids REAL,
      tdsUnit TEXT DEFAULT 'mg/L',
      dissolvedOxygen REAL,
      doUnit TEXT DEFAULT 'mg/L',
      turbidity REAL,
      turbidityUnit TEXT DEFAULT 'NTU',
      redoxPotential REAL,
      instrumentId TEXT,
      calibrationDate TEXT,
      notes TEXT,
      qaStatus TEXT DEFAULT 'PENDING',
      syncStatus TEXT DEFAULT 'PENDING',
      createdBy TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY (siteId) REFERENCES sites(id),
      FOREIGN KEY (boreholeId) REFERENCES boreholes(id)
    );

    -- Media (photos)
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      localId TEXT UNIQUE,
      linkedEntityType TEXT NOT NULL,
      linkedEntityId TEXT NOT NULL,
      fileName TEXT NOT NULL,
      fileType TEXT NOT NULL,
      fileSize INTEGER,
      localPath TEXT,
      remoteUrl TEXT,
      caption TEXT,
      capturedAt TEXT,
      latitude REAL,
      longitude REAL,
      syncStatus TEXT DEFAULT 'PENDING',
      createdAt TEXT
    );

    -- Sync Queue
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      entityType TEXT NOT NULL,
      entityId TEXT NOT NULL,
      action TEXT NOT NULL,
      payload TEXT,
      retryCount INTEGER DEFAULT 0,
      lastError TEXT,
      createdAt TEXT,
      processedAt TEXT
    );

    -- Sync Log
    CREATE TABLE IF NOT EXISTS sync_log (
      id TEXT PRIMARY KEY,
      direction TEXT NOT NULL,
      entityType TEXT,
      itemCount INTEGER,
      status TEXT,
      error TEXT,
      createdAt TEXT
    );
  `);

  console.log('Database initialized');
};

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

// Generate UUID
export const generateId = (): string => {
  return uuid.v4() as string;
};

// Helper to get current ISO timestamp
export const now = (): string => {
  return new Date().toISOString();
};

// ============================================
// SITES
// ============================================

export interface LocalSite {
  id: string;
  localId: string;
  projectId: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  description?: string;
  siteType?: string;
  accessNotes?: string;
  qaStatus: string;
  syncStatus: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export const createSite = async (site: Omit<LocalSite, 'id' | 'localId' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'qaStatus'>): Promise<LocalSite> => {
  const id = generateId();
  const localId = id;
  const timestamp = now();

  await db.runAsync(
    `INSERT INTO sites (id, localId, projectId, name, code, latitude, longitude, accuracy, altitude, description, siteType, accessNotes, qaStatus, syncStatus, createdBy, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, localId, site.projectId, site.name, site.code, site.latitude, site.longitude, site.accuracy || null, site.altitude || null, site.description || null, site.siteType || null, site.accessNotes || null, 'PENDING', 'PENDING', site.createdBy || null, timestamp, timestamp]
  );

  // Add to sync queue
  await addToSyncQueue('site', id, 'create');

  return {
    id,
    localId,
    ...site,
    qaStatus: 'PENDING',
    syncStatus: 'PENDING',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

export const getSitesByProject = async (projectId: string): Promise<LocalSite[]> => {
  const result = await db.getAllAsync<LocalSite>(
    'SELECT * FROM sites WHERE projectId = ? ORDER BY createdAt DESC',
    [projectId]
  );
  return result;
};

export const getSiteById = async (id: string): Promise<LocalSite | null> => {
  const result = await db.getFirstAsync<LocalSite>(
    'SELECT * FROM sites WHERE id = ? OR localId = ?',
    [id, id]
  );
  return result || null;
};

export const updateSite = async (id: string, updates: Partial<LocalSite>): Promise<void> => {
  const setClauses: string[] = [];
  const values: any[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'localId' && key !== 'createdAt') {
      setClauses.push(`${key} = ?`);
      values.push(value);
    }
  });

  setClauses.push('updatedAt = ?');
  values.push(now());

  if (updates.syncStatus !== 'SYNCED') {
    setClauses.push('syncStatus = ?');
    values.push('PENDING');
  }

  values.push(id);

  await db.runAsync(
    `UPDATE sites SET ${setClauses.join(', ')} WHERE id = ? OR localId = ?`,
    [...values, id]
  );

  if (updates.syncStatus !== 'SYNCED') {
    await addToSyncQueue('site', id, 'update');
  }
};

// ============================================
// BOREHOLES
// ============================================

export interface LocalBorehole {
  id: string;
  localId: string;
  siteId: string;
  name: string;
  wellType: string;
  totalDepth: number;
  depthUnit: string;
  drillingDate?: string;
  drillingMethod?: string;
  driller?: string;
  diameter?: number;
  casingDetails?: string;
  screenIntervals?: string;
  lithologyLog?: string;
  staticWaterLevel?: number;
  notes?: string;
  qaStatus: string;
  syncStatus: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export const createBorehole = async (borehole: Omit<LocalBorehole, 'id' | 'localId' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'qaStatus'>): Promise<LocalBorehole> => {
  const id = generateId();
  const localId = id;
  const timestamp = now();

  await db.runAsync(
    `INSERT INTO boreholes (id, localId, siteId, name, wellType, totalDepth, depthUnit, drillingDate, drillingMethod, driller, diameter, casingDetails, screenIntervals, lithologyLog, staticWaterLevel, notes, qaStatus, syncStatus, createdBy, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, localId, borehole.siteId, borehole.name, borehole.wellType, borehole.totalDepth, borehole.depthUnit, borehole.drillingDate || null, borehole.drillingMethod || null, borehole.driller || null, borehole.diameter || null, borehole.casingDetails || null, borehole.screenIntervals || null, borehole.lithologyLog || null, borehole.staticWaterLevel || null, borehole.notes || null, 'PENDING', 'PENDING', borehole.createdBy || null, timestamp, timestamp]
  );

  await addToSyncQueue('borehole', id, 'create');

  return {
    id,
    localId,
    ...borehole,
    qaStatus: 'PENDING',
    syncStatus: 'PENDING',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

export const getBoreholesBySite = async (siteId: string): Promise<LocalBorehole[]> => {
  return db.getAllAsync<LocalBorehole>(
    'SELECT * FROM boreholes WHERE siteId = ? ORDER BY createdAt DESC',
    [siteId]
  );
};

// ============================================
// WATER LEVELS
// ============================================

export interface LocalWaterLevel {
  id: string;
  localId: string;
  siteId: string;
  boreholeId?: string;
  measurementDatetime: string;
  depthToWater: number;
  depthUnit: string;
  measurementMethod: string;
  measurementType: string;
  referencePoint?: string;
  notes?: string;
  qaStatus: string;
  syncStatus: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export const createWaterLevel = async (wl: Omit<LocalWaterLevel, 'id' | 'localId' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'qaStatus'>): Promise<LocalWaterLevel> => {
  const id = generateId();
  const localId = id;
  const timestamp = now();

  await db.runAsync(
    `INSERT INTO water_levels (id, localId, siteId, boreholeId, measurementDatetime, depthToWater, depthUnit, measurementMethod, measurementType, referencePoint, notes, qaStatus, syncStatus, createdBy, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, localId, wl.siteId, wl.boreholeId || null, wl.measurementDatetime, wl.depthToWater, wl.depthUnit, wl.measurementMethod, wl.measurementType, wl.referencePoint || null, wl.notes || null, 'PENDING', 'PENDING', wl.createdBy || null, timestamp, timestamp]
  );

  await addToSyncQueue('water_level', id, 'create');

  return {
    id,
    localId,
    ...wl,
    qaStatus: 'PENDING',
    syncStatus: 'PENDING',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

export const getWaterLevelsBySite = async (siteId: string): Promise<LocalWaterLevel[]> => {
  return db.getAllAsync<LocalWaterLevel>(
    'SELECT * FROM water_levels WHERE siteId = ? ORDER BY measurementDatetime DESC',
    [siteId]
  );
};

// ============================================
// PROJECTS
// ============================================

export interface LocalProject {
  id: string;
  name: string;
  code: string;
  client?: string;
  region?: string;
  description?: string;
  isActive: number;
  userRole?: string;
  createdAt?: string;
  updatedAt?: string;
  lastSyncedAt?: string;
}

export const saveProjects = async (projects: LocalProject[]): Promise<void> => {
  const timestamp = now();

  for (const project of projects) {
    await db.runAsync(
      `INSERT OR REPLACE INTO projects (id, name, code, client, region, description, isActive, userRole, createdAt, updatedAt, lastSyncedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [project.id, project.name, project.code, project.client || null, project.region || null, project.description || null, project.isActive ? 1 : 0, project.userRole || null, project.createdAt || timestamp, project.updatedAt || timestamp, timestamp]
    );
  }
};

export const getProjects = async (): Promise<LocalProject[]> => {
  return db.getAllAsync<LocalProject>('SELECT * FROM projects WHERE isActive = 1 ORDER BY name');
};

// ============================================
// SYNC QUEUE
// ============================================

export interface SyncQueueItem {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  payload?: string;
  retryCount: number;
  lastError?: string;
  createdAt: string;
  processedAt?: string;
}

export const addToSyncQueue = async (entityType: string, entityId: string, action: string, payload?: object): Promise<void> => {
  const id = generateId();
  await db.runAsync(
    `INSERT INTO sync_queue (id, entityType, entityId, action, payload, retryCount, createdAt)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
    [id, entityType, entityId, action, payload ? JSON.stringify(payload) : null, now()]
  );
};

export const getPendingSyncItems = async (): Promise<SyncQueueItem[]> => {
  return db.getAllAsync<SyncQueueItem>(
    'SELECT * FROM sync_queue WHERE processedAt IS NULL AND retryCount < 5 ORDER BY createdAt ASC'
  );
};

export const markSyncItemProcessed = async (id: string): Promise<void> => {
  await db.runAsync(
    'UPDATE sync_queue SET processedAt = ? WHERE id = ?',
    [now(), id]
  );
};

export const markSyncItemFailed = async (id: string, error: string): Promise<void> => {
  await db.runAsync(
    'UPDATE sync_queue SET retryCount = retryCount + 1, lastError = ? WHERE id = ?',
    [error, id]
  );
};

export const getSyncStats = async (): Promise<{ pending: number; failed: number }> => {
  const pending = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM sync_queue WHERE processedAt IS NULL AND retryCount < 5'
  );
  const failed = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM sync_queue WHERE retryCount >= 5'
  );

  return {
    pending: pending?.count || 0,
    failed: failed?.count || 0,
  };
};

export default {
  initDatabase,
  getDatabase,
  generateId,
  now,
  createSite,
  getSitesByProject,
  getSiteById,
  updateSite,
  createBorehole,
  getBoreholesBySite,
  createWaterLevel,
  getWaterLevelsBySite,
  saveProjects,
  getProjects,
  addToSyncQueue,
  getPendingSyncItems,
  markSyncItemProcessed,
  markSyncItemFailed,
  getSyncStats,
};
