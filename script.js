let wt = [1, 3, 4];
let val = [15, 20, 30];
let W = 4;
let N = wt.length;

// const wt = [
//     2, 3, 4, 5, 9
// ];

// const val = [
//     3, 4, 8, 8, 10
// ];

// // Example capacity
// const W = 10;

const dp = Array.from({ length: N + 1 }, () => new Array(W + 1).fill(null));

for (let i = 0; i <= N; i++) dp[i][0] = 0;
for (let j = 0; j <= W; j++) dp[0][j] = 0;

let curRow = 2;
let curCol = 2;

let wtStr = "";

for (let i = 0; i < wt.length; i++) {
    wtStr += " " + wt[i];
}

document.getElementById("wt-array").textContent = wt.toString();
document.getElementById("val-array").textContent = val.toString();
document.getElementById("capacity").textContent = W;

//  Visual coordinates:
//   visual row i = 0 is header, i>=1 corresponds to dp row (i-1) (0..N)
//   visual col j = 0 is left label column, j>=1 corresponds to dp col (j-1) (0..W)
function renderTable() {
    const visualRows = N + 2; // header row + dp rows (0..N)
    const visualCols = W + 2; // left label col + dp cols (0..W)

    const table = document.createElement("table");

    // header row0
    const row0 = document.createElement("tr");
    for (let j = 0; j < visualCols; j++) {
        const td = document.createElement("td");
        td.dataset.r = 0;
        td.dataset.c = j;
        if (j === 0) {
            td.textContent = "N⬇️ W➡️";
        } else {
            // visual col j corresponds to capacity (j-1)
            td.innerHTML = `<strong>${j - 1}</strong>`;
        }
        row0.appendChild(td);
    }
    table.appendChild(row0);

    // data rows (visual i = 1 .. visualRows-1)
    for (let i = 1; i < visualRows; i++) {
        const tr = document.createElement("tr");
        for (let j = 0; j < visualCols; j++) {
            const td = document.createElement("td");
            td.dataset.r = i;
            td.dataset.c = j;

            if (j === 0) {
                // left label column: show sequence of weights up to current item,
                // and bold the current (last) weight. For i===1 (dp row 0) keep blank.

                if(i === 1){
                    td.innerHTML = `[ ]`;
                }
                
                // i > 1
                else {
                    // visual i corresponds to dp row [i-1] which considers items 1..[i-1]
                    const arr = wt.slice(0, i - 1); // weights for items 1..[i-1]
                    if (arr.length === 1) {
                        td.innerHTML = `[ <strong>${arr[0]}</strong> ]`;
                    } else {
                        const prefix = arr.slice(0, -1).join(" ");
                        const last = arr[arr.length-1];
                        td.innerHTML = `[ ${prefix} <strong>${last}</strong> ]`;
                    }
                }
            } else {
                // for visual (i,j) -> dp[i-1][j-1]
                const dpI = i - 1;
                const dpJ = j - 1;
                const v = dp[dpI][dpJ];
                td.textContent = v === null ? "" : v;
            }

            tr.appendChild(td);
        }
        table.appendChild(tr);
    }

    const holder = document.getElementById("tableHolder");
    holder.innerHTML = "";
    holder.appendChild(table);
}

renderTable();

let stepDelay = 200;
let isClear = true;
let isRunning = false;

