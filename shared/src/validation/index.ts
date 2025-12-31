import { z } from 'zod';

// ============================================
// AQUAPACK - Shared Validation Schemas
// ============================================

// ---------- Common Validators ----------

export const geoLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive().optional(),
  altitude: z.number().optional(),
  capturedAt: z.string().datetime(),
});

export const depthRangeSchema = z.object({
  fromDepth: z.number().min(0),
  toDepth: z.number().min(0),
}).refine(data => data.toDepth > data.fromDepth, {
  message: 'toDepth must be greater than fromDepth',
});

// ---------- Auth Validators ----------

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  organizationId: z.string().uuid().optional(),
});

// ---------- Project Validators ----------

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').max(100),
  code: z.string().min(2).max(20).regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with dashes'),
  client: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

// ---------- Site Validators ----------

export const createSiteSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(2, 'Site name must be at least 2 characters').max(100),
  code: z.string().min(1).max(20),
  location: geoLocationSchema,
  description: z.string().max(1000).optional(),
  siteType: z.string().max(50).optional(),
  accessNotes: z.string().max(500).optional(),
});

export const updateSiteSchema = createSiteSchema.partial().omit({ projectId: true });

// ---------- Borehole Validators ----------

export const casingIntervalSchema = z.object({
  id: z.string().uuid(),
  fromDepth: z.number().min(0),
  toDepth: z.number().min(0),
  material: z.string().min(1),
  diameter: z.number().positive().optional(),
}).refine(data => data.toDepth > data.fromDepth, {
  message: 'toDepth must be greater than fromDepth',
});

export const screenIntervalSchema = z.object({
  id: z.string().uuid(),
  fromDepth: z.number().min(0),
  toDepth: z.number().min(0),
  slotSize: z.number().positive().optional(),
  material: z.string().optional(),
}).refine(data => data.toDepth > data.fromDepth, {
  message: 'toDepth must be greater than fromDepth',
});

export const lithologyIntervalSchema = z.object({
  id: z.string().uuid(),
  fromDepth: z.number().min(0),
  toDepth: z.number().min(0),
  primaryLithology: z.string().min(1),
  secondaryLithology: z.string().optional(),
  description: z.string().max(500).optional(),
  color: z.string().max(50).optional(),
  grainSize: z.string().max(50).optional(),
  waterBearing: z.boolean(),
}).refine(data => data.toDepth > data.fromDepth, {
  message: 'toDepth must be greater than fromDepth',
});

export const createBoreholeSchema = z.object({
  siteId: z.string().uuid(),
  name: z.string().min(1).max(100),
  wellType: z.enum(['BOREHOLE', 'DUG_WELL', 'SPRING', 'PIEZOMETER']),
  totalDepth: z.number().positive('Total depth must be positive'),
  depthUnit: z.enum(['meters', 'feet']),
  drillingDate: z.string().datetime().optional(),
  drillingMethod: z.string().max(100).optional(),
  driller: z.string().max(100).optional(),
  diameter: z.number().positive().optional(),
  casingDetails: z.array(casingIntervalSchema).optional(),
  screenIntervals: z.array(screenIntervalSchema).optional(),
  lithologyLog: z.array(lithologyIntervalSchema).optional(),
  staticWaterLevel: z.number().optional(),
  notes: z.string().max(2000).optional(),
});

// Validate screen intervals are within total depth
export const validateBoreholeSchema = createBoreholeSchema.refine(
  (data) => {
    if (data.screenIntervals) {
      return data.screenIntervals.every(
        (interval) => interval.toDepth <= data.totalDepth
      );
    }
    return true;
  },
  { message: 'Screen intervals cannot exceed total depth' }
);

export const updateBoreholeSchema = createBoreholeSchema.partial().omit({ siteId: true });

// ---------- Water Level Validators ----------

export const createWaterLevelSchema = z.object({
  siteId: z.string().uuid(),
  boreholeId: z.string().uuid().optional(),
  measurementDatetime: z.string().datetime(),
  depthToWater: z.number(),
  depthUnit: z.enum(['meters', 'feet']),
  measurementMethod: z.enum(['MANUAL_TAPE', 'PRESSURE_TRANSDUCER', 'SOUNDER', 'OTHER']),
  measurementType: z.enum(['static', 'dynamic', 'recovery']),
  referencePoint: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
}).refine(
  (data) => {
    // Warn if depth is negative (artesian) or very large
    if (data.depthToWater < -10) {
      console.warn('Unusually high artesian pressure detected');
    }
    if (data.depthToWater > 500) {
      console.warn('Unusually deep water level detected');
    }
    return true;
  }
);

