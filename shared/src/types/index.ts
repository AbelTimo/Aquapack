// ============================================
// AQUAPACK - Shared Types
// ============================================

// ---------- Enums ----------

export enum UserRole {
  FIELD_USER = 'FIELD_USER',
  TEAM_LEAD = 'TEAM_LEAD',
  DATA_MANAGER = 'DATA_MANAGER',
  ADMIN = 'ADMIN',
}

export enum SyncStatus {
  SYNCED = 'SYNCED',
  PENDING = 'PENDING',
  CONFLICT = 'CONFLICT',
  ERROR = 'ERROR',
}

export enum QAStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  FLAGGED = 'FLAGGED',
  REJECTED = 'REJECTED',
}

export enum WellType {
  BOREHOLE = 'BOREHOLE',
  DUG_WELL = 'DUG_WELL',
  SPRING = 'SPRING',
  PIEZOMETER = 'PIEZOMETER',
}

export enum PumpTestType {
  STEP_TEST = 'STEP_TEST',
  CONSTANT_RATE = 'CONSTANT_RATE',
  RECOVERY = 'RECOVERY',
  SLUG_TEST = 'SLUG_TEST',
}

export enum MeasurementMethod {
  MANUAL_TAPE = 'MANUAL_TAPE',
  PRESSURE_TRANSDUCER = 'PRESSURE_TRANSDUCER',
  SOUNDER = 'SOUNDER',
  OTHER = 'OTHER',
}

// ---------- Base Types ----------

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  syncStatus: SyncStatus;
  deviceId?: string;
  localId?: string; // For offline-created records
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  capturedAt: string;
}

// ---------- User & Auth ----------

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

// ---------- Organization & Project ----------

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
}

export interface Project extends BaseEntity {
  name: string;
  code: string;
  client?: string;
  region?: string;
  description?: string;
  organizationId: string;
  templateConfig?: ProjectTemplateConfig;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export interface ProjectTemplateConfig {
  enabledModules: string[];
  reportTemplateId?: string;
  customFields?: CustomFieldDefinition[];
  defaultUnits?: UnitPreferences;
}

export interface CustomFieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean';
  options?: string[];
  required: boolean;
}

export interface UnitPreferences {
  depth: 'meters' | 'feet';
  discharge: 'l/s' | 'm3/h' | 'gpm';
  conductivity: 'uS/cm' | 'mS/cm';
}

export interface ProjectAssignment {
  userId: string;
  projectId: string;
  role: UserRole;
  assignedAt: string;
}

// ---------- Site ----------

export interface Site extends BaseEntity {
  projectId: string;
  name: string;
  code: string;
  location: GeoLocation;
  description?: string;
  siteType?: string;
  accessNotes?: string;
  qaStatus: QAStatus;
}

// ---------- Borehole / Well ----------

export interface Borehole extends BaseEntity {
  siteId: string;
  name: string;
  wellType: WellType;
  totalDepth: number;
  depthUnit: 'meters' | 'feet';
  drillingDate?: string;
  drillingMethod?: string;
  driller?: string;
  diameter?: number;
  casingDetails?: CasingInterval[];
  screenIntervals?: ScreenInterval[];
  lithologyLog?: LithologyInterval[];
  staticWaterLevel?: number;
  notes?: string;
  qaStatus: QAStatus;
}

export interface CasingInterval {
  id: string;
  fromDepth: number;
  toDepth: number;
  material: string;
  diameter?: number;
}

export interface ScreenInterval {
  id: string;
  fromDepth: number;
  toDepth: number;
  slotSize?: number;
  material?: string;
}

export interface LithologyInterval {
  id: string;
  fromDepth: number;
  toDepth: number;
  primaryLithology: string;
  secondaryLithology?: string;
  description?: string;
  color?: string;
  grainSize?: string;
  waterBearing: boolean;
}

// ---------- Water Level Measurements ----------

export interface WaterLevelMeasurement extends BaseEntity {
  siteId: string;
  boreholeId?: string;
  measurementDatetime: string;
  depthToWater: number;
  depthUnit: 'meters' | 'feet';
  measurementMethod: MeasurementMethod;
  measurementType: 'static' | 'dynamic' | 'recovery';
  referencePoint?: string;
  notes?: string;
  qaStatus: QAStatus;
}

