// ============================================
// AQUAPACK - Shared Constants
// ============================================

// ---------- Lithology Options ----------

export const LITHOLOGY_PRIMARY = [
  'Clay',
  'Silt',
  'Sand',
  'Gravel',
  'Cobbles',
  'Boulders',
  'Sandstone',
  'Shale',
  'Limestone',
  'Dolomite',
  'Granite',
  'Basalt',
  'Gneiss',
  'Schist',
  'Quartzite',
  'Slate',
  'Conglomerate',
  'Marl',
  'Chalk',
  'Laterite',
  'Weathered Rock',
  'Fractured Rock',
  'Alluvium',
  'Fill Material',
  'Topsoil',
  'Other',
] as const;

export const LITHOLOGY_COLORS = [
  'White',
  'Grey',
  'Dark Grey',
  'Black',
  'Brown',
  'Dark Brown',
  'Tan',
  'Yellow',
  'Orange',
  'Red',
  'Pink',
  'Green',
  'Blue',
  'Mottled',
  'Variegated',
] as const;

export const GRAIN_SIZES = [
  'Very Fine',
  'Fine',
  'Medium',
  'Coarse',
  'Very Coarse',
  'Mixed',
] as const;

// ---------- Casing Materials ----------

export const CASING_MATERIALS = [
  'PVC',
  'uPVC',
  'Steel',
  'Stainless Steel',
  'HDPE',
  'Fiberglass',
  'Concrete',
  'Other',
] as const;

// ---------- Drilling Methods ----------

export const DRILLING_METHODS = [
  'Rotary Air',
  'Rotary Mud',
  'Cable Tool',
  'Percussion',
  'Hand Auger',
  'Hollow Stem Auger',
  'Sonic',
  'Direct Push',
  'Jetting',
  'Manual',
  'Other',
] as const;

// ---------- Measurement Reference Points ----------

export const REFERENCE_POINTS = [
  'Top of Casing (TOC)',
  'Ground Level (GL)',
  'Top of Wellhead',
  'Survey Benchmark',
  'Other',
] as const;

// ---------- Water Quality Ranges (for validation/warnings) ----------

export const WQ_RANGES = {
  ph: { min: 0, max: 14, typicalMin: 6, typicalMax: 9 },
  ec: { min: 0, max: 100000, typicalMax: 5000, unit: 'uS/cm' },
  tds: { min: 0, max: 100000, typicalMax: 3000, unit: 'mg/L' },
  temperature: { min: -5, max: 100, typicalMin: 10, typicalMax: 35, unit: 'celsius' },
  turbidity: { min: 0, max: 10000, typicalMax: 100, unit: 'NTU' },
  do: { min: 0, max: 20, typicalMin: 4, typicalMax: 12, unit: 'mg/L' },
} as const;

// ---------- Units ----------

export const DEPTH_UNITS = ['meters', 'feet'] as const;
export const DISCHARGE_UNITS = ['l/s', 'm3/h', 'gpm'] as const;
export const CONDUCTIVITY_UNITS = ['uS/cm', 'mS/cm'] as const;
export const TDS_UNITS = ['mg/L', 'ppm'] as const;
export const TEMPERATURE_UNITS = ['celsius', 'fahrenheit'] as const;
export const DO_UNITS = ['mg/L', '%sat'] as const;
export const TURBIDITY_UNITS = ['NTU', 'FNU'] as const;

// ---------- Unit Conversion Helpers ----------

export const UNIT_CONVERSIONS = {
  // Depth
  metersToFeet: (m: number) => m * 3.28084,
  feetToMeters: (ft: number) => ft / 3.28084,

  // Discharge
  lsToM3h: (ls: number) => ls * 3.6,
  m3hToLs: (m3h: number) => m3h / 3.6,
  lsToGpm: (ls: number) => ls * 15.8503,
  gpmToLs: (gpm: number) => gpm / 15.8503,

  // Temperature
  celsiusToFahrenheit: (c: number) => (c * 9) / 5 + 32,
  fahrenheitToCelsius: (f: number) => ((f - 32) * 5) / 9,

  // Conductivity
  uScmToMScm: (us: number) => us / 1000,
  mScmToUScm: (ms: number) => ms * 1000,
} as const;

// ---------- Sync Settings ----------

export const SYNC_CONFIG = {
  autoSyncIntervalMs: 30000, // 30 seconds
  maxRetries: 3,
  retryDelayMs: 5000,
  batchSize: 50,
  conflictStrategy: 'LAST_WRITE_WINS' as const,
} as const;

// ---------- File Upload Limits ----------

export const FILE_LIMITS = {
  maxFileSizeMB: 50,
  maxFileSizeBytes: 50 * 1024 * 1024,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/heic', 'image/webp'],
  allowedDocTypes: ['application/pdf'],
  allowedAudioTypes: ['audio/m4a', 'audio/mp4', 'audio/aac', 'audio/mpeg'],
  maxPhotosPerRecord: 10,
  maxVoiceNotesPerRecord: 5,
} as const;

// ---------- Audio/Voice Note Limits ----------

export const AUDIO_LIMITS = {
  maxDurationSeconds: 120, // 2 minutes
  maxFileSizeMB: 10,
  maxFileSizeBytes: 10 * 1024 * 1024,
  allowedAudioTypes: ['audio/m4a', 'audio/mp4', 'audio/aac', 'audio/mpeg'],
  sampleRate: 44100,
  bitRate: 128000,
} as const;

// ---------- Report Templates ----------

export const REPORT_SECTIONS = [
  'cover_page',
  'table_of_contents',
  'executive_summary',
  'site_map',
  'site_coordinates_table',
  'borehole_construction',
  'lithology_logs',
  'water_levels_summary',
  'water_levels_chart',
  'pump_test_summary',
  'pump_test_charts',
  'water_quality_summary',
  'water_quality_charts',
  'photo_appendix',
  'data_appendix',
] as const;

// ---------- Status Colors for UI ----------

export const STATUS_COLORS = {
  SYNCED: '#22c55e', // green
  PENDING: '#f59e0b', // amber
  CONFLICT: '#ef4444', // red
  ERROR: '#ef4444', // red
  APPROVED: '#22c55e', // green
  FLAGGED: '#f59e0b', // amber
  REJECTED: '#ef4444', // red
} as const;

// ---------- Map Defaults ----------

export const MAP_DEFAULTS = {
  defaultZoom: 12,
  minZoom: 4,
  maxZoom: 18,
  clusterRadius: 50,
  defaultCenter: { lat: 0, lng: 0 },
} as const;