export const updateWaterLevelSchema = createWaterLevelSchema.partial().omit({ siteId: true });

// ---------- Pump Test Validators ----------

export const createPumpTestSchema = z.object({
  siteId: z.string().uuid(),
  boreholeId: z.string().uuid().optional(),
  testType: z.enum(['STEP_TEST', 'CONSTANT_RATE', 'RECOVERY', 'SLUG_TEST']),
  testName: z.string().max(100).optional(),
  startDatetime: z.string().datetime(),
  endDatetime: z.string().datetime().optional(),
  staticWaterLevel: z.number().optional(),
  pumpDepth: z.number().positive().optional(),
  pumpType: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export const updatePumpTestSchema = createPumpTestSchema.partial().omit({ siteId: true });

export const createPumpTestEntrySchema = z.object({
  pumpTestId: z.string().uuid(),
  elapsedMinutes: z.number().min(0),
  elapsedSeconds: z.number().min(0).max(59).optional(),
  depthToWater: z.number(),
  drawdown: z.number().optional(),
  discharge: z.number().positive().optional(),
  dischargeUnit: z.enum(['l/s', 'm3/h', 'gpm']).optional(),
  notes: z.string().max(200).optional(),
});

// ---------- Water Quality Validators ----------

export const createWaterQualitySchema = z.object({
  siteId: z.string().uuid(),
  boreholeId: z.string().uuid().optional(),
  sampleDatetime: z.string().datetime(),
  sampleId: z.string().max(50).optional(),

  temperature: z.number().min(-5).max(100).optional(),
  temperatureUnit: z.enum(['celsius', 'fahrenheit']),
  ph: z.number().min(0).max(14).optional(),
  electricalConductivity: z.number().positive().optional(),
  ecUnit: z.enum(['uS/cm', 'mS/cm']),
  totalDissolvedSolids: z.number().positive().optional(),
  tdsUnit: z.enum(['mg/L', 'ppm']),
  dissolvedOxygen: z.number().min(0).optional(),
  doUnit: z.enum(['mg/L', '%sat']),
  turbidity: z.number().min(0).optional(),
  turbidityUnit: z.enum(['NTU', 'FNU']),
  redoxPotential: z.number().optional(),

  instrumentId: z.string().max(50).optional(),
  calibrationDate: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
});

// Validate water quality ranges
export const validateWaterQualitySchema = createWaterQualitySchema.refine(
  (data) => {
    const warnings: string[] = [];

    if (data.ph !== undefined && (data.ph < 6 || data.ph > 9)) {
      warnings.push('pH outside typical range (6-9)');
    }
    if (data.electricalConductivity !== undefined && data.electricalConductivity > 5000) {
      warnings.push('EC unusually high (>5000 uS/cm)');
    }
    if (data.turbidity !== undefined && data.turbidity > 100) {
      warnings.push('Turbidity unusually high (>100 NTU)');
    }

    // Store warnings but don't fail validation
    if (warnings.length > 0) {
      console.warn('Water quality warnings:', warnings);
    }

    return true;
  }
);

export const updateWaterQualitySchema = createWaterQualitySchema.partial().omit({ siteId: true });

// ---------- Media Validators ----------

export const createMediaSchema = z.object({
  linkedEntityType: z.enum(['site', 'borehole', 'pump_test', 'water_quality', 'water_level']),
  linkedEntityId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1).max(50),
  fileSize: z.number().positive().max(50 * 1024 * 1024), // 50MB max
  caption: z.string().max(500).optional(),
  capturedAt: z.string().datetime().optional(),
  location: geoLocationSchema.optional(),
});

// ---------- Review Validators ----------

export const createReviewSchema = z.object({
  linkedEntityType: z.string().min(1),
  linkedEntityId: z.string().uuid(),
  status: z.enum(['PENDING', 'APPROVED', 'FLAGGED', 'REJECTED']),
  comment: z.string().min(1).max(2000),
});

// ---------- Utility Functions ----------

export function validateDepthIntervals(
  intervals: { fromDepth: number; toDepth: number }[],
  totalDepth: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Sort by fromDepth
  const sorted = [...intervals].sort((a, b) => a.fromDepth - b.fromDepth);

  for (let i = 0; i < sorted.length; i++) {
    const interval = sorted[i];

    // Check within total depth
    if (interval.toDepth > totalDepth) {
      errors.push(`Interval ${i + 1}: toDepth (${interval.toDepth}) exceeds total depth (${totalDepth})`);
    }

    // Check for overlaps with next interval
    if (i < sorted.length - 1) {
      const next = sorted[i + 1];
      if (interval.toDepth > next.fromDepth) {
        errors.push(`Intervals ${i + 1} and ${i + 2} overlap`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
