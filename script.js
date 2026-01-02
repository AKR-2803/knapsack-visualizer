let wt = [5,4,2,3];
let val = [10, 40, 30, 50];
let W = 5;
let N = wt.length;

// dp model
const dp = Array.from({ length: N + 1 }, () => new Array(W + 1).fill(null));
for (let i = 0; i <= N; i++) dp[i][0] = 0;
for (let j = 0; j <= W; j++) dp[0][j] = 0;

let curRow = 2;
let curCol = 2;

document.getElementById("wtArray").textContent = wt.toString();
document.getElementById("valArray").textContent = val.toString();
document.getElementById("capacity").textContent = W;

function renderTable() {
    const visualRows = N + 2;
    const visualCols = W + 2;
    const table = document.createElement("table");

    // header
    const row0 = document.createElement("tr");
    for (let j = 0; j < visualCols; j++) {
        const td = document.createElement("td");
        td.dataset.r = 0;
        td.dataset.c = j;
        if (j === 0) td.textContent = "N⬇️ W➡️";
        else td.innerHTML = `<strong>${j - 1}</strong>`;
        row0.appendChild(td);
    }
    table.appendChild(row0);

    // data rows (visual i = 1 .. visualRows-1)
    for (let i = 1; i < visualRows; i++) {
        const tr = document.createElement("tr");
        for (let j = 0; j < visualCols; j++) {
            const td = document.createElement("td");

            td.dataset.r = i;   // set data-r attribute as row index
            td.dataset.c = j;   // set data-c attribute as col index

            if (j === 0) {
                // left label column: show sequence of weights up to current item,
                // and bold the current (last) weight. For i===1 (dp row 0) keep blank.
                if (i === 1) td.innerHTML = `[ ]`;
                else {
                    const arr = wt.slice(0, i - 1);
                    if (arr.length === 1) td.innerHTML = `[ <strong>${arr[0]}</strong> ]`;
                    else {
                        const prefix = arr.slice(0, -1).join(" ");
                        const last = arr[arr.length - 1];
                        td.innerHTML = `[ ${prefix} <strong>${last}</strong> ]`;
                    }
                }
            } else {
                const dpI = i - 1, dpJ = j - 1;
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

document.getElementById("generateTable").addEventListener('click', () => {
    renderTable();
    const allControls = document.getElementById("controlsHolder");
    console.dir(allControls);
    if(allControls){
        allControls.classList.remove("hidden");
    }
});

// renderTable();

// helpers
function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }
function clearHighlights() {
    document.querySelectorAll("td.current, td.exclude, td.include")
        .forEach(td => td.classList.remove("current", "exclude", "include"));
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

// runtime control flags
let stepDelay = 200;
let isClear = true;

// loop control:
// loopActive: true while runContinuously() is running (owns the loop).
// shouldPause: set to true to request the loop to stop after current step.
let loopActive = false;
let shouldPause = false;
let runVersion = 0;

// single step fill cell
async function runOneStep() {
    if (isClear) isClear = false;

    const myVersion = runVersion;

    const vi = curRow, vj = curCol;
    const dpI = vi - 1, dpJ = vj - 1;

    const takeDesc = document.getElementById("take");
    const dontTakeDesc = document.getElementById("donttake");

    // finished
    if (dpI > N) return;

    clearHighlights();

    // mark current cell
    markCurrentCell(vi, vj);

    // dependenyc cells are dp[dpI-1][dpJ] and optionally dp[dpI-1][dpJ - wt[dpI-1]]
    const depsVisual = [];
    if (dpI - 1 >= 0) {
        depsVisual.push({ r: vi - 1, c: vj });
    }
    if (dpI - 1 >= 0 && dpJ >= wt[dpI - 1]) {
        depsVisual.push({ r: vi - 1, c: vj - wt[dpI - 1] });
    }
    
    let exIdx = -1, canTake = false;
    
    // compute best using `dp` indices
    let best = dp[dpI][dpJ];
    if (dpI === 0) best = 0;
    else {
        best = dp[dpI - 1][dpJ];
        dontTakeDesc.textContent = `Dont take: dp[${dpI - 1}][${dpJ}] = ${dp[dpI - 1][dpJ]}`;

        // take item if you have capacity left
        if (dpJ >= wt[dpI - 1]) {
            canTake = true;
            const take = dp[dpI - 1][dpJ - wt[dpI - 1]] + val[dpI - 1];
            if (best < take) { 
                exIdx = 0; 
                best = take; 
            }
            takeDesc.textContent = `Take: dp[${dpI-1}][${dpJ- wt[dpI-1]}] + val[${dpI-1}] = ${take}`
        } else{
            takeDesc.textContent = `Take: Not Possible (j:${dpJ} < wt[i-1]:${wt[dpI-1]})`
        }
    }


    // include: green | exclude: red
    // if "take" is the best option
    if (exIdx === 0 && depsVisual[1]) {
        markIncludeCell(depsVisual[1].r, depsVisual[1].c);
        markExcludeCell(depsVisual[0].r, depsVisual[0].c);
    }

    // if "donttake" is best option and take is available
    else if (canTake && depsVisual[1]) {
        markIncludeCell(depsVisual[0].r, depsVisual[0].c);
        markExcludeCell(depsVisual[1].r, depsVisual[1].c);
    }

    // only "donttake" is the option
    else if (depsVisual[0]) {
        markIncludeCell(depsVisual[0].r, depsVisual[0].c);
    }

    // animation sleep
    await sleep(stepDelay);

    // preventing cell to populate when paused after play and using fill next cell
    if (myVersion != runVersion) return;

    // commit and render
    dp[dpI][dpJ] = best;

    // update visual table cell data
    const td = document.querySelector(`td[data-r="${vi}"][data-c="${vj}"]`);
    if (td) td.innerHTML = (dpI === N && dpJ === W) ? `<strong>${best}</strong>` : `${best}`;

    // advance pointers
    curCol++;
    if (curCol > W + 1) { curCol = 2; curRow++; }

    // status update
    document.getElementById("status").textContent =
        (curRow - 1) <= N ? `Next Cell: (${curRow - 1}, ${curCol - 1})` : `All cells filled`;
}

// continuous runner: checks `shouldPause` between steps
async function runContinuously() {
    if (loopActive) return; // already running

    loopActive = true;
    shouldPause = false;
    document.getElementById("pauseBtn").textContent = "Pause";

    // keep filling table row-wise till the end
    while ((curRow - 1) <= N && !shouldPause) {
        await runOneStep();
    }

    loopActive = false;
    shouldPause = false;
    document.getElementById("pauseBtn").textContent = "Play";
}

// controls 
document.getElementById("fillCurrent").addEventListener("click", async () => {
    if (loopActive) return; // do not step while continuous loop owns execution
    await runOneStep();
});

// play/pause toggle: start loop if not running; otherwise request pause
const btn = document.getElementById("pauseBtn");
btn.addEventListener("click", () => {
    // start continuous run
    if (!loopActive) {
        shouldPause = false;
        runContinuously();
        return;
    }

    // if loop is running -> request pause (stop after current step)
    if (loopActive && !shouldPause) {
        shouldPause = true;
        // button shows Play while loop winds down
        btn.textContent = "Play";
        return;
    }

    // if for some reason shouldPause was true but loopActive false, start again
    if (!loopActive) {
        shouldPause = false;
        runContinuously();
    }
});

// cancel loop, reset dp & UI
document.getElementById("clearTable").addEventListener("click", () => {
    if (isClear) return;

    runVersion++;   // track run version

    // request loop stop
    shouldPause = true;
    loopActive = false; // in case loop has nott stopped yet

    clearHighlights();

    const table = document.querySelector("#tableHolder table");
    if (table) {
        for (let r = 2; r < N + 2; r++) {
            for (let c = 2; c < W + 2; c++) {
                if (table.rows[r] && table.rows[r].cells[c]) table.rows[r].cells[c].textContent = "";
                dp[r - 1][c - 1] = null;
            }
        }
    }

    curRow = 2;
    curCol = 2;
    document.getElementById("status").textContent = "Next Cell: (1, 1)";
    document.getElementById("pauseBtn").textContent = "Play";
    isClear = true;
});

// speed slider
const slider = document.getElementById("speedSlider");
const speedValue = document.getElementById("speedValue");
slider.addEventListener('input', () => {
    stepDelay = Number(slider.value);
    speedValue.textContent = `${stepDelay} ms`;
});