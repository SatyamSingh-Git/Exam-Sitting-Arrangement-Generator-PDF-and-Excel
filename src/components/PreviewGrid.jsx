import React, { useRef, useState } from 'react'

export default function PreviewGrid({ seating, rows, cols, perBench, gapAfter, zoom=1 }){
  const containerRef = useRef()
  const [tooltip, setTooltip] = useState({visible:false,x:0,y:0,content:''})

  function showTooltip(e, text){
    const rect = containerRef.current?.getBoundingClientRect() || {left:0,top:0}
    setTooltip({visible:true, x: e.clientX - rect.left + 8, y: e.clientY - rect.top + 8, content: text})
  }
  function hideTooltip(){ setTooltip({visible:false,x:0,y:0,content:''}) }

  // layout: use explicit column count so benches map to actual room columns
  const colCount = Math.max(1, Number(cols) || 1)
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${colCount}, minmax(120px, 1fr))`,
    gap: '12px',
    transform: `scale(${zoom})`,
    transformOrigin: 'top left'
  }

  return (
    <div ref={containerRef} className="p-3 border rounded bg-white overflow-auto relative" style={{minHeight:120}}>
      <div style={gridStyle}>
        {seating.map((bench,bi)=>{
          if(bench.isGap) return <div key={bi} style={{width: 48}} />
          return (
            <div key={bi} className="bg-white border rounded p-3 shadow-sm" style={{minHeight:86}}>
              <div className="text-xs text-gray-600 mb-2">Bench {bi+1}</div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-3 items-start justify-start">
                  {bench.seats.map((s,si)=> {
                    const color = s ? s.color : '#f3f4f6'
                    const roll = s ? s.roll : 'Empty'
                    const clsName = s ? s.className : ''
                    return (
                      <div key={si} className="flex flex-col items-center" onMouseEnter={(e)=>showTooltip(e, `${roll} ${clsName? `(${clsName})`:''}`)} onMouseMove={(e)=>showTooltip(e, `${roll} ${clsName? `(${clsName})`:''}`)} onMouseLeave={hideTooltip}>
                          <div style={{width:28,height:18,background: color, borderRadius:4, border:'1px solid rgba(0,0,0,0.06)'}} />
                          <div className="text-xs text-gray-800 mt-1">{roll}</div>
                          <div className="text-xs text-gray-500">{clsName}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {tooltip.visible && (
        <div className="absolute z-50 pointer-events-none bg-white border rounded px-2 py-1 text-sm shadow" style={{left:tooltip.x, top:tooltip.y}}>
          {tooltip.content}
        </div>
      )}
    </div>
  )
}
