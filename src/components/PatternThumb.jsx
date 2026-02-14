import React from 'react'

function Bench({ x, y, seatColors, benchW, benchH, seatGap }){
  // render a bench as two small rectangles (seats) with configurable gap
  const pad = 4
  const seatWidth = Math.max(8, Math.floor((benchW - pad*2 - seatGap) / 2))
  const seatHeight = Math.max(10, benchH - pad*2)
  const leftX = pad
  const rightX = pad + seatWidth + seatGap
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="0" y="0" width={benchW} height={benchH} rx="3" fill="#ffffff" stroke="#e5e7eb" />
      <rect x={leftX} y={pad} width={seatWidth} height={seatHeight} rx="2" fill={seatColors[0] || '#ef4444'} />
      <rect x={rightX} y={pad} width={seatWidth} height={seatHeight} rx="2" fill={seatColors[1] || '#3b82f6'} />
    </g>
  )
}

export default function PatternThumb({ pattern, classes, benchW = 52, benchH = 28, seatGap = 8, perBench = 2 }){
  const cols = 4
  const rows = 3
  const gapX = 10
  const gapY = 10

  // Prepare colors fallback
  const clsColors = (classes && classes.map(c=>c.color)) || ['#ef4444','#3b82f6','#f59e0b']

  const benches = []
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const x = c * (benchW + gapX)
      const y = r * (benchH + gapY)
      benches.push({x,y,idx: r*cols + c, row: r, col: c})
    }
  }

  // calculate svg size so benches are not clipped
  const svgWidth = 12 + cols * (benchW + gapX)
  const svgHeight = 12 + rows * (benchH + gapY)

  // Render SVG responsively so it can be sized by parent container
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <rect width={svgWidth} height={svgHeight} fill="#fff" />
      <g transform="translate(12,12)">
        {benches.map(b=>{
          // compute seat-level colors so thumbnails mirror actual seating logic (accounts for perBench)
          const leftSeatCol = b.col * perBench + 0
          const rightSeatCol = b.col * perBench + 1
          let leftColor = clsColors[0] || '#ef4444'
          let rightColor = clsColors[1] || '#3b82f6'

          if(pattern==='pattern2'){
            const leftParity = (b.row + leftSeatCol) % 2
            const rightParity = (b.row + rightSeatCol) % 2
            leftColor = leftParity === 0 ? (clsColors[0] || '#ef4444') : (clsColors[1] || '#3b82f6')
            rightColor = rightParity === 0 ? (clsColors[0] || '#ef4444') : (clsColors[1] || '#3b82f6')
          } else if(pattern==='pattern3'){
            const parity = (b.row + b.col) % 2
            leftColor = parity === 0 ? (clsColors[0] || '#ef4444') : '#ffffff'
            rightColor = parity === 0 ? '#ffffff' : (clsColors[0] || '#ef4444')
          } else if(pattern==='pattern4'){
            leftColor = clsColors[0] || '#ef4444'
            rightColor = '#ffffff'
          }

          const seatColors = [leftColor, rightColor]
          return <Bench key={b.idx} x={b.x} y={b.y} seatColors={seatColors} benchW={benchW} benchH={benchH} seatGap={seatGap} />
        })}
      </g>
    </svg>
  )
}
