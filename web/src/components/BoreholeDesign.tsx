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
  const svgWidth = 450;
  const depthScale = (svgHeight - 80) / design.totalDepth;
  const topOffset = 40;

  // Get lithology color
  const getLithologyColor = (soilType: string) => {
    return LITHOLOGY_TYPES.find(t => t.value === soilType)?.color || '#ccc';
  };

  // Determine if text should be light or dark based on background
  const getContrastTextColor = (bgColor: string) => {
    // Convert hex to RGB
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1f2937' : '#ffffff';
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

  // Export dropdown state
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Download SVG file
  const downloadSVG = () => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${borehole?.name || 'borehole'}-completion-diagram.svg`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Download as PNG
  const downloadPNG = () => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // Set canvas size (2x for better quality)
    canvas.width = svgWidth * 2;
    canvas.height = svgHeight * 2;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);

        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `${borehole?.name || 'borehole'}-completion-diagram.png`;
        a.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    setShowExportMenu(false);
  };

  // Download complete driller's report as HTML (can be saved as PDF)
  const downloadDrillerReport = () => {
    const svgElement = svgRef.current;
    const svgData = svgElement ? new XMLSerializer().serializeToString(svgElement) : '';
    const fileName = `${borehole?.name || 'borehole'}-driller-report.html`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Driller's Completion Report - ${borehole?.name || 'Borehole'}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
      color: #333;
    }
    .header {
      border-bottom: 3px solid #0891b2;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header h1 {
      color: #0891b2;
      margin: 0 0 5px 0;
      font-size: 24px;
    }
    .header .subtitle {
      color: #666;
      font-size: 14px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-value {
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
    .diagram-container {
      text-align: center;
      margin: 20px 0;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .diagram-container svg {
      max-width: 100%;
      height: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background: #0891b2;
      color: white;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
    }
    tr:nth-child(even) { background: #f8f9fa; }
    .section {
      margin: 25px 0;
      page-break-inside: avoid;
    }
    .section h2 {
      font-size: 16px;
      color: #0891b2;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .notes-section {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
    }
    .notes-section h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #92400e;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      font-size: 11px;
      color: #666;
      display: flex;
      justify-content: space-between;
    }
    .signature-area {
      margin-top: 40px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 40px;
    }
    .signature-box {
      border-top: 1px solid #333;
      padding-top: 8px;
    }
    .signature-label {
      font-size: 11px;
      color: #666;
    }
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
        padding: 10px;
      }
      .header { page-break-after: avoid; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>BOREHOLE COMPLETION REPORT</h1>
    <p class="subtitle">Driller's Construction Specification</p>
  </div>

  <div class="info-grid">
    <div class="info-item">
      <span class="info-label">Borehole ID</span>
      <span class="info-value">${borehole?.name || 'N/A'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Date Generated</span>
      <span class="info-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Total Depth</span>
      <span class="info-value">${design.totalDepth} meters</span>
    </div>
    <div class="info-item">
      <span class="info-label">Static Water Level</span>
      <span class="info-value">${design.staticWaterLevel} meters</span>
    </div>
    <div class="info-item">
      <span class="info-label">Location</span>
      <span class="info-value">${borehole?.latitude ? `${borehole.latitude.toFixed(6)}, ${borehole.longitude.toFixed(6)}` : 'N/A'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Elevation</span>
      <span class="info-value">${borehole?.elevation ? `${borehole.elevation} m ASL` : 'N/A'}</span>
    </div>
  </div>

  <div class="diagram-container">
    <h3 style="margin: 0 0 15px 0; color: #374151;">Completion Diagram</h3>
    ${svgData}
  </div>

  <div class="section">
    <h2>LITHOLOGY LOG</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 15%">From (m)</th>
          <th style="width: 15%">To (m)</th>
          <th style="width: 15%">Thickness (m)</th>
          <th style="width: 25%">Formation</th>
          <th style="width: 30%">Description</th>
        </tr>
      </thead>
      <tbody>
        ${design.lithology.map(l => `
          <tr>
            <td>${l.fromDepth}</td>
            <td>${l.toDepth}</td>
            <td>${l.toDepth - l.fromDepth}</td>
            <td><strong>${LITHOLOGY_TYPES.find(t => t.value === l.soilType)?.label || l.soilType}</strong></td>
            <td>${l.description || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>CASING DESIGN SPECIFICATION</h2>
    <table>
      <thead>
        <tr>
          <th>From (m)</th>
          <th>To (m)</th>
          <th>Length (m)</th>
          <th>Type</th>
          <th>Diameter</th>
          <th>Material</th>
          <th>Slot Size</th>
        </tr>
      </thead>
      <tbody>
        ${design.casing.map(c => `
          <tr>
            <td>${c.fromDepth}</td>
            <td>${c.toDepth}</td>
            <td>${c.toDepth - c.fromDepth}</td>
            <td><strong style="color: ${c.type === 'screen' ? '#16a34a' : '#2563eb'}">${c.type === 'screen' ? 'SCREEN' : 'BLIND CASING'}</strong></td>
            <td>${c.diameter} mm</td>
            <td>${CASING_MATERIALS.find(m => m.value === c.material)?.label || c.material}</td>
            <td>${c.slotSize ? c.slotSize + ' mm' : '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>GRAVEL PACK</h2>
    <table>
      <thead>
        <tr>
          <th>From (m)</th>
          <th>To (m)</th>
          <th>Length (m)</th>
          <th>Grade Size</th>
        </tr>
      </thead>
      <tbody>
        ${design.gravelPack.length > 0 ? design.gravelPack.map(g => `
          <tr>
            <td>${g.fromDepth}</td>
            <td>${g.toDepth}</td>
            <td>${g.toDepth - g.fromDepth}</td>
            <td>${g.gradeSize}</td>
          </tr>
        `).join('') : '<tr><td colspan="4" style="text-align: center; color: #666;">No gravel pack specified</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>CEMENT / GROUT</h2>
    <table>
      <thead>
        <tr>
          <th>From (m)</th>
          <th>To (m)</th>
          <th>Length (m)</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>
        ${design.cement.length > 0 ? design.cement.map(c => `
          <tr>
            <td>${c.fromDepth}</td>
            <td>${c.toDepth}</td>
            <td>${c.toDepth - c.fromDepth}</td>
            <td>${c.type === 'surface_seal' ? 'Surface Seal' : c.type === 'annular' ? 'Annular Seal' : 'Bottom Plug'}</td>
          </tr>
        `).join('') : '<tr><td colspan="4" style="text-align: center; color: #666;">No cement zones specified</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="notes-section">
    <h3>IMPORTANT NOTES FOR DRILLER</h3>
    <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
      <li>Ensure all casing joints are properly sealed</li>
      <li>Gravel pack should be placed slowly to avoid bridging</li>
      <li>Allow cement to cure for minimum 24 hours before development</li>
      <li>Verify actual depths against design during installation</li>
      <li>Record any deviations from this design on completion</li>
    </ul>
  </div>

  <div class="signature-area">
    <div>
      <div class="signature-box">
        <p class="signature-label">Prepared By (Hydrogeologist)</p>
      </div>
      <p style="font-size: 11px; color: #666; margin-top: 5px;">Date: _______________</p>
    </div>
    <div>
      <div class="signature-box">
        <p class="signature-label">Approved By (Project Manager)</p>
      </div>
      <p style="font-size: 11px; color: #666; margin-top: 5px;">Date: _______________</p>
    </div>
  </div>

  <div class="footer">
    <span>Generated by Aquapack - Field Data Management System</span>
    <span>Document ID: ${borehole?.id || 'DRAFT'}</span>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Print directly
  const printReport = () => {
    const svgElement = svgRef.current;
    const svgData = svgElement ? new XMLSerializer().serializeToString(svgElement) : '';

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Borehole Design - ${borehole?.name || 'Report'}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
    h1 { color: #0891b2; font-size: 20px; }
    .header { border-bottom: 2px solid #0891b2; padding-bottom: 10px; margin-bottom: 15px; }
    .info-row { display: flex; gap: 30px; margin-bottom: 15px; font-size: 13px; }
    .diagram { text-align: center; margin: 15px 0; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
    th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
    th { background: #0891b2; color: white; }
    .section { margin: 20px 0; }
    .section h2 { font-size: 14px; color: #0891b2; margin-bottom: 8px; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>BOREHOLE COMPLETION DESIGN</h1>
  </div>
  <div class="info-row">
    <div><strong>Borehole:</strong> ${borehole?.name || 'N/A'}</div>
    <div><strong>Total Depth:</strong> ${design.totalDepth} m</div>
    <div><strong>SWL:</strong> ${design.staticWaterLevel} m</div>
    <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
  </div>
  <div class="diagram">${svgData}</div>
  <div class="section">
    <h2>Lithology Log</h2>
    <table>
      <tr><th>From</th><th>To</th><th>Formation</th><th>Description</th></tr>
      ${design.lithology.map(l => `<tr><td>${l.fromDepth}m</td><td>${l.toDepth}m</td><td>${LITHOLOGY_TYPES.find(t => t.value === l.soilType)?.label || l.soilType}</td><td>${l.description || '-'}</td></tr>`).join('')}
    </table>
  </div>
  <div class="section">
    <h2>Casing Design</h2>
    <table>
      <tr><th>From</th><th>To</th><th>Type</th><th>Diameter</th><th>Material</th><th>Slot</th></tr>
      ${design.casing.map(c => `<tr><td>${c.fromDepth}m</td><td>${c.toDepth}m</td><td>${c.type === 'screen' ? 'Screen' : 'Blind'}</td><td>${c.diameter}mm</td><td>${CASING_MATERIALS.find(m => m.value === c.material)?.label || c.material}</td><td>${c.slotSize || '-'}</td></tr>`).join('')}
    </table>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`);
    printWindow.document.close();
    setShowExportMenu(false);
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

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowExportMenu(!showExportMenu); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
              <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-40 overflow-hidden">
                  <div className="py-1">
                    <button
                      onClick={downloadSVG}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div className="text-left">
                        <p className="font-medium">Download SVG</p>
                        <p className="text-xs text-gray-500">Vector format for editing</p>
                      </div>
                    </button>

                    <button
                      onClick={downloadPNG}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div className="text-left">
                        <p className="font-medium">Download PNG</p>
                        <p className="text-xs text-gray-500">High-quality image</p>
                      </div>
                    </button>

                    <div className="border-t border-gray-100 my-1" />

                    <button
                      onClick={downloadDrillerReport}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="text-left">
                        <p className="font-medium">Driller's Report</p>
                        <p className="text-xs text-gray-500">Complete specs for handover</p>
                      </div>
                    </button>

                    <button
                      onClick={printReport}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <div className="text-left">
                        <p className="font-medium">Print</p>
                        <p className="text-xs text-gray-500">Print or save as PDF</p>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
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
              <g transform={`translate(35, ${topOffset})`}>
                {Array.from({ length: Math.floor(design.totalDepth / 10) + 1 }, (_, i) => i * 10).map(depth => (
                  <g key={depth}>
                    <line x1="0" y1={depth * depthScale} x2="10" y2={depth * depthScale} stroke="#9CA3AF" strokeWidth="1" />
                    <text x="-5" y={depth * depthScale + 4} textAnchor="end" fontSize="10" fill="#374151" fontWeight="500">{depth}</text>
                  </g>
                ))}
              </g>
              {/* Depth label - positioned separately for proper rotation */}
              <text
                x="12"
                y={topOffset + (design.totalDepth * depthScale) / 2}
                textAnchor="middle"
                fontSize="10"
                fill="#374151"
                fontWeight="500"
                transform={`rotate(-90, 12, ${topOffset + (design.totalDepth * depthScale) / 2})`}
              >
                Depth (m)
              </text>

              {/* Main diagram area */}
              <g transform={`translate(80, ${topOffset})`}>
                {/* Borehole outline */}
                <rect x="50" y="0" width="120" height={design.totalDepth * depthScale} fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1" />

                {/* Lithology layers */}
                {design.lithology.map((layer) => {
                  const bgColor = getLithologyColor(layer.soilType);
                  const textColor = getContrastTextColor(bgColor);
                  return (
                    <g key={layer.id}>
                      <rect
                        x="0"
                        y={layer.fromDepth * depthScale}
                        width="45"
                        height={(layer.toDepth - layer.fromDepth) * depthScale}
                        fill={bgColor}
                        stroke="#9CA3AF"
                        strokeWidth="0.5"
                      />
                      {/* Pattern for lithology */}
                      {/* Text outline for visibility on dark backgrounds */}
                      {textColor === '#ffffff' && (
                        <text
                          x="22"
                          y={((layer.fromDepth + layer.toDepth) / 2) * depthScale + 4}
                          textAnchor="middle"
                          fontSize="8"
                          fill="none"
                          stroke="#000000"
                          strokeWidth="2"
                          fontWeight="600"
                        >
                          {LITHOLOGY_TYPES.find(t => t.value === layer.soilType)?.label?.substring(0, 6) || ''}
                        </text>
                      )}
                      <text
                        x="22"
                        y={((layer.fromDepth + layer.toDepth) / 2) * depthScale + 4}
                        textAnchor="middle"
                        fontSize="8"
                        fill={textColor}
                        fontWeight="600"
                      >
                        {LITHOLOGY_TYPES.find(t => t.value === layer.soilType)?.label?.substring(0, 6) || ''}
                      </text>
                    </g>
                  );
                })}

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
                      fill={section.type === 'screen' ? '#16a34a' : '#2563eb'}
                      fontWeight="600"
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
                  fill="#0284c7"
                  fontWeight="600"
                >
                  SWL: {design.staticWaterLevel}m
                </text>

                {/* Ground level */}
                <line x1="-10" y1="0" x2="180" y2="0" stroke="#16a34a" strokeWidth="3" />
                <text x="200" y="4" fontSize="9" fill="#16a34a" fontWeight="600">Ground Level</text>

                {/* Bottom of borehole */}
                <line
                  x1="50"
                  y1={design.totalDepth * depthScale}
                  x2="170"
                  y2={design.totalDepth * depthScale}
                  stroke="#1f2937"
                  strokeWidth="2"
                />
                <text
                  x="200"
                  y={design.totalDepth * depthScale + 4}
                  fontSize="9"
                  fill="#374151"
                  fontWeight="500"
                >
                  TD: {design.totalDepth}m
                </text>
              </g>

              {/* Legend */}
              <g transform={`translate(${svgWidth - 130}, ${svgHeight - 110})`}>
                <rect x="-5" y="-12" width="125" height="105" fill="white" stroke="#e5e7eb" rx="4" />
                <text x="0" y="0" fontSize="10" fontWeight="bold" fill="#374151">Legend</text>
                <rect x="0" y="10" width="15" height="10" fill="#3b82f6" stroke="#1f2937" strokeWidth="0.5" />
                <text x="20" y="18" fontSize="9" fill="#374151">Blind Casing</text>
                <rect x="0" y="25" width="15" height="10" fill="#22c55e" stroke="#1f2937" strokeWidth="0.5" />
                <text x="20" y="33" fontSize="9" fill="#374151">Screen</text>
                <rect x="0" y="40" width="15" height="10" fill="#94a3b8" stroke="#64748b" strokeWidth="0.5" />
                <text x="20" y="48" fontSize="9" fill="#374151">Cement</text>
                <rect x="0" y="55" width="15" height="10" fill="url(#gravelPattern)" stroke="#9CA3AF" strokeWidth="0.5" />
                <text x="20" y="63" fontSize="9" fill="#374151">Gravel Pack</text>
                <line x1="0" y1="75" x2="15" y2="75" stroke="#0ea5e9" strokeWidth="2" strokeDasharray="3,2" />
                <text x="20" y="78" fontSize="9" fill="#374151">Water Level</text>
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
