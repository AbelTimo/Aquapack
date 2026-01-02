// Mock API service for demo mode
import {
  mockUser,
  mockProjects,
  mockSites,
  mockBoreholes,
  mockWaterLevels,
  mockPumpTests,
  mockWaterQuality,
  mockDashboard,
  DEMO_CREDENTIALS,
} from './mockData';
import type { ApiResponse, Project, Site, AuthTokens } from '@/types';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Check if demo mode is enabled
export const isDemoMode = () => {
  return localStorage.getItem('aquapack-demo-mode') === 'true';
};

export const enableDemoMode = () => {
  localStorage.setItem('aquapack-demo-mode', 'true');
};

export const disableDemoMode = () => {
  localStorage.removeItem('aquapack-demo-mode');
};

// Mock Auth API
export const mockAuthApi = {
  login: async (email: string, password: string): Promise<ApiResponse<{ user: typeof mockUser; tokens: AuthTokens }>> => {
    await delay(500);

    // Accept demo credentials OR any email with 8+ char password
    if ((email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) ||
        (email && password && password.length >= 8)) {
      // Generate user name from email
      const userName = email.split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

      return {
        success: true,
        data: {
          user: {
            id: 'user-' + Date.now(),
            email: email,
            name: userName,
            role: 'DATA_MANAGER' as const,
            organizationId: 'org-1',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          tokens: {
            accessToken: 'access-token-' + Date.now(),
            refreshToken: 'refresh-token-' + Date.now(),
            expiresIn: 86400,
          },
        },
      };
    }

    throw {
      response: {
        status: 401,
        data: {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password. Password must be at least 8 characters.',
          },
        },
      },
    };
  },

  register: async (): Promise<ApiResponse<{ user: typeof mockUser; tokens: AuthTokens }>> => {
    await delay(500);
    enableDemoMode();
    return {
      success: true,
      data: {
        user: mockUser,
        tokens: {
          accessToken: 'demo-access-token-' + Date.now(),
          refreshToken: 'demo-refresh-token-' + Date.now(),
          expiresIn: 86400,
        },
      },
    };
  },

  logout: async (): Promise<ApiResponse<null>> => {
    await delay(200);
    disableDemoMode();
    return { success: true };
  },

  getMe: async (): Promise<ApiResponse<{ user: typeof mockUser }>> => {
    await delay(300);
    return {
      success: true,
      data: { user: mockUser },
    };
  },
};

// Mock Projects API
export const mockProjectsApi = {
  getAll: async (params?: { search?: string; isActive?: boolean }): Promise<ApiResponse<{ projects: Project[] }>> => {
    await delay(400);

    let projects = [...mockProjects];

    if (params?.search) {
      const search = params.search.toLowerCase();
      projects = projects.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.code.toLowerCase().includes(search)
      );
    }

    if (params?.isActive !== undefined) {
      projects = projects.filter(p => p.isActive === params.isActive);
    }

    return {
      success: true,
      data: { projects },
      meta: { total: projects.length },
    };
  },

  getMyProjects: async (): Promise<ApiResponse<{ projects: Project[] }>> => {
    await delay(400);
    return {
      success: true,
      data: { projects: mockProjects.filter(p => p.isActive) },
    };
  },

  getById: async (id: string): Promise<ApiResponse<{ project: Project }>> => {
    await delay(300);
    const project = mockProjects.find(p => p.id === id);

    if (!project) {
      throw {
        response: {
          status: 404,
          data: {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Project not found' },
          },
        },
      };
    }

    return {
      success: true,
      data: { project },
    };
  },

  getDashboard: async (id: string): Promise<ApiResponse<typeof mockDashboard>> => {
    await delay(400);
    return {
      success: true,
      data: { ...mockDashboard, projectId: id },
    };
  },

  create: async (data: any): Promise<ApiResponse<{ project: Project }>> => {
    await delay(500);

    // Build enabled modules array from form data
    const enabledModules: string[] = [];
    if (data.enableBoreholes) enabledModules.push('boreholes');
    if (data.enableWaterLevels) enabledModules.push('waterLevels');
    if (data.enablePumpTests) enabledModules.push('pumpTests');
    if (data.enableWaterQuality) enabledModules.push('waterQuality');
    if (data.enableMedia) enabledModules.push('media');

    const newProject: Project = {
      id: 'proj-' + Date.now(),
      name: data.name || 'New Project',
      code: data.code || 'NEW-001',
      client: data.client,
      region: data.region,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      organizationId: 'demo-org-1',
      isActive: true,
      templateConfig: {
        clientContact: data.clientContact,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        country: data.country,
        defaultUnits: {
          depth: data.depthUnit || 'meters',
          discharge: data.dischargeUnit || 'l/s',
        },
        coordinateSystem: data.coordinateSystem || 'WGS84',
        gpsAccuracyThreshold: data.gpsAccuracyThreshold || 10,
        enabledModules,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { sites: 0 },
    };

    mockProjects.unshift(newProject);

    return {
      success: true,
      data: { project: newProject },
    };
  },

  update: async (id: string, data: any): Promise<ApiResponse<{ project: Project }>> => {
    await delay(400);
    const index = mockProjects.findIndex(p => p.id === id);

    if (index === -1) {
      throw {
        response: {
          status: 404,
          data: {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Project not found' },
          },
        },
      };
    }

    // Build enabled modules array from form data
    const enabledModules: string[] = [];
    if (data.enableBoreholes) enabledModules.push('boreholes');
    if (data.enableWaterLevels) enabledModules.push('waterLevels');
    if (data.enablePumpTests) enabledModules.push('pumpTests');
    if (data.enableWaterQuality) enabledModules.push('waterQuality');
    if (data.enableMedia) enabledModules.push('media');

    mockProjects[index] = {
      ...mockProjects[index],
      name: data.name,
      code: data.code,
      client: data.client,
      region: data.region,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive ?? mockProjects[index].isActive,
      templateConfig: {
        clientContact: data.clientContact,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        country: data.country,
        defaultUnits: {
          depth: data.depthUnit || 'meters',
          discharge: data.dischargeUnit || 'l/s',
        },
        coordinateSystem: data.coordinateSystem || 'WGS84',
        gpsAccuracyThreshold: data.gpsAccuracyThreshold || 10,
        enabledModules,
      },
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: { project: mockProjects[index] },
    };
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    await delay(400);
    const index = mockProjects.findIndex(p => p.id === id);

    if (index !== -1) {
      mockProjects.splice(index, 1);
    }

    return { success: true };
  },
};