// ---------- Pump Test ----------

export interface PumpTest extends BaseEntity {
  siteId: string;
  boreholeId?: string;
  testType: PumpTestType;
  testName?: string;
  startDatetime: string;
  endDatetime?: string;
  staticWaterLevel?: number;
  pumpDepth?: number;
  pumpType?: string;
  notes?: string;
  qaStatus: QAStatus;
}

export interface PumpTestEntry extends BaseEntity {
  pumpTestId: string;
  elapsedMinutes: number;
  elapsedSeconds?: number;
  depthToWater: number;
  drawdown?: number;
  discharge?: number;
  dischargeUnit?: 'l/s' | 'm3/h' | 'gpm';
  notes?: string;
}

export interface PumpTestStep {
  id: string;
  pumpTestId: string;
  stepNumber: number;
  startMinutes: number;
  endMinutes: number;
  targetDischarge: number;
  actualDischarge?: number;
}

// ---------- Water Quality ----------

export interface WaterQualityReading extends BaseEntity {
  siteId: string;
  boreholeId?: string;
  sampleDatetime: string;
  sampleId?: string;

  // Field parameters
  temperature?: number;
  temperatureUnit: 'celsius' | 'fahrenheit';
  ph?: number;
  electricalConductivity?: number;
  ecUnit: 'uS/cm' | 'mS/cm';
  totalDissolvedSolids?: number;
  tdsUnit: 'mg/L' | 'ppm';
  dissolvedOxygen?: number;
  doUnit: 'mg/L' | '%sat';
  turbidity?: number;
  turbidityUnit: 'NTU' | 'FNU';
  redoxPotential?: number;

  // Instrument metadata
  instrumentId?: string;
  calibrationDate?: string;

  notes?: string;
  qaStatus: QAStatus;
}

// ---------- Media / Attachments ----------

export interface Media extends BaseEntity {
  linkedEntityType: 'site' | 'borehole' | 'pump_test' | 'water_quality' | 'water_level';
  linkedEntityId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath?: string; // Local path (offline)
  fileUrl?: string; // Remote URL (synced)
  caption?: string;
  capturedAt?: string;
  location?: GeoLocation;
  duration?: number; // Duration in seconds (for audio/video files)
}

// ---------- Review & Comments ----------

export interface ReviewComment extends BaseEntity {
  linkedEntityType: string;
  linkedEntityId: string;
  reviewerId: string;
  reviewerName: string;
  status: QAStatus;
  comment: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

// ---------- Sync ----------

export interface SyncPayload<T> {
  items: T[];
  lastSyncTimestamp: string;
  deviceId: string;
}

export interface SyncResponse<T> {
  created: T[];
  updated: T[];
  conflicts: SyncConflict<T>[];
  serverTimestamp: string;
}

export interface SyncConflict<T> {
  localItem: T;
  serverItem: T;
  conflictType: 'UPDATE_CONFLICT' | 'DELETE_CONFLICT';
  resolution?: 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGED';
}

export interface SyncStatus {
  lastSyncTime: string | null;
  pendingUploads: number;
  pendingDownloads: number;
  conflicts: number;
  isOnline: boolean;
  isSyncing: boolean;
}

// ---------- Reports ----------

export interface ReportRequest {
  projectId: string;
  reportType: 'field_summary' | 'borehole_completion' | 'pump_test' | 'water_quality';
  siteIds?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  includeMedia: boolean;
  includeCharts: boolean;
  templateId?: string;
}

export interface ReportResponse {
  reportId: string;
  downloadUrl: string;
  generatedAt: string;
  expiresAt: string;
}

// ---------- Dashboard ----------

export interface ProjectDashboard {
  projectId: string;
  sitesTotal: number;
  sitesCompleted: number;
  boreholesTotal: number;
  waterLevelCount: number;
  pumpTestCount: number;
  waterQualityCount: number;
  pendingReviewCount: number;
  flaggedCount: number;
  lastSyncTime: string | null;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  entityName: string;
  userId: string;
  userName: string;
  action: 'created' | 'updated' | 'reviewed' | 'flagged';
  timestamp: string;
}

// ---------- API Response Types ----------

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface PaginatedRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}
