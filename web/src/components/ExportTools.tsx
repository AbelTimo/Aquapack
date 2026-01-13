import { useState } from 'react';

interface Site {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  siteType?: string;
  qaStatus: string;
  description?: string;
  _count?: {
    boreholes?: number;
    waterLevels?: number;
    waterQuality?: number;
  };
}

interface ExportToolsProps {
  sites: Site[];
  projectName?: string;
  onClose: () => void;
}

type ExportFormat = 'geojson' | 'csv' | 'kml' | 'shapefile-info';

export default function ExportTools({ sites, projectName, onClose }: ExportToolsProps) {
  const [format, setFormat] = useState<ExportFormat>('geojson');
  const [includeFields, setIncludeFields] = useState({
    name: true,
    code: true,
    siteType: true,
    qaStatus: true,
    elevation: true,
    description: true,
    dataCount: true,
  });
  const [isExporting, setIsExporting] = useState(false);

  const exportAsGeoJSON = () => {
    const features = sites.map((site) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [site.longitude, site.latitude, site.elevation || 0],
      },
      properties: {
        id: site.id,
        ...(includeFields.name && { name: site.name }),
        ...(includeFields.code && { code: site.code }),
        ...(includeFields.siteType && { siteType: site.siteType }),
        ...(includeFields.qaStatus && { qaStatus: site.qaStatus }),
        ...(includeFields.elevation && { elevation: site.elevation }),
        ...(includeFields.description && { description: site.description }),
        ...(includeFields.dataCount && {
          boreholesCount: site._count?.boreholes || 0,
          waterLevelsCount: site._count?.waterLevels || 0,
          waterQualityCount: site._count?.waterQuality || 0,
        }),
      },
    }));

    const geojson = {
      type: 'FeatureCollection',
      name: projectName || 'Aquapack Sites Export',
      crs: {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:OGC:1.3:CRS84',
        },
      },
      features,
    };

    return JSON.stringify(geojson, null, 2);
  };

  const exportAsCSV = () => {
    const headers = ['ID', 'Name', 'Code', 'Latitude', 'Longitude'];
    if (includeFields.elevation) headers.push('Elevation');
    if (includeFields.siteType) headers.push('Site Type');
    if (includeFields.qaStatus) headers.push('QA Status');
    if (includeFields.description) headers.push('Description');
    if (includeFields.dataCount) headers.push('Boreholes', 'Water Levels', 'Water Quality');

    const rows = sites.map((site) => {
      const row = [site.id, site.name, site.code, site.latitude, site.longitude];
      if (includeFields.elevation) row.push(site.elevation || '');
      if (includeFields.siteType) row.push(site.siteType || '');
      if (includeFields.qaStatus) row.push(site.qaStatus);
      if (includeFields.description) row.push(site.description || '');
      if (includeFields.dataCount) {
        row.push(site._count?.boreholes || 0);
        row.push(site._count?.waterLevels || 0);
        row.push(site._count?.waterQuality || 0);
      }
      return row.map((v) => `"${v}"`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  const exportAsKML = () => {
    const placemarks = sites
      .map(
        (site) => `
    <Placemark>
      <name>${site.name}</name>
      <description><![CDATA[
        <p><strong>Code:</strong> ${site.code}</p>
        ${includeFields.siteType ? `<p><strong>Type:</strong> ${site.siteType || 'N/A'}</p>` : ''}
        ${includeFields.qaStatus ? `<p><strong>Status:</strong> ${site.qaStatus}</p>` : ''}
        ${includeFields.elevation ? `<p><strong>Elevation:</strong> ${site.elevation || 'N/A'} m</p>` : ''}
        ${includeFields.description ? `<p>${site.description || ''}</p>` : ''}
      ]]></description>
      <Point>
        <coordinates>${site.longitude},${site.latitude},${site.elevation || 0}</coordinates>
      </Point>
      <Style>
        <IconStyle>
          <color>${site.qaStatus === 'APPROVED' ? 'ff00ff00' : site.qaStatus === 'PENDING' ? 'ff00ffff' : 'ff0000ff'}</color>
          <scale>1.0</scale>
          <Icon>
            <href>http://maps.google.com/mapfiles/kml/paddle/wht-circle.png</href>
          </Icon>
        </IconStyle>
      </Style>
    </Placemark>`
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${projectName || 'Aquapack Sites'}</name>
    <description>Exported from Aquapack Field Data Management System</description>
    ${placemarks}
  </Document>
</kml>`;
  };

  const handleExport = () => {
    setIsExporting(true);

    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'geojson':
        content = exportAsGeoJSON();
        filename = `${projectName || 'sites'}-export.geojson`;
        mimeType = 'application/geo+json';
        break;
      case 'csv':
        content = exportAsCSV();
        filename = `${projectName || 'sites'}-export.csv`;
        mimeType = 'text/csv';
        break;
      case 'kml':
        content = exportAsKML();
        filename = `${projectName || 'sites'}-export.kml`;
        mimeType = 'application/vnd.google-earth.kml+xml';
        break;
      default:
        setIsExporting(false);
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    setIsExporting(false);
    onClose();
  };

  const formatOptions = [
    {
      id: 'geojson' as const,
      label: 'GeoJSON',
      description: 'Standard format for GIS applications (QGIS, ArcGIS)',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
    },
    {
      id: 'csv' as const,
      label: 'CSV',
      description: 'Spreadsheet format (Excel, Google Sheets)',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'kml' as const,
      label: 'KML',
      description: 'Google Earth format with styling',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Export Sites</h2>
              <p className="text-sm text-gray-500 mt-1">{sites.length} sites selected</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
            <div className="space-y-2">
              {formatOptions.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    format === opt.id
                      ? 'border-aqua-500 bg-aqua-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={opt.id}
                    checked={format === opt.id}
                    onChange={() => setFormat(opt.id)}
                    className="sr-only"
                  />
                  <div className={`${format === opt.id ? 'text-aqua-600' : 'text-gray-400'}`}>
                    {opt.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{opt.label}</p>
                    <p className="text-sm text-gray-500">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Field Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Include Fields</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(includeFields).map(([field, checked]) => (
                <label key={field} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setIncludeFields({ ...includeFields, [field]: e.target.checked })}
                    className="w-4 h-4 text-aqua-600 rounded border-gray-300 focus:ring-aqua-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || sites.length === 0}
            className="flex-1 px-4 py-3 bg-aqua-500 text-white rounded-xl font-medium hover:bg-aqua-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export {format.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
