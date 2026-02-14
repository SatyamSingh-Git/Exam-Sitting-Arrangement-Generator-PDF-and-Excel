import React, { useState } from 'react'
import PreviewGrid from './PreviewGrid'
import { generateSeating } from '../utils/patterns'
import { saveAsExcel, saveAsPdf } from '../utils/exports'
import PatternThumb from './PatternThumb'
import FullscreenPreview from './FullscreenPreview'

function ClassRow({ idx, cls, onChange, onRemove }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
      <input placeholder="Class name" value={cls.name} onChange={e => onChange(idx, 'name', e.target.value)} className="border p-1 flex-1 w-full sm:w-auto" />
      <input placeholder="Start Roll" value={cls.start} onChange={e => onChange(idx, 'start', e.target.value)} className="border p-1 w-full sm:w-24" />
      <input placeholder="End Roll (or leave blank)" value={cls.end || ''} onChange={e => onChange(idx, 'end', e.target.value)} className="border p-1 w-full sm:w-28" />
      <input placeholder="Count (optional)" value={cls.count} onChange={e => onChange(idx, 'count', e.target.value)} className="border p-1 w-full sm:w-20" />
      <input type="color" value={cls.color} onChange={e => onChange(idx, 'color', e.target.value)} className="w-12 h-8 p-0" />
      <button onClick={() => onRemove(idx)} className="text-sm text-red-600 mt-2 sm:mt-0">Remove</button>
    </div>
  )
}

