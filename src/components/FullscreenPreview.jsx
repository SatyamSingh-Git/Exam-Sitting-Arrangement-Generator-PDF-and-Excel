import React, { useState } from 'react'
import PreviewGrid from './PreviewGrid'

export default function FullscreenPreview({ seating, rows, cols, perBench, gapAfter, onClose }){
  const [zoom, setZoom] = useState(1)
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center p-8">
      <div className="bg-white rounded shadow-xl w-full max-w-6xl max-h-full overflow-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Full-screen Preview</div>
          <div className="flex items-center gap-3">
            <label className="text-sm">Zoom</label>
            <input type="range" min="0.5" max="2" step="0.1" value={zoom} onChange={e=>setZoom(Number(e.target.value))} />
            <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded">Close</button>
          </div>
        </div>
        <PreviewGrid seating={seating} rows={rows} cols={cols} perBench={perBench} gapAfter={gapAfter} zoom={zoom} />
      </div>
    </div>
  )
}