async function runOneStep(){
    if(isClear) isClear = false;

    // visual coordinates
    const vi = curRow;
    const vj = curCol;

    const dpI = vi - 1;  // dp row index
    const dpJ = vj - 1;  // dp col index

    // if dpI is out of range,stop
    if (dpI > N) {
        return;
    }

    clearHighlights();

    // highlight current visual cell
    markCurrentCell(vi, vj);

    // dependenyc cells are dp[dpI-1][dpJ] and optionally dp[dpI-1][dpJ - wt[dpI-1]]
    const depsVisual = [];
    if (dpI - 1 >= 0) {
        // visual coords for dp[dpI-1][dpJ] => ( (dpI-1)+1 , dpJ+1 ) = (vi-1, vj)
        depsVisual.push({ r: vi - 1, c: vj });
    }
    if (dpI - 1 >= 0 && dpJ >= wt[dpI - 1]) {
        // visual col = (dpJ - wt[dpI-1]) + 1 = vj - wt[dpI-1]
        depsVisual.push({ r: vi - 1, c: vj - wt[dpI - 1] });
    }
    
    let exIdx = -1;
    let canTake = false;

    // compute best using `dp` indices
    let best = dp[dpI][dpJ];
    if (dpI === 0) {
        best = 0;
    } else {
        // dont take item -> dp[dpI-1][dpJ]
        best = dp[dpI - 1][dpJ];
        
        // take item if you have capacity left
        if (dpJ >= wt[dpI - 1]) {
            canTake = true;
            const take = dp[dpI - 1][dpJ - wt[dpI - 1]] + val[dpI - 1];
            if(best < take){
                exIdx = 0;
                best = take;
            }
        }
    }
    
    // include: green | exclude: red
    // if "take" is the best option
    // depsVis[0] = donttake, depsVis[1]: take 
    if(exIdx === 0){
        markIncludeCell(depsVisual[1].r, depsVisual[1].c);  // take include
        markExcludeCell(depsVisual[0].r, depsVisual[0].c);  // donttake exclude
    } 
    
    // if "take" exists, but donttake is best option
    // take: red, donttake: green
    else if(canTake){
        markIncludeCell(depsVisual[0].r, depsVisual[0].c);  // donttake include
        markExcludeCell(depsVisual[1].r, depsVisual[1].c);  // take exclude
    }

    // if no option to "take", only "donttake"
    else{
        markIncludeCell(depsVisual[0].r, depsVisual[0].c);  // donttake include
    }
    
    await sleep(stepDelay);

    // stop running if stopping is triggered
    if(!isRunning) return;

    // update `dp` array
    dp[dpI][dpJ] = best;

    // update displayed cell (visual coords)
    const td = document.querySelector(`td[data-r="${vi}"][data-c="${vj}"]`);
    if (td) {
        // highlight answer = dp[N][W]
        td.innerHTML = (dpI === N && dpJ === W) ? `<strong>${best}</strong>` : `${best}`;
    }

    // goto next visual cell
    curCol++;

    // visual columns that correspond to `dp` columns are 1..[W+1]
    if (curCol > W + 1) {
        curCol = 2;   // start at visual col 2 in next row
        curRow++;
    }

    // update status
    document.getElementById("status").textContent =
        (curRow - 1) <= N ?
            `Next Cell: (${curRow - 1}, ${curCol - 1})`
            : `All cells filled`;
}

// fill current cell
document.getElementById("fillCurrent").addEventListener("click", async () => {
    if(isRunning) return;

    // start
    isRunning = true;
    
    // fill current cell
    await runOneStep();

    // stop
    isRunning = false;
});

// fill current cell
document.getElementById("fillAll").addEventListener("click", async () => {
    if(isRunning) return;

    // start
    isRunning = true;
    
    // fill current cell
    while(curRow - 1 <= N && isRunning){
        await runOneStep();
    }

    // stop
    isRunning = false;
});

document.getElementById("clearTable").addEventListener('click', () => {
    if(isClear) return;
    
    isRunning = false;

    clearHighlights();

    let table = document.querySelector("#tableHolder table");

    // clear the table
    for(let r = 2; r < N + 2; r++){
        for(let c = 2; c < W + 2; c++){
            table.rows[r].cells[c].textContent = "";
        }
    }

    curRow = 2;
    curCol = 2;

    isClear = true;
});



function clearHighlights() {
    document.querySelectorAll("td.current, td.dependency, td.exclude, td.include")
        .forEach(td => td.classList.remove("current", "dependency", "exclude", "include"));
}

function markCurrentCell(i, j) {
    const td = document.querySelector(`td[data-r="${i}"][data-c="${j}"]`);
    if (td) td.classList.add("current");
}

function markExcludeCell(i, j) {
    const td = document.querySelector(`td[data-r="${i}"][data-c="${j}"]`);
    if (td) td.classList.add("exclude");
}

function markIncludeCell(i, j) {
    const td = document.querySelector(`td[data-r="${i}"][data-c="${j}"]`);
    if (td) td.classList.add("include");
}

function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

const slider = document.getElementById("speedSlider");
const speedValue = document.getElementById("speedValue");

slider.addEventListener('input', () => {
    stepDelay = Number(slider.value);
    speedValue.textContent = `${stepDelay} ms`;
});