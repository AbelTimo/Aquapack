import { useState, useRef, useCallback } from 'react';

interface ImportedSite {
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  siteType?: string;
  description?: string;
  valid: boolean;
  errors: string[];
}

interface BulkImportProps {
  onImport: (sites: Omit<ImportedSite, 'valid' | 'errors'>[]) => Promise<void>;
  onClose: () => void;
}

export default function BulkImport({ onImport, onClose }: BulkImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [parsedData, setParsedData] = useState<ImportedSite[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
  const [error, setError] = useState<string>('');

  const validateSite = (site: Partial<ImportedSite>, rowIndex: number): ImportedSite => {
    const errors: string[] = [];

    if (!site.name?.trim()) errors.push('Name is required');
    if (!site.code?.trim()) errors.push('Code is required');

    const lat = Number(site.latitude);
    const lng = Number(site.longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push('Invalid latitude (must be -90 to 90)');
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push('Invalid longitude (must be -180 to 180)');
    }

    return {
      name: site.name?.trim() || `Site ${rowIndex + 1}`,
      code: site.code?.trim() || `SITE-${rowIndex + 1}`,
      latitude: lat,
      longitude: lng,
      elevation: site.elevation ? Number(site.elevation) : undefined,
      siteType: site.siteType?.trim(),
      description: site.description?.trim(),
      valid: errors.length === 0,
      errors,
    };
  };

  const parseCSV = (content: string): ImportedSite[] => {
    const lines = content.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV must have a header row and at least one data row');
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));

    // Map common header variations
    const headerMap: Record<string, string> = {
      name: 'name',
      site_name: 'name',
      sitename: 'name',
      code: 'code',
      site_code: 'code',
      sitecode: 'code',
      id: 'code',
      lat: 'latitude',
      latitude: 'latitude',
      y: 'latitude',
      lng: 'longitude',
      lon: 'longitude',
      long: 'longitude',
      longitude: 'longitude',
      x: 'longitude',
      elev: 'elevation',
      elevation: 'elevation',
      altitude: 'elevation',
      z: 'elevation',
      type: 'siteType',
      site_type: 'siteType',
      sitetype: 'siteType',
      desc: 'description',
      description: 'description',
      notes: 'description',
    };

    const fieldIndices: Record<string, number> = {};
    headers.forEach((header, index) => {
      const mappedField = headerMap[header];
      if (mappedField) {
        fieldIndices[mappedField] = index;
      }
    });

    // Check required fields
    if (fieldIndices.latitude === undefined || fieldIndices.longitude === undefined) {
      throw new Error('CSV must include latitude and longitude columns');
    }

    const sites: ImportedSite[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const site: Partial<ImportedSite> = {
        name: fieldIndices.name !== undefined ? values[fieldIndices.name] : undefined,
        code: fieldIndices.code !== undefined ? values[fieldIndices.code] : undefined,
        latitude: fieldIndices.latitude !== undefined ? parseFloat(values[fieldIndices.latitude]) : 0,
        longitude: fieldIndices.longitude !== undefined ? parseFloat(values[fieldIndices.longitude]) : 0,
        elevation: fieldIndices.elevation !== undefined ? parseFloat(values[fieldIndices.elevation]) || undefined : undefined,
        siteType: fieldIndices.siteType !== undefined ? values[fieldIndices.siteType] : undefined,
        description: fieldIndices.description !== undefined ? values[fieldIndices.description] : undefined,
      };

      sites.push(validateSite(site, i - 1));
    }

    return sites;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());

    return result;
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = parseCSV(content);
        setParsedData(parsed);
        setStep('preview');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse file');
      }
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      const input = fileInputRef.current;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        handleFileSelect({ target: input } as any);
      }
    }
  }, [handleFileSelect]);

  const handleImport = async () => {
    const validSites = parsedData.filter((s) => s.valid);
    if (validSites.length === 0) {
      setError('No valid sites to import');
      return;
    }

    setStep('importing');
    setImportProgress(0);

    try {
      const sitesToImport = validSites.map(({ valid, errors, ...site }) => site);
      await onImport(sitesToImport);

      setImportResult({ success: validSites.length, failed: parsedData.length - validSites.length });
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setStep('preview');
    }
  };

  const validCount = parsedData.filter((s) => s.valid).length;
  const invalidCount = parsedData.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Bulk Import Sites</h2>
              <p className="text-sm text-gray-500 mt-1">
                {step === 'upload' && 'Upload a CSV file with site data'}
                {step === 'preview' && `${parsedData.length} sites found - ${validCount} valid`}
                {step === 'importing' && 'Importing sites...'}
                {step === 'complete' && 'Import complete'}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-6">
              {/* File Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-aqua-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">Drop your CSV file here</p>
                <p className="text-gray-400 text-sm mt-1">or click to browse</p>
              </div>

              {/* Format Help */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-2">CSV Format Requirements</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Your CSV file must include columns for latitude and longitude. Recommended columns:
                </p>
                <div className="bg-white rounded-lg p-3 font-mono text-xs text-gray-600 overflow-x-auto">
                  name,code,latitude,longitude,elevation,site_type,description
                  <br />
                  "Well A","WA-001",-1.2345,36.8765,1650,"Borehole","Community water point"
                  <br />
                  "Well B","WA-002",-1.2456,36.8876,1680,"Spring",""
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Supported column names: name/site_name, code/site_code/id, lat/latitude/y, lng/lon/longitude/x, elev/elevation/altitude/z, type/site_type, desc/description/notes
                </p>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex gap-4">
                <div className="flex-1 bg-emerald-50 rounded-xl p-4">
                  <p className="text-3xl font-bold text-emerald-600">{validCount}</p>
                  <p className="text-sm text-emerald-700">Valid sites</p>
                </div>
                {invalidCount > 0 && (
                  <div className="flex-1 bg-red-50 rounded-xl p-4">
                    <p className="text-3xl font-bold text-red-600">{invalidCount}</p>
                    <p className="text-sm text-red-700">Invalid (will be skipped)</p>
                  </div>
                )}
              </div>

              {/* Data Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Code</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Lat</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Lng</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedData.map((site, idx) => (
                        <tr key={idx} className={site.valid ? '' : 'bg-red-50'}>
                          <td className="px-3 py-2">
                            {site.valid ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-5 h-5 bg-red-100 text-red-600 rounded-full" title={site.errors.join(', ')}>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-medium">{site.name}</td>
                          <td className="px-3 py-2 text-gray-500">{site.code}</td>
                          <td className="px-3 py-2 font-mono text-xs">{isNaN(site.latitude) ? 'Invalid' : site.latitude.toFixed(4)}</td>
                          <td className="px-3 py-2 font-mono text-xs">{isNaN(site.longitude) ? 'Invalid' : site.longitude.toFixed(4)}</td>
                          <td className="px-3 py-2 text-gray-500">{site.siteType || '--'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Error details for invalid sites */}
              {invalidCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h4 className="font-medium text-amber-900 mb-2">Validation Errors</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {parsedData
                      .filter((s) => !s.valid)
                      .slice(0, 5)
                      .map((s, idx) => (
                        <li key={idx}>
                          Row "{s.name || s.code}": {s.errors.join(', ')}
                        </li>
                      ))}
                    {invalidCount > 5 && <li>... and {invalidCount - 5} more</li>}
                  </ul>
                </div>
              )}
            </div>
          )}

          {step === 'importing' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4">
                <div className="w-full h-full border-4 border-aqua-200 border-t-aqua-500 rounded-full animate-spin" />
              </div>
              <p className="text-lg font-medium text-gray-900">Importing sites...</p>
              <p className="text-sm text-gray-500 mt-1">Please wait while we process your data</p>
              <div className="mt-6 max-w-xs mx-auto">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-aqua-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Import Complete!</h3>
              <p className="text-gray-500 mt-2">
                Successfully imported {importResult.success} sites
                {importResult.failed > 0 && ` (${importResult.failed} skipped)`}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
          {step === 'upload' && (
            <button onClick={onClose} className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          )}

          {step === 'preview' && (
            <>
              <button
                onClick={() => {
                  setStep('upload');
                  setParsedData([]);
                }}
                className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={validCount === 0}
                className="flex-1 px-4 py-3 bg-aqua-500 text-white rounded-xl font-medium hover:bg-aqua-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import {validCount} Sites
              </button>
            </>
          )}

          {step === 'complete' && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-aqua-500 text-white rounded-xl font-medium hover:bg-aqua-600 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