// Mock Sites API
export const mockSitesApi = {
  getAll: async (params?: { projectId?: string; qaStatus?: string; search?: string }): Promise<ApiResponse<{ sites: Site[] }>> => {
    await delay(400);

    let sites = [...mockSites];

    if (params?.projectId) {
      sites = sites.filter(s => s.projectId === params.projectId);
    }

    if (params?.qaStatus) {
      sites = sites.filter(s => s.qaStatus === params.qaStatus);
    }

    if (params?.search) {
      const search = params.search.toLowerCase();
      sites = sites.filter(s =>
        s.name.toLowerCase().includes(search) ||
        s.code.toLowerCase().includes(search)
      );
    }

    return {
      success: true,
      data: { sites },
      meta: { total: sites.length },
    };
  },

  getForMap: async (projectId: string): Promise<ApiResponse<{ sites: Site[] }>> => {
    await delay(300);
    const sites = mockSites.filter(s => s.projectId === projectId);
    return {
      success: true,
      data: { sites },
    };
  },

  getById: async (id: string): Promise<ApiResponse<{ site: Site; boreholes: typeof mockBoreholes; waterLevels: typeof mockWaterLevels; pumpTests: typeof mockPumpTests; waterQuality: typeof mockWaterQuality }>> => {
    await delay(300);
    const site = mockSites.find(s => s.id === id);

    if (!site) {
      throw {
        response: {
          status: 404,
          data: {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Site not found' },
          },
        },
      };
    }

    return {
      success: true,
      data: {
        site,
        boreholes: mockBoreholes.filter(b => b.siteId === id),
        waterLevels: mockWaterLevels.filter(w => w.siteId === id),
        pumpTests: mockPumpTests.filter(p => p.siteId === id),
        waterQuality: mockWaterQuality.filter(q => q.siteId === id),
      },
    };
  },

  create: async (data: Partial<Site>): Promise<ApiResponse<{ site: Site }>> => {
    await delay(500);
    const newSite: Site = {
      id: 'site-' + Date.now(),
      projectId: data.projectId || 'proj-1',
      name: data.name || 'New Site',
      code: data.code || 'NEW-SITE-001',
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      accuracy: data.accuracy,
      altitude: data.altitude,
      description: data.description,
      siteType: data.siteType,
      accessNotes: data.accessNotes,
      qaStatus: 'PENDING',
      syncStatus: 'SYNCED',
      createdBy: 'demo-user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      creator: { id: 'demo-user-1', name: 'Demo User' },
      _count: { boreholes: 0, waterLevels: 0, pumpTests: 0, waterQualityReadings: 0 },
    };

    mockSites.unshift(newSite);

    return {
      success: true,
      data: { site: newSite },
    };
  },

  update: async (id: string, data: Partial<Site>): Promise<ApiResponse<{ site: Site }>> => {
    await delay(400);
    const index = mockSites.findIndex(s => s.id === id);

    if (index === -1) {
      throw {
        response: {
          status: 404,
          data: {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Site not found' },
          },
        },
      };
    }

    mockSites[index] = {
      ...mockSites[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: { site: mockSites[index] },
    };
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    await delay(400);
    const index = mockSites.findIndex(s => s.id === id);

    if (index !== -1) {
      mockSites.splice(index, 1);
    }

    return { success: true };
  },

  review: async (id: string, status: string, comment?: string): Promise<ApiResponse<{ site: Site }>> => {
    await delay(400);
    const index = mockSites.findIndex(s => s.id === id);

    if (index === -1) {
      throw {
        response: {
          status: 404,
          data: {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Site not found' },
          },
        },
      };
    }

    mockSites[index] = {
      ...mockSites[index],
      qaStatus: status as Site['qaStatus'],
      updatedAt: new Date().toISOString(),
    };

    console.log('Review comment:', comment);

    return {
      success: true,
      data: { site: mockSites[index] },
    };
  },
};

// Mock Boreholes API
export const mockBoreholesApi = {
  getAll: async (params?: { siteId?: string; boreholeStatus?: string }): Promise<ApiResponse<{ boreholes: typeof mockBoreholes }>> => {
    await delay(400);

    let boreholes = [...mockBoreholes];

    if (params?.siteId) {
      boreholes = boreholes.filter(b => b.siteId === params.siteId);
    }

    if (params?.boreholeStatus) {
      boreholes = boreholes.filter(b => b.boreholeStatus === params.boreholeStatus);
    }

    return {
      success: true,
      data: { boreholes },
      meta: { total: boreholes.length },
    };
  },
};