export default function Wizard() {
  const [step, setStep] = useState(1)
  const [classes, setClasses] = useState([
    { name: 'Class A', start: '', end: '', count: '', color: '#ef4444' },
    { name: 'Class B', start: '', end: '', count: '', color: '#3b82f6' }
  ])
  const [rows, setRows] = useState(12)
  const [cols, setCols] = useState(3)
  const [perBench, setPerBench] = useState(2)
  const [gapAfter, setGapAfter] = useState(0)
  const [pattern, setPattern] = useState('pattern1')
  const [leaveFirstSeatEmpty, setLeaveFirstSeatEmpty] = useState(false)
  const [roomNumber, setRoomNumber] = useState('')
  const [examClass, setExamClass] = useState('')
  const [direction, setDirection] = useState('')
  const [subject, setSubject] = useState('')
  const [examDate, setExamDate] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [centerNumber, setCenterNumber] = useState('')
  const [questionPaper, setQuestionPaper] = useState('')
  const [examDate2, setExamDate2] = useState('')
  const [subject2, setSubject2] = useState('')
  const [questionPaper2, setQuestionPaper2] = useState('')

  function updateClass(i, key, value) {
    const copy = [...classes]
    copy[i][key] = value
    setClasses(copy)
  }
  function addClass() { setClasses([...classes, { name: '', start: '', count: '0', color: '#cccccc' }]) }
  function removeClass(i) { setClasses(classes.filter((_, j) => j !== i)) }

  const seating = generateSeating({ classes, rows, cols, perBench, pattern, gapAfter, leaveFirstSeatEmpty })
  const [previewZoom, setPreviewZoom] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div>
      {step === 1 && (
        <div>
          <h2 className="font-semibold mb-2">Step 1: Students & Exam Details</h2>
          <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input placeholder="विद्यालय / संस्था का नाम (School Name)" value={schoolName} onChange={e => setSchoolName(e.target.value)} className="border p-1 w-full col-span-1 sm:col-span-2" />
          </div>
          <input placeholder="Class (e.g. 10A)" value={examClass} onChange={e => setExamClass(e.target.value)} className="border p-1 w-full mb-3" />
          <div className="mb-3 flex items-center gap-2">
            <input id="leaveFirst" type="checkbox" checked={leaveFirstSeatEmpty} onChange={e => setLeaveFirstSeatEmpty(e.target.checked)} className="w-4 h-4" />
            <label htmlFor="leaveFirst" className="text-sm">Leave First Seat Empty</label>
          </div>
          {classes.map((c, i) => <ClassRow key={i} idx={i} cls={c} onChange={updateClass} onRemove={removeClass} />)}
          <div className="flex gap-2 mt-2">
            <button onClick={addClass} className="px-3 py-1 bg-green-500 text-white rounded">+ Add Class</button>
            <button onClick={() => setStep(2)} className="px-3 py-1 bg-blue-600 text-white rounded">Next</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="font-semibold mb-2">Step 2: Room</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label>Rows:</label>
              <input type="number" value={rows} onChange={e => setRows(Math.max(1, Number(e.target.value)))} className="border p-1 w-full sm:w-20" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label>Columns:</label>
              <input type="number" value={cols} onChange={e => setCols(Math.max(1, Number(e.target.value)))} className="border p-1 w-full sm:w-20" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label>Per Bench:</label>
              <select value={perBench} onChange={e => setPerBench(Number(e.target.value))} className="border p-1 w-full sm:w-auto">
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label>Gap After Cols:</label>
              <input type="number" value={gapAfter} onChange={e => setGapAfter(Math.max(0, Number(e.target.value)))} className="border p-1 w-full sm:w-20" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="px-3 py-1 border rounded">Back</button>
            <button onClick={() => setStep(3)} className="px-3 py-1 bg-blue-600 text-white rounded">Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="font-semibold mb-2">Step 3: Choose Pattern</h2>
          <div className="mb-3 flex items-center gap-4">
            {/* Legend showing class colors */}
            <div className="flex items-center gap-3">
              {(classes || []).slice(0, 3).map((c, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div style={{ width: 16, height: 16, background: c.color || '#ccc', borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} />
                  <div className="text-sm">{c.name || `Class ${idx + 1}`}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mb-4">
            <div onClick={() => setPattern('pattern1')} className={`cursor-pointer p-3 rounded border bg-white w-full max-w-xs sm:max-w-sm h-36 flex flex-col items-center justify-center ${pattern === 'pattern1' ? 'ring-2 ring-blue-400' : ''}`}>
              <div className="w-full h-24"><PatternThumb pattern={'pattern1'} classes={classes} benchW={64} benchH={36} seatGap={10} perBench={perBench} /></div>
              <div className="text-center text-sm mt-1">Pattern 1 (Exam Partner)</div>
            </div>
            <div onClick={() => setPattern('pattern2')} className={`cursor-pointer p-3 rounded border bg-white w-full max-w-xs sm:max-w-sm h-36 flex flex-col items-center justify-center ${pattern === 'pattern2' ? 'ring-2 ring-blue-400' : ''}`}>
              <div className="w-full h-24"><PatternThumb pattern={'pattern2'} classes={classes} benchW={64} benchH={36} seatGap={10} perBench={perBench} /></div>
              <div className="text-center text-sm mt-1">Pattern 2 (Checkered)</div>
            </div>
            <div onClick={() => setPattern('pattern3')} className={`cursor-pointer p-3 rounded border bg-white w-full max-w-xs sm:max-w-sm h-36 flex flex-col items-center justify-center ${pattern === 'pattern3' ? 'ring-2 ring-blue-400' : ''}`}>
              <div className="w-full h-24"><PatternThumb pattern={'pattern3'} classes={classes} benchW={64} benchH={36} seatGap={10} perBench={perBench} /></div>
              <div className="text-center text-sm mt-1">Pattern 3 (Gap)</div>
            </div>
            <div onClick={() => setPattern('pattern4')} className={`cursor-pointer p-3 rounded border bg-white w-full max-w-xs sm:max-w-sm h-36 flex flex-col items-center justify-center ${pattern === 'pattern4' ? 'ring-2 ring-blue-400' : ''}`}>
              <div className="w-full h-24"><PatternThumb pattern={'pattern4'} classes={classes} benchW={64} benchH={36} seatGap={10} perBench={perBench} /></div>
              <div className="text-center text-sm mt-1">Pattern 4 (Single-side)</div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={() => setStep(2)} className="px-3 py-1 border rounded w-full sm:w-auto">Back</button>
            <button onClick={() => setStep(4)} className="px-3 py-1 bg-blue-600 text-white rounded w-full sm:w-auto">Generate Preview</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 className="font-semibold mb-2">Preview</h2>
          <PreviewGrid seating={seating} rows={rows} cols={cols} perBench={perBench} gapAfter={gapAfter} />
          <div className="mt-4 flex flex-col sm:flex-row gap-2 items-center">
            <button onClick={() => setStep(3)} className="px-3 py-1 border rounded w-full sm:w-auto">Back</button>
            <button onClick={() => saveAsPdf(seating, rows, cols, perBench, gapAfter, { schoolName, roomNumber, centerNumber, examClass, direction, subject, examDate, questionPaper, examDate2, subject2, questionPaper2, classes })} className="px-3 py-1 bg-indigo-600 text-white rounded w-full sm:w-auto">Download PDF</button>
            <button onClick={() => saveAsExcel(seating, rows, cols, perBench, gapAfter)} className="px-3 py-1 bg-green-600 text-white rounded w-full sm:w-auto">Download Excel</button>
            <button onClick={() => { navigator.clipboard?.writeText(JSON.stringify(seating)); alert('Seating copied to clipboard') }} className="px-3 py-1 border rounded w-full sm:w-auto">Copy JSON</button>
            <button onClick={() => setModalOpen(true)} className="px-3 py-1 bg-blue-600 text-white rounded w-full sm:w-auto">Full Screen</button>
            <div className="ml-0 sm:ml-auto hidden sm:flex items-center gap-2">
              <label className="text-sm">Zoom</label>
              <input type="range" min="0.6" max="1.6" step="0.1" value={previewZoom} onChange={e => setPreviewZoom(Number(e.target.value))} />
            </div>
          </div>

          {modalOpen && (
            <FullscreenPreview seating={seating} rows={rows} cols={cols} perBench={perBench} gapAfter={gapAfter} onClose={() => setModalOpen(false)} />
          )}
        </div>
      )}
    </div>
  )
}
