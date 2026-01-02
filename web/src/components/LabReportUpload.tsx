import { useState, useRef } from 'react';
import { LabParameter, LabReport } from '@/types';

// WHO drinking water quality guidelines
const WHO_LIMITS: Record<string, { limit: number; unit: string }> = {
  ph: { limit: 8.5, unit: '' },
  turbidity: { limit: 5, unit: 'NTU' },
  tds: { limit: 1000, unit: 'mg/L' },
  ec: { limit: 1500, unit: 'µS/cm' },
  hardness: { limit: 500, unit: 'mg/L' },
  chloride: { limit: 250, unit: 'mg/L' },
  sulfate: { limit: 250, unit: 'mg/L' },
  nitrate: { limit: 50, unit: 'mg/L' },
  fluoride: { limit: 1.5, unit: 'mg/L' },
  iron: { limit: 0.3, unit: 'mg/L' },
  manganese: { limit: 0.1, unit: 'mg/L' },
  arsenic: { limit: 0.01, unit: 'mg/L' },
  calcium: { limit: 200, unit: 'mg/L' },
  magnesium: { limit: 150, unit: 'mg/L' },
  sodium: { limit: 200, unit: 'mg/L' },
  potassium: { limit: 12, unit: 'mg/L' },
  totalColiform: { limit: 0, unit: 'CFU/100mL' },
  fecalColiform: { limit: 0, unit: 'CFU/100mL' },
  eColi: { limit: 0, unit: 'CFU/100mL' },
};

// Common lab parameters for water quality
const COMMON_PARAMETERS = [
  { key: 'ph', name: 'pH', unit: '' },
  { key: 'ec', name: 'Electrical Conductivity', unit: 'µS/cm' },
  { key: 'tds', name: 'Total Dissolved Solids', unit: 'mg/L' },
  { key: 'turbidity', name: 'Turbidity', unit: 'NTU' },
  { key: 'hardness', name: 'Total Hardness', unit: 'mg/L as CaCO3' },
  { key: 'alkalinity', name: 'Alkalinity', unit: 'mg/L as CaCO3' },
  { key: 'chloride', name: 'Chloride', unit: 'mg/L' },
  { key: 'sulfate', name: 'Sulfate', unit: 'mg/L' },
  { key: 'nitrate', name: 'Nitrate (NO₃)', unit: 'mg/L' },
  { key: 'fluoride', name: 'Fluoride', unit: 'mg/L' },
  { key: 'iron', name: 'Iron (Fe)', unit: 'mg/L' },
  { key: 'manganese', name: 'Manganese (Mn)', unit: 'mg/L' },
  { key: 'arsenic', name: 'Arsenic (As)', unit: 'mg/L' },
  { key: 'calcium', name: 'Calcium (Ca)', unit: 'mg/L' },
  { key: 'magnesium', name: 'Magnesium (Mg)', unit: 'mg/L' },
  { key: 'sodium', name: 'Sodium (Na)', unit: 'mg/L' },
  { key: 'potassium', name: 'Potassium (K)', unit: 'mg/L' },
  { key: 'bicarbonate', name: 'Bicarbonate (HCO₃)', unit: 'mg/L' },
  { key: 'totalColiform', name: 'Total Coliform', unit: 'CFU/100mL' },
  { key: 'fecalColiform', name: 'Fecal Coliform', unit: 'CFU/100mL' },
  { key: 'eColi', name: 'E. coli', unit: 'CFU/100mL' },
];

interface LabReportUploadProps {
  siteId: string;
  onSave: (report: Omit<LabReport, 'id' | 'uploadedAt'>) => void;
  onClose: () => void;
}

