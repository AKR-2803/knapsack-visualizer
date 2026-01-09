// let wt = [5, 4, 2, 3];
// let val = [10, 40, 30, 50];
// let W = 5;
// let N = wt.length;

// let curRow = 2;
// let curCol = 2;

const state = {
  wt: [],
  val: [],
  W: 0,
  N: 0,
  dp: [],
  curRow: 2,
  curCol: 2,
};

function parseInputs() {
    const wtStr = document.getElementById("wtInput").value;
    const valStr = document.getElementById("valInput").value;
    const WStr = document.getElementById("capacityInput").value;

    const wt = wtStr.split(",").map(s => Number(s.trim()));
    const val = valStr.split(",").map(s => Number(s.trim()));
    const W = Number(WStr);

    return { wt, val, W };
}

function validateInputs(wt, val, W) {
    if (wt.length === 0 || val.length === 0) {
        return "wt[ ] and val[ ] cannot be empty";
    }

    if (wt.length !== val.length) {
        return "wt[ ] and val[ ] must have same length";
    }

    if (!Number.isInteger(W) || W < 0) {
        return "Capacity W must be a non-negative integer";
    }

    if(val.length > 10){
        return "Maximum 10 elements allowed in the array"
    }

    if(W > 25){
        return "Maximum capacity(W) is 30"
    }

    for (let i = 0; i < wt.length; i++) {
        if (!Number.isInteger(wt[i]) || wt[i] <= 0) {
            return `Invalid value at wt[${i}]`;
        }
        if (!Number.isInteger(val[i]) || val[i] <= 0) {
            return `Invalid value at val[${i}]`;
        }
    }

    return null;
}

function initModel(wt, val, W) {
    state.wt = wt;
    state.val = val;
    state.W = W;
    state.N = wt.length;

    state.dp = Array.from(
        { length: state.N + 1 },
        () => new Array(W + 1).fill(null)
    );

    for (let i = 0; i <= state.N; i++) state.dp[i][0] = 0;
    for (let j = 0; j <= W; j++) state.dp[0][j] = 0;

    state.curRow = 2;
    state.curCol = 2;

    document.getElementById("wtInput").textContent = state.wt.toString();
    document.getElementById("valInput").textContent = state.val.toString();
    document.getElementById("capacityInput").textContent = state.W;
}

