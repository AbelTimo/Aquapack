import { useState, useRef } from 'react';

// Types
interface LithologyLayer {
  id: string;
  fromDepth: number;
  toDepth: number;
  soilType: string;
  description?: string;
  color: string;
}

interface CasingSection {
  id: string;
  fromDepth: number;
  toDepth: number;
  type: 'blind' | 'screen';
  diameter: number;
  material: string;
  slotSize?: number;
}

interface GravelPackZone {
  id: string;
  fromDepth: number;
  toDepth: number;
  gradeSize: string;
}

interface CementZone {
  id: string;
  fromDepth: number;
  toDepth: number;
  type: 'surface_seal' | 'annular' | 'bottom_plug';
}

interface BoreholeDesignData {
  totalDepth: number;
  boreholeDepth: number;
  staticWaterLevel: number;
  lithology: LithologyLayer[];
  casing: CasingSection[];
  gravelPack: GravelPackZone[];
  cement: CementZone[];
}

// Soil/Rock type options with colors
const LITHOLOGY_TYPES = [
  { value: 'topsoil', label: 'Topsoil', color: '#8B4513' },
  { value: 'clay', label: 'Clay', color: '#CD853F' },
  { value: 'sandy_clay', label: 'Sandy Clay', color: '#DEB887' },
  { value: 'sand_fine', label: 'Fine Sand', color: '#F5DEB3' },
  { value: 'sand_medium', label: 'Medium Sand', color: '#FFE4B5' },
  { value: 'sand_coarse', label: 'Coarse Sand', color: '#FFEFD5' },
  { value: 'gravel', label: 'Gravel', color: '#D3D3D3' },
  { value: 'sandstone', label: 'Sandstone', color: '#F4A460' },
  { value: 'limestone', label: 'Limestone', color: '#E0E0E0' },
  { value: 'shale', label: 'Shale', color: '#708090' },
  { value: 'granite', label: 'Granite', color: '#A9A9A9' },
  { value: 'basalt', label: 'Basalt', color: '#2F4F4F' },
  { value: 'weathered_rock', label: 'Weathered Rock', color: '#BC8F8F' },
  { value: 'fractured_rock', label: 'Fractured Rock', color: '#696969' },
];

const CASING_MATERIALS = [
  { value: 'pvc', label: 'PVC' },
  { value: 'upvc', label: 'uPVC' },
  { value: 'steel', label: 'Steel' },
  { value: 'stainless_steel', label: 'Stainless Steel' },
  { value: 'hdpe', label: 'HDPE' },
];

interface Props {
  borehole?: any;
  onSave?: (data: BoreholeDesignData) => void;
}

