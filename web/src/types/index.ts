// Aquapack Web Types

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'FIELD_USER' | 'TEAM_LEAD' | 'DATA_MANAGER' | 'ADMIN';
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

export interface Project {
  id: string;
  name: string;
  code: string;
  client?: string;
  region?: string;
  description?: string;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    sites: number;
  };
}

export interface Site {
  id: string;
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
  qaStatus: 'PENDING' | 'APPROVED' | 'FLAGGED' | 'REJECTED';
  syncStatus: 'SYNCED' | 'PENDING' | 'CONFLICT' | 'ERROR';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
    code: string;
  };
  creator?: {
    id: string;
    name: string;
  };
  _count?: {
    boreholes: number;
    waterLevels: number;
    pumpTests: number;
    waterQualityReadings: number;
  };
}

export interface Borehole {
  id: string;
  siteId: string;
  name: string;
  wellType: string;
  totalDepth: number;
  depthUnit: string;
  drillingDate?: string;
  drillingMethod?: string;
  driller?: string;
  diameter?: number;
  staticWaterLevel?: number;
  notes?: string;
  qaStatus: string;
  _count?: {
    waterLevels: number;
    pumpTests: number;
    waterQualityReadings: number;
  };
}

export interface WaterLevel {
  id: string;
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
}

export interface PumpTest {
  id: string;
  siteId: string;
  boreholeId?: string;
  testType: string;
  testName?: string;
  startDatetime: string;
  endDatetime?: string;
  staticWaterLevel?: number;
  pumpDepth?: number;
  pumpType?: string;
  notes?: string;
  qaStatus: string;
}

export interface WaterQuality {
  id: string;
  siteId: string;
  boreholeId?: string;
  sampleDatetime: string;
  sampleId?: string;
  temperature?: number;
  ph?: number;
  electricalConductivity?: number;
  totalDissolvedSolids?: number;
  dissolvedOxygen?: number;
  turbidity?: number;
  redoxPotential?: number;
  notes?: string;
  qaStatus: string;
}

export interface Media {
  id: string;
  linkedEntityType: string;
  linkedEntityId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl?: string;
  caption?: string;
  createdAt: string;
}

export interface ReviewComment {
  id: string;
  linkedEntityType: string;
  linkedEntityId: string;
  reviewerId: string;
  status: string;
  comment: string;
  createdAt: string;
  reviewer?: {
    id: string;
    name: string;
  };
}

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
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