function renderTable() {
    const visualRows = state.N + 2;
    const visualCols = state.W + 2;
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

            td.dataset.r = i;
            td.dataset.c = j;

            if (j === 0) {
                if (i === 1) td.innerHTML = `[ ]`;
                else {
                    const arr = state.wt.slice(0, i - 1);
                    if (arr.length === 1) td.innerHTML = `[ <strong>${arr[0]}</strong> ]`;
                    else {
                        const prefix = arr.slice(0, -1).join(" ");
                        const last = arr[arr.length - 1];
                        td.innerHTML = `[ ${prefix} <strong>${last}</strong> ]`;
                    }
                }
            } else {
                const dpI = i - 1, dpJ = j - 1;
                const v = state.dp[dpI][dpJ];
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

document.getElementById("generateTable").addEventListener("click", () => {
    const errorBox = document.getElementById("inputError");
    errorBox.textContent = "";

    const { wt: newWt, val: newVal, W: newW } = parseInputs();
    const error = validateInputs(newWt, newVal, newW);

    if (error) {
        errorBox.textContent = error;
        return;
    }

    initModel(newWt, newVal, newW);
    renderTable();
    clearStatus();

    const allControls = document.getElementById("controlsHolder");
    if (allControls) {
        allControls.classList.remove("hidden");
    }
});

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

// loop control
let loopActive = false;
let shouldPause = false;
let runVersion = 0;

// single step fill cell
async function runOneStep({ animated }) {
    if (isClear) isClear = false;

    const myVersion = runVersion;

    const vi = state.curRow, vj = state.curCol;
    const dpI = vi - 1, dpJ = vj - 1;

    const takeDesc = document.getElementById("take");
    const dontTakeDesc = document.getElementById("donttake");

    if (dpI > state.N) return;

    clearHighlights();
    markCurrentCell(vi, vj);

    const depsVisual = [];
    if (dpI - 1 >= 0) depsVisual.push({ r: vi - 1, c: vj });
    if (dpI - 1 >= 0 && dpJ >= state.wt[dpI - 1])
        depsVisual.push({ r: vi - 1, c: vj - state.wt[dpI - 1] });

    let exIdx = -1, canTake = false;

    let best = state.dp[dpI][dpJ];
    if (dpI === 0) best = 0;
    else {
        best = state.dp[dpI - 1][dpJ];
        dontTakeDesc.textContent = `Dont take: dp[${dpI - 1}][${dpJ}] = ${state.dp[dpI - 1][dpJ]}`;

        if (dpJ >= state.wt[dpI - 1]) {
            canTake = true;
            const take =
                state.dp[dpI - 1][dpJ - state.wt[dpI - 1]] +
                state.val[dpI - 1];

            if (best < take) {
                exIdx = 0;
                best = take;
            }

            takeDesc.textContent =
                `Take: dp[${dpI - 1}][${dpJ - state.wt[dpI - 1]}] + val[${dpI - 1}] = ${take}`;
        } else {
            takeDesc.textContent =
                `Take: Not Possible (j:${dpJ} < wt[i-1]:${state.wt[dpI - 1]})`;
        }
    }

    if (exIdx === 0 && depsVisual[1]) {
        markIncludeCell(depsVisual[1].r, depsVisual[1].c);
        markExcludeCell(depsVisual[0].r, depsVisual[0].c);
    } else if (canTake && depsVisual[1]) {
        markIncludeCell(depsVisual[0].r, depsVisual[0].c);
        markExcludeCell(depsVisual[1].r, depsVisual[1].c);
    } else if (depsVisual[0]) {
        markIncludeCell(depsVisual[0].r, depsVisual[0].c);
    }

    if(animated){
        await sleep(stepDelay);
    }

    if (myVersion !== runVersion) return;

    state.dp[dpI][dpJ] = best;

    const td = document.querySelector(`td[data-r="${vi}"][data-c="${vj}"]`);
    if (td)
        td.innerHTML =
            (dpI === state.N && dpJ === state.W)
                ? `<strong>${best}</strong>`
                : `${best}`;

    state.curCol++;
    if (state.curCol > state.W + 1) {
        state.curCol = 2;
        state.curRow++;
    }

    document.getElementById("status").textContent =
        (state.curRow - 1) <= state.N
            ? `Next Cell: (${state.curRow - 1}, ${state.curCol - 1})`
            : `All cells filled`;
}

const generateBtn = document.getElementById("generateTable");

async function runContinuously() {
    if (loopActive) return;

    loopActive = true;
    shouldPause = false;

    generateBtn.disabled = true;
    document.getElementById("pauseBtn").textContent = "Pause";

    while ((state.curRow - 1) <= state.N && !shouldPause) {
        await runOneStep({ animated: true });
    }

    loopActive = false;

    if((state.curRow - 1) > state.N || shouldPause){
        generateBtn.disabled = false;
    }

    shouldPause = false;
    document.getElementById("pauseBtn").textContent = "Play";
}

// controls
document.getElementById("fillCurrent").addEventListener("click", async () => {
    if (loopActive) return;
    await runOneStep({ animated: false });
});

const btn = document.getElementById("pauseBtn");
btn.addEventListener("click", () => {
    if (!loopActive) {
        shouldPause = false;
        runContinuously();
        return;
    }
    
    if (loopActive && !shouldPause) {
        shouldPause = true;
        generateBtn.disabled = false;
        btn.textContent = "Play";
        return;
    }

    if (!loopActive) {
        shouldPause = false;
        runContinuously();
    }
});

document.getElementById("clearTable").addEventListener("click", () => {
    if (isClear) return;

    runVersion++;
    shouldPause = true;
    loopActive = false;

    clearHighlights();

    const table = document.querySelector("#tableHolder table");
    if (table) {
        for (let r = 2; r < state.N + 2; r++) {
            for (let c = 2; c < state.W + 2; c++) {
                if (table.rows[r] && table.rows[r].cells[c])
                    table.rows[r].cells[c].textContent = "";
                state.dp[r - 1][c - 1] = null;
            }
        }
    }

    state.curRow = 2;
    state.curCol = 2;

    clearStatus();

    isClear = true;
});

function clearStatus(){
    document.getElementById("status").textContent = "Next Cell: (1, 1)";
    document.getElementById("donttake").textContent = "Dont take: -";
    document.getElementById("take").textContent = "Take: -";
    document.getElementById("pauseBtn").textContent = "Play";
}

// speed slider
const slider = document.getElementById("speedSlider");
const speedValue = document.getElementById("speedValue");
slider.addEventListener("input", () => {
    stepDelay = Number(slider.value);
    speedValue.textContent = `${stepDelay} ms`;
});