function expandClasses(classes){
  const lists = classes.map(c=>{
    const start = Number(c.start)||1
    let count = 0
    // if end roll provided and valid, compute count from it; otherwise use count if given
    if(c.end !== undefined && String(c.end).trim() !== ''){
      const end = Number(c.end)
      if(!Number.isNaN(end) && end >= start) count = end - start + 1
    }
    if(count === 0) count = Number(c.count) || 0
    const arr = []
    for(let i=0;i<count;i++) arr.push({className:c.name||'Class', roll: String(start + i), color:c.color||'#ccc'})
    return arr
  })
  return lists
}

export function generateSeating({classes,rows,cols,perBench,pattern,gapAfter,leaveFirstSeatEmpty=false}){
  // build benches array; insert gap entries when needed
  const benches = []
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      benches.push({row:r,col:c,seats: new Array(perBench).fill(null)})
    }
    if(gapAfter>0 && ((r+1) % gapAfter) === 0){
      // optional: a full-row gap (not typical), skip for simplicity
    }
  }

  const classLists = expandClasses(classes)

  // create fill order: for each column, fill seat positions top->down per seat index
  // This makes numbers go down the first column left seat, then down the first column right seat, then move to next column.
  const fillOrder = []
  for(let c=0;c<cols;c++){
    for(let s=0;s<perBench;s++){
      for(let r=0;r<rows;r++){
        fillOrder.push({ benchIndex: r*cols + c, seatIndex: s })
      }
    }
  }

  if(pattern==='pattern1'){
    // exam partner: build a single interleaved student list so multiple classes
    // finish simultaneously. Interleaved order: class0[0],class1[0],class2[0],class0[1],...
    const interleaved = []
    if(classLists && classLists.length){
      const maxLen = Math.max(...classLists.map(l=>l.length))
      for(let idx=0; idx<maxLen; idx++){
        for(let j=0;j<classLists.length;j++){
          const it = classLists[j][idx]
          if(it) interleaved.push(it)
        }
      }
    }

    // Assign interleaved list sequentially into bench seats using
    // row-major order (rows -> cols -> seat index) so visual layout
    // fills left-to-right, top-to-bottom.
    const assignOrder = []
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        for(let s=0;s<perBench;s++){
          assignOrder.push({ benchIndex: r*cols + c, seatIndex: s })
        }
      }
    }
    let ai = 0
    for(let k=0;k<assignOrder.length;k++){
      const { benchIndex: i, seatIndex: s } = assignOrder[k]
      const bench = benches[i]
      // Optionally leave the entire first bench (benchIndex 0) empty
      if(leaveFirstSeatEmpty && i === 0){
        bench.seats[s] = null
        continue
      }
      bench.seats[s] = ai < interleaved.length ? interleaved[ai++] : null
    }
  } else if(pattern==='pattern2'){
    // checkered: determine desired class index per seat using seat-level parity
    // but assign each class's students to its seats in column-major order
    const totalLists = classLists
    const nClasses = totalLists.length

    // helper to compute desired class index for a bench seat
    function desiredClassIndexFor(bench, s){
      const seatCol = bench.col * perBench + s
      // distribute seats across all classes by mapping (row + seatCol) mod nClasses
      // this ensures for n>2 each class gets its own repeating positions.
      return (bench.row + seatCol) % nClasses
    }

    // build positions per class in the requested order: columns -> seats -> rows
    const positionsPerClass = Array.from({length:nClasses}, ()=>[])
    for(let c=0;c<cols;c++){
      for(let s=0;s<perBench;s++){
        for(let r=0;r<rows;r++){
          const benchIdx = r*cols + c
          const bench = benches[benchIdx]
          const cls = desiredClassIndexFor(bench, s)
          positionsPerClass[cls].push({benchIndex: benchIdx, seatIndex: s})
        }
      }
    }

    // assign students from each class to its positions in order
    const pointers = classLists.map(()=>0)
    for(let j=0;j<nClasses;j++){
      const list = totalLists[j] || []
      const posList = positionsPerClass[j]
      for(let p=0;p<posList.length;p++){
        const {benchIndex: bi, seatIndex: si} = posList[p]
        const bench = benches[bi]
        // skip entire first bench if option enabled
        if(leaveFirstSeatEmpty && bi === 0){
          bench.seats[si] = null
          continue
        }
        if(pointers[j] < list.length){
          bench.seats[si] = list[pointers[j]++]
        } else {
          bench.seats[si] = bench.seats[si] || null
        }
      }
    }

    // fallback: if any students remain unassigned (unequal distributions), fill remaining empty seats
    const remaining = []
    for(let j=0;j<nClasses;j++){
      const list = totalLists[j] || []
      while(pointers[j] < list.length) remaining.push(list[pointers[j]++])
    }
    if(remaining.length){
      // fill empty seats in row-major order
      for(const {benchIndex: i, seatIndex: s} of fillOrder){
        const bench = benches[i]
        if(leaveFirstSeatEmpty && i === 0) continue
        if(!bench.seats[s] && remaining.length){
          bench.seats[s] = remaining.shift()
        }
      }
    }
  } else if(pattern==='pattern3'){
    // gap strategy: place one student and leave alternate seat empty
    const flat = classLists.flat()
    let p=0
    for(let k=0;k<fillOrder.length;k++){
      const { benchIndex: i, seatIndex: s } = fillOrder[k]
      const bench = benches[i]
      const seatParity = (bench.row + (bench.col * perBench + s)) % 2
      if(seatParity === 0){
        if(leaveFirstSeatEmpty && i === 0){
          bench.seats[s] = null
        } else {
          bench.seats[s] = p < flat.length ? flat[p++]: null
        }
      } else bench.seats[s] = null
    }
  } else if(pattern==='pattern4'){
    // single-side seating: only left seat filled on each bench
    const flat = classLists.flat()
    let p=0
    for(let k=0;k<fillOrder.length;k++){
      const { benchIndex: i, seatIndex: s } = fillOrder[k]
      const bench = benches[i]
      if(s === 0){
        // fill only left seat positions (seatIndex 0); right seats remain null
        if(leaveFirstSeatEmpty && i === 0){
          bench.seats[0] = null
        } else {
          bench.seats[0] = p < flat.length ? flat[p++] : null
        }
        if(bench.seats.length > 1) bench.seats[1] = (leaveFirstSeatEmpty && i === 0) ? null : (bench.seats[1] || null)
      }
    }
  }

  // flatten with optional visual gap columns (simple implementation: no visual gap objects)
  return benches
}