export default function LabReportUpload({ siteId, onSave, onClose }: LabReportUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [labName, setLabName] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [sampleDate, setSampleDate] = useState('');
  const [sampleId, setSampleId] = useState('');
  const [notes, setNotes] = useState('');
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [showAllParams, setShowAllParams] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
      setSelectedFile(file);
    }
  };

  const handleParamChange = (key: string, value: string) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  const getParamStatus = (key: string, value: number): 'normal' | 'warning' | 'exceeded' => {
    const limit = WHO_LIMITS[key]?.limit;
    if (limit === undefined) return 'normal';
    if (value > limit) return 'exceeded';
    if (value > limit * 0.8) return 'warning';
    return 'normal';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build parameters array from entered values
    const paramsList: LabParameter[] = [];
    Object.entries(parameters).forEach(([key, value]) => {
      if (value) {
        const numValue = parseFloat(value);
        const paramDef = COMMON_PARAMETERS.find(p => p.key === key);
        const whoLimit = WHO_LIMITS[key];
        paramsList.push({
          name: paramDef?.name || key,
          value: numValue,
          unit: paramDef?.unit || whoLimit?.unit || '',
          limit: whoLimit?.limit,
          status: getParamStatus(key, numValue),
        });
      }
    });

    onSave({
      siteId,
      fileName: selectedFile?.name || 'Manual Entry',
      fileUrl: selectedFile ? URL.createObjectURL(selectedFile) : '',
      fileSize: selectedFile?.size || 0,
      labName,
      reportDate,
      sampleDate,
      sampleId: sampleId || undefined,
      uploadedBy: 'Current User',
      parameters: paramsList,
      notes: notes || undefined,
    });
  };

  const displayedParams = showAllParams ? COMMON_PARAMETERS : COMMON_PARAMETERS.slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Upload Lab Report</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-aqua-100 text-aqua-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Upload PDF
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'manual'
                  ? 'bg-aqua-100 text-aqua-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Enter Manually
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* File Upload Area */}
          {activeTab === 'upload' && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                selectedFile ? 'border-aqua-400 bg-aqua-50' : 'border-gray-300 hover:border-aqua-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto bg-aqua-100 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-aqua-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Drag and drop your lab report here</p>
                  <p className="text-sm text-gray-400">PDF or image files accepted</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-aqua-500 text-white rounded-lg text-sm font-medium hover:bg-aqua-600 transition-colors"
                  >
                    Browse Files
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Lab Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Lab Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Laboratory Name *</label>
                <input
                  type="text"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  placeholder="e.g., National Water Lab"
                  className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-aqua-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Sample ID</label>
                <input
                  type="text"
                  value={sampleId}
                  onChange={(e) => setSampleId(e.target.value)}
                  placeholder="e.g., WQ-2024-001"
                  className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-aqua-400"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Sample Date *</label>
                <input
                  type="date"
                  value={sampleDate}
                  onChange={(e) => setSampleDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-aqua-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Report Date *</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-aqua-400"
                  required
                />
              </div>
            </div>
          </div>

          {/* Parameters Entry */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Lab Parameters</h3>
              <span className="text-xs text-gray-500">Values compared to WHO guidelines</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {displayedParams.map((param) => {
                const whoLimit = WHO_LIMITS[param.key];
                const value = parameters[param.key];
                const numValue = value ? parseFloat(value) : 0;
                const status = value ? getParamStatus(param.key, numValue) : null;

                return (
                  <div key={param.key} className="relative">
                    <label className="block text-sm text-gray-600 mb-1">
                      {param.name}
                      {whoLimit && (
                        <span className="text-xs text-gray-400 ml-1">
                          (limit: {whoLimit.limit} {param.unit})
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={parameters[param.key] || ''}
                        onChange={(e) => handleParamChange(param.key, e.target.value)}
                        placeholder="--"
                        className={`w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-aqua-400 pr-16 ${
                          status === 'exceeded' ? 'bg-red-50 ring-2 ring-red-300' :
                          status === 'warning' ? 'bg-yellow-50 ring-2 ring-yellow-300' : ''
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        {param.unit}
                      </span>
                    </div>
                    {status === 'exceeded' && (
                      <p className="text-xs text-red-600 mt-1">Exceeds WHO limit</p>
                    )}
                    {status === 'warning' && (
                      <p className="text-xs text-yellow-600 mt-1">Approaching limit</p>
                    )}
                  </div>
                );
              })}
            </div>

            {!showAllParams && (
              <button
                type="button"
                onClick={() => setShowAllParams(true)}
                className="text-sm text-aqua-600 hover:text-aqua-700 font-medium"
              >
                + Show more parameters ({COMMON_PARAMETERS.length - 10} more)
              </button>
            )}
            {showAllParams && (
              <button
                type="button"
                onClick={() => setShowAllParams(false)}
                className="text-sm text-gray-500 hover:text-gray-600"
              >
                Show fewer parameters
              </button>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional observations or notes about this lab report..."
              className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-aqua-400 resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!labName || !sampleDate || !reportDate}
              className="flex-1 px-4 py-3 bg-aqua-500 text-white rounded-xl text-sm font-medium hover:bg-aqua-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Lab Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