export default function BoreholeDesign({ borehole, onSave }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeTab, setActiveTab] = useState<'lithology' | 'casing' | 'completion'>('lithology');

  // Initialize with sample data or empty
  const [design, setDesign] = useState<BoreholeDesignData>({
    totalDepth: borehole?.totalDepth || 100,
    boreholeDepth: borehole?.boreholeDepth || 100,
    staticWaterLevel: borehole?.staticWaterLevel || 15,
    lithology: borehole?.lithologyLog || [
      { id: '1', fromDepth: 0, toDepth: 3, soilType: 'topsoil', color: '#8B4513' },
      { id: '2', fromDepth: 3, toDepth: 12, soilType: 'clay', color: '#CD853F' },
      { id: '3', fromDepth: 12, toDepth: 25, soilType: 'sandy_clay', color: '#DEB887' },
      { id: '4', fromDepth: 25, toDepth: 45, soilType: 'sand_medium', color: '#FFE4B5' },
      { id: '5', fromDepth: 45, toDepth: 60, soilType: 'gravel', color: '#D3D3D3' },
      { id: '6', fromDepth: 60, toDepth: 80, soilType: 'sandstone', color: '#F4A460' },
      { id: '7', fromDepth: 80, toDepth: 100, soilType: 'fractured_rock', color: '#696969' },
    ],
    casing: [
      { id: '1', fromDepth: 0, toDepth: 25, type: 'blind', diameter: 150, material: 'upvc' },
      { id: '2', fromDepth: 25, toDepth: 60, type: 'screen', diameter: 150, material: 'upvc', slotSize: 1.0 },
      { id: '3', fromDepth: 60, toDepth: 80, type: 'blind', diameter: 150, material: 'upvc' },
      { id: '4', fromDepth: 80, toDepth: 95, type: 'screen', diameter: 150, material: 'upvc', slotSize: 1.5 },
    ],
    gravelPack: [
      { id: '1', fromDepth: 20, toDepth: 65, gradeSize: '2-4mm' },
      { id: '2', fromDepth: 75, toDepth: 98, gradeSize: '2-4mm' },
    ],
    cement: [
      { id: '1', fromDepth: 0, toDepth: 6, type: 'surface_seal' },
    ],
  });

  const [showAddModal, setShowAddModal] = useState<'lithology' | 'casing' | 'gravelPack' | 'cement' | null>(null);

  // Calculate scale for SVG
  const svgHeight = 600;
  const svgWidth = 400;
  const depthScale = (svgHeight - 80) / design.totalDepth;
  const topOffset = 40;

  // Get lithology color
  const getLithologyColor = (soilType: string) => {
    return LITHOLOGY_TYPES.find(t => t.value === soilType)?.color || '#ccc';
  };

  // Add new lithology layer
  const addLithologyLayer = (layer: Omit<LithologyLayer, 'id'>) => {
    const newLayer = { ...layer, id: Date.now().toString() };
    setDesign(prev => ({
      ...prev,
      lithology: [...prev.lithology, newLayer].sort((a, b) => a.fromDepth - b.fromDepth),
    }));
    setShowAddModal(null);
  };

  // Add new casing section
  const addCasingSection = (section: Omit<CasingSection, 'id'>) => {
    const newSection = { ...section, id: Date.now().toString() };
    setDesign(prev => ({
      ...prev,
      casing: [...prev.casing, newSection].sort((a, b) => a.fromDepth - b.fromDepth),
    }));
    setShowAddModal(null);
  };

  // Delete layer
  const deleteLayer = (type: 'lithology' | 'casing' | 'gravelPack' | 'cement', id: string) => {
    setDesign(prev => ({
      ...prev,
      [type]: (prev[type] as Array<{ id: string }>).filter((item) => item.id !== id),
    }));
  };

  // Export to PDF
  const exportToPDF = () => {
    // Create a simple print-friendly version
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const svgElement = svgRef.current;
    const svgData = svgElement ? new XMLSerializer().serializeToString(svgElement) : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Borehole Design - ${borehole?.name || 'Report'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #0891b2; }
            .header { margin-bottom: 20px; }
            .diagram { text-align: center; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            .section { margin: 30px 0; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Borehole Completion Diagram</h1>
            <p><strong>Borehole:</strong> ${borehole?.name || 'N/A'}</p>
            <p><strong>Total Depth:</strong> ${design.totalDepth} m</p>
            <p><strong>Static Water Level:</strong> ${design.staticWaterLevel} m</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="diagram">
            ${svgData}
          </div>

          <div class="section">
            <h2>Lithology Log</h2>
            <table>
              <thead>
                <tr><th>From (m)</th><th>To (m)</th><th>Soil/Rock Type</th><th>Description</th></tr>
              </thead>
              <tbody>
                ${design.lithology.map(l => `
                  <tr>
                    <td>${l.fromDepth}</td>
                    <td>${l.toDepth}</td>
                    <td>${LITHOLOGY_TYPES.find(t => t.value === l.soilType)?.label || l.soilType}</td>
                    <td>${l.description || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Casing Design</h2>
            <table>
              <thead>
                <tr><th>From (m)</th><th>To (m)</th><th>Type</th><th>Diameter (mm)</th><th>Material</th><th>Slot Size (mm)</th></tr>
              </thead>
              <tbody>
                ${design.casing.map(c => `
                  <tr>
                    <td>${c.fromDepth}</td>
                    <td>${c.toDepth}</td>
                    <td>${c.type === 'screen' ? 'Screen' : 'Blind'}</td>
                    <td>${c.diameter}</td>
                    <td>${CASING_MATERIALS.find(m => m.value === c.material)?.label || c.material}</td>
                    <td>${c.slotSize || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Gravel Pack</h2>
            <table>
              <thead>
                <tr><th>From (m)</th><th>To (m)</th><th>Grade Size</th></tr>
              </thead>
              <tbody>
                ${design.gravelPack.map(g => `
                  <tr>
                    <td>${g.fromDepth}</td>
                    <td>${g.toDepth}</td>
                    <td>${g.gradeSize}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Borehole Construction Design</h3>
          <p className="text-sm text-gray-500">Design casing arrangement, lithology log, and completion details</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSave?.(design)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-aqua-500 text-white rounded-xl text-sm font-medium hover:bg-aqua-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Design
          </button>
          <button
            onClick={exportToPDF}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SVG Diagram */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Completion Diagram</h4>
          <div className="flex justify-center overflow-auto">
            <svg
              ref={svgRef}
              width={svgWidth}
              height={svgHeight}
              className="border border-gray-100 rounded-lg bg-gray-50"
            >
              {/* Title */}
              <text x={svgWidth/2} y="20" textAnchor="middle" className="text-sm font-semibold" fill="#374151">
                Borehole Completion Diagram
              </text>

              {/* Depth scale on left */}
              <g transform={`translate(30, ${topOffset})`}>
                {Array.from({ length: Math.floor(design.totalDepth / 10) + 1 }, (_, i) => i * 10).map(depth => (
                  <g key={depth}>
                    <line x1="0" y1={depth * depthScale} x2="10" y2={depth * depthScale} stroke="#9CA3AF" strokeWidth="1" />
                    <text x="-5" y={depth * depthScale + 4} textAnchor="end" fontSize="10" fill="#6B7280">{depth}</text>
                  </g>
                ))}
                <text x="-15" y={-10} textAnchor="middle" fontSize="10" fill="#6B7280" transform="rotate(-90, -15, 50)">Depth (m)</text>
              </g>

              {/* Main diagram area */}
              <g transform={`translate(80, ${topOffset})`}>
                {/* Borehole outline */}
                <rect x="50" y="0" width="120" height={design.totalDepth * depthScale} fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1" />

                {/* Lithology layers */}
                {design.lithology.map((layer) => (
                  <g key={layer.id}>
                    <rect
                      x="0"
                      y={layer.fromDepth * depthScale}
                      width="45"
                      height={(layer.toDepth - layer.fromDepth) * depthScale}
                      fill={getLithologyColor(layer.soilType)}
                      stroke="#9CA3AF"
                      strokeWidth="0.5"
                    />
                    {/* Pattern for lithology */}
                    <text
                      x="22"
                      y={((layer.fromDepth + layer.toDepth) / 2) * depthScale + 4}
                      textAnchor="middle"
                      fontSize="8"
                      fill="#374151"
                    >
                      {LITHOLOGY_TYPES.find(t => t.value === layer.soilType)?.label?.substring(0, 6) || ''}
                    </text>
                  </g>
                ))}

                {/* Gravel pack zones */}
                {design.gravelPack.map((zone) => (
                  <g key={zone.id}>
                    <rect
                      x="55"
                      y={zone.fromDepth * depthScale}
                      width="15"
                      height={(zone.toDepth - zone.fromDepth) * depthScale}
                      fill="url(#gravelPattern)"
                      stroke="#9CA3AF"
                      strokeWidth="0.5"
                    />
                    <rect
                      x="150"
                      y={zone.fromDepth * depthScale}
                      width="15"
                      height={(zone.toDepth - zone.fromDepth) * depthScale}
                      fill="url(#gravelPattern)"
                      stroke="#9CA3AF"
                      strokeWidth="0.5"
                    />
                  </g>
                ))}

                {/* Cement zones */}
                {design.cement.map((zone) => (
                  <g key={zone.id}>
                    <rect
                      x="55"
                      y={zone.fromDepth * depthScale}
                      width="15"
                      height={(zone.toDepth - zone.fromDepth) * depthScale}
                      fill="#94a3b8"
                      stroke="#64748b"
                      strokeWidth="0.5"
                    />
                    <rect
                      x="150"
                      y={zone.fromDepth * depthScale}
                      width="15"
                      height={(zone.toDepth - zone.fromDepth) * depthScale}
                      fill="#94a3b8"
                      stroke="#64748b"
                      strokeWidth="0.5"
                    />
                  </g>
                ))}

                {/* Casing sections */}
                {design.casing.map((section) => (
                  <g key={section.id}>
                    {/* Left casing wall */}
                    <rect
                      x="75"
                      y={section.fromDepth * depthScale}
                      width="8"
                      height={(section.toDepth - section.fromDepth) * depthScale}
                      fill={section.type === 'screen' ? '#22c55e' : '#3b82f6'}
                      stroke="#1f2937"
                      strokeWidth="1"
                    />
                    {/* Right casing wall */}
                    <rect
                      x="137"
                      y={section.fromDepth * depthScale}
                      width="8"
                      height={(section.toDepth - section.fromDepth) * depthScale}
                      fill={section.type === 'screen' ? '#22c55e' : '#3b82f6'}
                      stroke="#1f2937"
                      strokeWidth="1"
                    />
                    {/* Screen slots visualization */}
                    {section.type === 'screen' && (
                      <>
                        {Array.from({ length: Math.floor((section.toDepth - section.fromDepth) / 3) }, (_, i) => (
                          <g key={i}>
                            <line
                              x1="75"
                              y1={(section.fromDepth + i * 3 + 1.5) * depthScale}
                              x2="83"
                              y2={(section.fromDepth + i * 3 + 1.5) * depthScale}
                              stroke="#1f2937"
                              strokeWidth="1"
                              strokeDasharray="2,2"
                            />
                            <line
                              x1="137"
                              y1={(section.fromDepth + i * 3 + 1.5) * depthScale}
                              x2="145"
                              y2={(section.fromDepth + i * 3 + 1.5) * depthScale}
                              stroke="#1f2937"
                              strokeWidth="1"
                              strokeDasharray="2,2"
                            />
                          </g>
                        ))}
                      </>
                    )}
                    {/* Casing label */}
                    <text
                      x="200"
                      y={((section.fromDepth + section.toDepth) / 2) * depthScale + 4}
                      fontSize="9"
                      fill="#374151"
                    >
                      {section.type === 'screen' ? 'Screen' : 'Blind'} {section.diameter}mm
                    </text>
                  </g>
                ))}

                {/* Static water level */}
                <line
                  x1="60"
                  y1={design.staticWaterLevel * depthScale}
                  x2="160"
                  y2={design.staticWaterLevel * depthScale}
                  stroke="#0ea5e9"
                  strokeWidth="2"
                  strokeDasharray="5,3"
                />
                <text
                  x="200"
                  y={design.staticWaterLevel * depthScale + 4}
                  fontSize="9"
                  fill="#0ea5e9"
                >
                  SWL: {design.staticWaterLevel}m
                </text>

                {/* Ground level */}
                <line x1="-10" y1="0" x2="180" y2="0" stroke="#16a34a" strokeWidth="3" />
                <text x="200" y="4" fontSize="9" fill="#16a34a">Ground Level</text>

                {/* Bottom of borehole */}
                <line
                  x1="50"
                  y1={design.totalDepth * depthScale}
                  x2="170"
                  y2={design.totalDepth * depthScale}
                  stroke="#1f2937"
                  strokeWidth="2"
                />
              </g>

              {/* Legend */}
              <g transform={`translate(${svgWidth - 120}, ${svgHeight - 100})`}>
                <text x="0" y="0" fontSize="10" fontWeight="bold" fill="#374151">Legend</text>
                <rect x="0" y="10" width="15" height="10" fill="#3b82f6" />
                <text x="20" y="18" fontSize="9" fill="#6B7280">Blind Casing</text>
                <rect x="0" y="25" width="15" height="10" fill="#22c55e" />
                <text x="20" y="33" fontSize="9" fill="#6B7280">Screen</text>
                <rect x="0" y="40" width="15" height="10" fill="#94a3b8" />
                <text x="20" y="48" fontSize="9" fill="#6B7280">Cement</text>
                <rect x="0" y="55" width="15" height="10" fill="url(#gravelPattern)" stroke="#9CA3AF" />
                <text x="20" y="63" fontSize="9" fill="#6B7280">Gravel Pack</text>
                <line x1="0" y1="75" x2="15" y2="75" stroke="#0ea5e9" strokeWidth="2" strokeDasharray="3,2" />
                <text x="20" y="78" fontSize="9" fill="#6B7280">Water Level</text>
              </g>

              {/* Patterns */}
              <defs>
                <pattern id="gravelPattern" patternUnits="userSpaceOnUse" width="6" height="6">
                  <circle cx="2" cy="2" r="1.5" fill="#a1a1aa" />
                  <circle cx="5" cy="5" r="1" fill="#d4d4d8" />
                </pattern>
              </defs>
            </svg>
          </div>
        </div>

        {/* Data Entry Panels */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-100 px-4">
            <nav className="flex gap-1">
              {[
                { id: 'lithology', label: 'Lithology' },
                { id: 'casing', label: 'Casing' },
                { id: 'completion', label: 'Completion' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-aqua-500 text-aqua-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4 max-h-[500px] overflow-y-auto">
            {activeTab === 'lithology' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Lithology Log</h4>
                  <button
                    onClick={() => setShowAddModal('lithology')}
                    className="text-sm text-aqua-600 hover:text-aqua-700 font-medium"
                  >
                    + Add Layer
                  </button>
                </div>
                <div className="space-y-2">
                  {design.lithology.map((layer) => (
                    <div
                      key={layer.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div
                        className="w-6 h-6 rounded-lg border border-gray-300"
                        style={{ backgroundColor: getLithologyColor(layer.soilType) }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {LITHOLOGY_TYPES.find(t => t.value === layer.soilType)?.label}
                        </p>
                        <p className="text-xs text-gray-500">
                          {layer.fromDepth}m - {layer.toDepth}m
                        </p>
                      </div>
                      <button
                        onClick={() => deleteLayer('lithology', layer.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'casing' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Casing Design</h4>
                  <button
                    onClick={() => setShowAddModal('casing')}
                    className="text-sm text-aqua-600 hover:text-aqua-700 font-medium"
                  >
                    + Add Section
                  </button>
                </div>
                <div className="space-y-2">
                  {design.casing.map((section) => (
                    <div
                      key={section.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div
                        className={`w-6 h-6 rounded-lg ${
                          section.type === 'screen' ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {section.type === 'screen' ? 'Screen' : 'Blind'} - {section.diameter}mm {section.material.toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {section.fromDepth}m - {section.toDepth}m
                          {section.slotSize && ` | Slot: ${section.slotSize}mm`}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteLayer('casing', section.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'completion' && (
              <div className="space-y-6">
                {/* General Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">General</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Total Depth (m)</label>
                      <input
                        type="number"
                        value={design.totalDepth}
                        onChange={(e) => setDesign(prev => ({ ...prev, totalDepth: Number(e.target.value) }))}
                        className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-aqua-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Static Water Level (m)</label>
                      <input
                        type="number"
                        value={design.staticWaterLevel}
                        onChange={(e) => setDesign(prev => ({ ...prev, staticWaterLevel: Number(e.target.value) }))}
                        className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-aqua-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Gravel Pack */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Gravel Pack</h4>
                    <button
                      onClick={() => setShowAddModal('gravelPack')}
                      className="text-sm text-aqua-600 hover:text-aqua-700 font-medium"
                    >
                      + Add Zone
                    </button>
                  </div>
                  {design.gravelPack.map((zone) => (
                    <div
                      key={zone.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{zone.gradeSize}</p>
                        <p className="text-xs text-gray-500">{zone.fromDepth}m - {zone.toDepth}m</p>
                      </div>
                      <button
                        onClick={() => deleteLayer('gravelPack', zone.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Cement */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Cement / Grout</h4>
                    <button
                      onClick={() => setShowAddModal('cement')}
                      className="text-sm text-aqua-600 hover:text-aqua-700 font-medium"
                    >
                      + Add Zone
                    </button>
                  </div>
                  {design.cement.map((zone) => (
                    <div
                      key={zone.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {zone.type === 'surface_seal' ? 'Surface Seal' : zone.type === 'annular' ? 'Annular Seal' : 'Bottom Plug'}
                        </p>
                        <p className="text-xs text-gray-500">{zone.fromDepth}m - {zone.toDepth}m</p>
                      </div>
                      <button
                        onClick={() => deleteLayer('cement', zone.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Modals */}
      {showAddModal === 'lithology' && (
        <AddLithologyModal
          onClose={() => setShowAddModal(null)}
          onAdd={addLithologyLayer}
          maxDepth={design.totalDepth}
        />
      )}

      {showAddModal === 'casing' && (
        <AddCasingModal
          onClose={() => setShowAddModal(null)}
          onAdd={addCasingSection}
          maxDepth={design.totalDepth}
        />
      )}
    </div>
  );
}

// Add Lithology Modal
function AddLithologyModal({
  onClose,
  onAdd,
  maxDepth,
}: {
  onClose: () => void;
  onAdd: (layer: Omit<LithologyLayer, 'id'>) => void;
  maxDepth: number;
}) {
  const [fromDepth, setFromDepth] = useState(0);
  const [toDepth, setToDepth] = useState(10);
  const [soilType, setSoilType] = useState('sand_medium');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const color = LITHOLOGY_TYPES.find(t => t.value === soilType)?.color || '#ccc';
    onAdd({ fromDepth, toDepth, soilType, description, color });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Lithology Layer</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">From Depth (m)</label>
              <input
                type="number"
                min="0"
                max={maxDepth}
                value={fromDepth}
                onChange={(e) => setFromDepth(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-aqua-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">To Depth (m)</label>
              <input
                type="number"
                min="0"
                max={maxDepth}
                value={toDepth}
                onChange={(e) => setToDepth(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-aqua-400"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Soil/Rock Type</label>
            <select
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-aqua-400"
            >
              {LITHOLOGY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-aqua-400"
              placeholder="e.g., Brown, moist, well sorted"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-aqua-500 text-white rounded-xl text-sm font-medium hover:bg-aqua-600 transition-colors"
            >
              Add Layer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Casing Modal
function AddCasingModal({
  onClose,
  onAdd,
  maxDepth,
}: {
  onClose: () => void;
  onAdd: (section: Omit<CasingSection, 'id'>) => void;
  maxDepth: number;
}) {
  const [fromDepth, setFromDepth] = useState(0);
  const [toDepth, setToDepth] = useState(20);
  const [type, setType] = useState<'blind' | 'screen'>('blind');
  const [diameter, setDiameter] = useState(150);
  const [material, setMaterial] = useState('upvc');
  const [slotSize, setSlotSize] = useState(1.0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      fromDepth,
      toDepth,
      type,
      diameter,
      material,
      slotSize: type === 'screen' ? slotSize : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Casing Section</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">From Depth (m)</label>
              <input
                type="number"
                min="0"
                max={maxDepth}
                value={fromDepth}
                onChange={(e) => setFromDepth(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-aqua-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">To Depth (m)</label>
              <input
                type="number"
                min="0"
                max={maxDepth}
                value={toDepth}
                onChange={(e) => setToDepth(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-aqua-400"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Casing Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('blind')}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  type === 'blind'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Blind Casing
              </button>
              <button
                type="button"
                onClick={() => setType('screen')}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  type === 'screen'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Screen
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Diameter (mm)</label>
              <select
                value={diameter}
                onChange={(e) => setDiameter(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-aqua-400"
              >
                <option value={100}>100 mm</option>
                <option value={125}>125 mm</option>
                <option value={150}>150 mm</option>
                <option value={200}>200 mm</option>
                <option value={250}>250 mm</option>
                <option value={300}>300 mm</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Material</label>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-aqua-400"
              >
                {CASING_MATERIALS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
          {type === 'screen' && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Slot Size (mm)</label>
              <select
                value={slotSize}
                onChange={(e) => setSlotSize(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-aqua-400"
              >
                <option value={0.5}>0.5 mm</option>
                <option value={0.75}>0.75 mm</option>
                <option value={1.0}>1.0 mm</option>
                <option value={1.5}>1.5 mm</option>
                <option value={2.0}>2.0 mm</option>
                <option value={3.0}>3.0 mm</option>
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-aqua-500 text-white rounded-xl text-sm font-medium hover:bg-aqua-600 transition-colors"
            >
              Add Section
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
