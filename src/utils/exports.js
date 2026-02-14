import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'
import directionImg from '../../pattern_Images/direction image.png'

// seating: array of benches in row-major order. rows, cols: layout
export function saveAsExcel(seating, rows, cols, perBench = 2, gapAfter = 0) {
  // Build 2D array where each seat gets its own cell. Insert empty gap columns after every gapAfter benches.
  const data = []
  const gapCount = gapAfter > 0 ? Math.floor((cols - 1) / gapAfter) : 0
  const totalCols = cols * perBench + gapCount

  for (let r = 0; r < rows; r++) {
    const row = Array(totalCols).fill('')
    let outCol = 0
    for (let c = 0; c < cols; c++) {
      const benchIdx = r * cols + c
      const bench = seating[benchIdx]
      if (bench) {
        for (let s = 0; s < perBench; s++) {
          const seat = bench.seats[s]
          row[outCol] = seat ? String(seat.roll) : ''
          outCol++
        }
      } else {
        outCol += perBench
      }
      // insert gap column if configured and not last column
      if (gapAfter > 0 && ((c + 1) % gapAfter === 0) && c !== cols - 1) {
        row[outCol] = ''
        outCol++
      }
    }
    data.push(row)
  }

  const ws = XLSX.utils.aoa_to_sheet(data)
  // mark gap columns with a light gray fill if possible
  if (gapAfter > 0) {
    const gapIndices = []
    let colPtr = 0
    for (let c = 0; c < cols; c++) {
      colPtr += perBench
      if (gapAfter > 0 && ((c + 1) % gapAfter === 0) && c !== cols - 1) {
        gapIndices.push(colPtr)
        colPtr += 1
      }
    }

    // apply simple fill style to each gap cell
    for (const gc of gapIndices) {
      for (let r = 0; r < rows; r++) {
        const addr = XLSX.utils.encode_cell({ c: gc, r })
        if (!ws[addr]) ws[addr] = { t: 's', v: '' }
        // apply light gray solid fill using common SheetJS style format
        ws[addr].s = ws[addr].s || {}
        ws[addr].s.fill = { patternType: 'solid', fgColor: { rgb: 'EEEEEE' } }
      }
    }
  }
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Seating')
  // write with cellStyles enabled so the fill is preserved in the .xlsx file
  try {
    XLSX.writeFile(wb, 'seating.xlsx', { bookType: 'xlsx', cellStyles: true })
  } catch (err) {
    // fallback if cellStyles not supported in this build
    XLSX.writeFile(wb, 'seating.xlsx')
  }
}

export async function saveAsPdf(seating, rows, cols, perBench = 2, gapAfter = 0, meta = {}) {
  // ─── Build off-screen HTML matching the Hindi exam seating chart ───
  const gapCount = gapAfter > 0 ? Math.floor((cols - 1) / gapAfter) : 0
  const totalVisualCols = cols + gapCount

  const roomVal = meta.roomNumber || ''
  const centerVal = meta.centerNumber || ''
  const dirVal = meta.direction || ''
  const date1 = formatDateString(meta.examDate || '')
  const subj1 = meta.subject || ''
  const qp1 = meta.questionPaper || ''
  const date2 = formatDateString(meta.examDate2 || '')
  const subj2 = meta.subject2 || ''
  const qp2 = meta.questionPaper2 || ''
  const schoolName = (meta && meta.schoolName) ? String(meta.schoolName) : ''

  // Build class summary
  const classRanges = computeClassRangeFromMetaOrSeating(meta, seating)
  let totalStudents = 0
  for (const bench of seating || []) {
    for (const seat of (bench.seats || [])) {
      if (seat) totalStudents++
    }
  }

  let classSummaryHtml = ''
  for (const cr of classRanges) {
    if (!cr.name) continue
    let rangeText = ''
    if ((cr.start || '') && (cr.end || '')) {
      const sN = Number(cr.start), eN = Number(cr.end)
      if (!Number.isNaN(sN) && !Number.isNaN(eN)) {
        rangeText = `${cr.start} से ${cr.end} = ${Math.max(0, eN - sN + 1)}`
      } else {
        rangeText = `${cr.start} से ${cr.end}`
      }
    } else {
      rangeText = cr.start || cr.end || ''
    }
    classSummaryHtml += `<div style="margin-bottom:2px"><b>${cr.name}:</b>&nbsp;&nbsp;${rangeText}</div>`
  }
  classSummaryHtml += `<div><b>कुल:</b>&nbsp;&nbsp;${totalStudents}</div>`

  // Build seating grid rows
  let gridHeaderHtml = ''
  let gridBodyHtml = ''

  // Header row with "अनुक्रमांक"
  gridHeaderHtml += '<tr>'
  for (let c = 0; c < cols; c++) {
    gridHeaderHtml += `<th style="border:1.5px solid #000;padding:6px 2px;text-align:center;font-weight:bold;font-size:11px;">अनुक्रमांक</th>`
    if (gapAfter > 0 && ((c + 1) % gapAfter === 0) && c !== cols - 1) {
      gridHeaderHtml += `<th style="border:1.5px solid #000;background:#eee;width:18px;"></th>`
    }
  }
  gridHeaderHtml += '</tr>'

  // Data rows
  for (let r = 0; r < rows; r++) {
    gridBodyHtml += '<tr>'
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c
      const bench = seating[idx]
      let cellContent = ''
      if (bench) {
        const validSeats = (bench.seats || []).filter(s => s)
        if (validSeats.length > 0) {
          const rollLine = validSeats.map(s => String(s.roll)).join(', ')
          const classLine = validSeats.map(s => s.className || '').join(', ')
          cellContent = `<div style="text-align:center;line-height:1.4;">${rollLine}${classLine ? `<br/><span style="font-size:9px;color:#333;">${classLine}</span>` : ''}</div>`
        }
      }
      gridBodyHtml += `<td style="border:1.5px solid #000;padding:8px 4px;font-size:12px;min-height:48px;height:48px;vertical-align:middle;text-align:center;">${cellContent}</td>`
      if (gapAfter > 0 && ((c + 1) % gapAfter === 0) && c !== cols - 1) {
        gridBodyHtml += `<td style="border:1.5px solid #000;background:#eee;width:18px;"></td>`
      }
    }
    gridBodyHtml += '</tr>'
  }

  const dots = (n) => '.'.repeat(n)
  const line2Entry = date2 || subj2 || qp2
    ? `(2) तिथि ${date2 || dots(40)}${dots(Math.max(0, 40 - date2.length))} विषय ${subj2 || dots(35)}${dots(Math.max(0, 35 - subj2.length))} प्रश्न पत्र ${qp2 || dots(30)}${dots(Math.max(0, 30 - qp2.length))}`
    : `(2)${dots(130)}`

  const html = `
<div id="__pdf_root__" style="
  width:780px;
  min-height:1100px;
  padding:24px 30px 20px 30px;
  font-family:'Noto Sans Devanagari',sans-serif;
  background:#fff;
  color:#000;
  position:absolute;
  left:-9999px;
  top:0;
  box-sizing:border-box;
">
  <!-- Direction Compass -->
  <div style="position:absolute;right:20px;top:70px;width:155px;">
    <img src="${directionImg}" style="width:145px;height:auto;" />
  </div>

  <!-- Title -->
  <h2 style="text-align:center;font-size:26px;font-weight:bold;margin:0 0 14px 0;padding-right:100px;">परीक्षा कक्ष मानचित्र</h2>

  <!-- Header Lines -->
  <div style="font-size:13px;line-height:2.4;padding-right:110px;">
    <div>
      <b>कमरा नं0.</b>${roomVal || dots(60)}${roomVal ? dots(Math.max(0, 60 - roomVal.length)) : ''}
      &nbsp;&nbsp;&nbsp;&nbsp;
      <b>केन्द्र संख्या</b> ${centerVal || dots(40)}${centerVal ? dots(Math.max(0, 40 - centerVal.length)) : ''}
    </div>
    <div>
      परीक्षार्थियों के बैठने की दिशा व विद्यार्थियों का मुख ${dirVal || dots(60)}${dirVal ? dots(Math.max(0, 60 - dirVal.length)) : ''} की ओर
    </div>
    <div>जिन-जिन तिथियों में बैठने की व्यवस्था इस मानचित्र के अनुसार रही है।</div>
    <div>
      (1) तिथि ${date1 || dots(35)}${date1 ? dots(Math.max(0, 35 - date1.length)) : ''}
      विषय ${subj1 || dots(35)}${subj1 ? dots(Math.max(0, 35 - subj1.length)) : ''}
      प्रश्न पत्र ${qp1 || dots(30)}${qp1 ? dots(Math.max(0, 30 - qp1.length)) : ''}
    </div>
    <div>${line2Entry}</div>
  </div>

  <!-- Seating Grid -->
  <table style="border-collapse:collapse;width:100%;margin-top:14px;">
    <thead>${gridHeaderHtml}</thead>
    <tbody>${gridBodyHtml}</tbody>
  </table>

  <!-- Footer -->
  <div style="margin-top:18px;font-size:12px;">
    ${classSummaryHtml}
  </div>
  <div style="margin-top:12px;font-size:11px;">
    केन्द्र के मुहर तथा व्यवस्थापक के हस्ताक्षर${dots(50)}
  </div>
  ${schoolName ? `<div style="font-size:10px;margin-top:6px;">${schoolName}</div>` : ''}
</div>
`

  // Inject into DOM, capture with html2canvas, then remove
  const wrapper = document.createElement('div')
  wrapper.innerHTML = html
  document.body.appendChild(wrapper)
  const root = document.getElementById('__pdf_root__')

  try {
    const canvas = await html2canvas(root, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const imgW = canvas.width
    const imgH = canvas.height

    // A4 dimensions in mm
    const pdfW = 210
    const pdfH = 297
    const margin = 8
    const contentW = pdfW - margin * 2
    const contentH = (imgH / imgW) * contentW

    const doc = new jsPDF({
      orientation: contentH > pdfH - margin * 2 ? 'portrait' : 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    doc.addImage(imgData, 'PNG', margin, margin, contentW, contentH)

    const dateForFile = formatDateString(meta.examDate || '').replace(/-/g, '_')
    const parts = [meta.subject, meta.roomNumber, dateForFile].filter(Boolean)
    const baseName = parts.length ? parts.join('_') : 'seating'
    const filename = (baseName + '.pdf').replace(/\s+/g, '_')
    doc.save(filename)
  } finally {
    document.body.removeChild(wrapper)
  }
}

/**
 * Fills a value into a dotted line: "value" → "value............."
 * If value is empty, returns just dots.
 */
function fillDots(value, totalDots) {
  if (!value) return '.'.repeat(totalDots)
  const remaining = Math.max(0, totalDots - String(value).length)
  return String(value) + '.'.repeat(remaining)
}

function computeClassRangeFromMetaOrSeating(meta, seating) {
  const out = []
  if (meta && Array.isArray(meta.classes) && meta.classes.length) {
    for (const c of meta.classes) {
      const start = String(c.start || '').trim()
      let end = String(c.end || '').trim()
      const count = Number(c.count) || 0
      if (!end && start && count > 0) {
        const s = Number(start)
        if (!Number.isNaN(s)) end = String(s + count - 1)
      }
      out.push({ name: c.name || '', start: start || '', end: end || '' })
    }
  } else {
    // fallback: scan seating to build ranges by className
    const map = new Map()
    for (const bench of seating || []) {
      for (const seat of (bench.seats || [])) {
        if (seat && seat.className) {
          const cn = seat.className
          const r = Number(seat.roll)
          if (!map.has(cn)) map.set(cn, { min: Infinity, max: -Infinity })
          if (!Number.isNaN(r)) {
            const cur = map.get(cn)
            if (r < cur.min) cur.min = r
            if (r > cur.max) cur.max = r
          }
        }
      }
    }
    for (const [name, { min, max }] of map.entries()) {
      out.push({ name, start: isFinite(min) ? String(min) : '', end: isFinite(max) ? String(max) : '' })
    }
  }
  return out
}

function formatDateString(input) {
  if (!input) return ''
  try {
    // try to parse common formats (YYYY-MM-DD or ISO)
    const d = new Date(input)
    if (Number.isNaN(d.getTime())) return String(input)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = String(d.getFullYear())
    return `${dd}-${mm}-${yyyy}`
  } catch (e) {
    return String(input)
  }
}
