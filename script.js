let wt = [1, 3, 4];
let val = [15, 20, 30];
let W = 4;
let N = wt.length;

const dp = Array.from({ length: N + 1 }, () => new Array(W + 1).fill(null));

for (let i = 0; i <= N; i++) dp[i][0] = 0;
for (let j = 0; j <= W; j++) dp[0][j] = 0;

let curRow = 1;
let curCol = 1;

document.getElementById("wt-array").textContent = wt.toString();
document.getElementById("val-array").textContent = val.toString();
document.getElementById("capacity").textContent = W;

function renderTable() {
    const rows = N + 1;
    const cols = W + 1;

    const table = document.createElement("table");

    for (let i = 0; i < rows; i++) {
        const tr = document.createElement("tr");
        for (let j = 0; j < cols; j++) {
            const td = document.createElement("td");

            td.dataset.r = i;
            td.dataset.c = j;

            td.textContent = dp[i][j] === null ? '' : dp[i][j];

            tr.appendChild(td);
        }
        table.appendChild(tr);
    }

    const holder = document.getElementById("tableHolder");
    holder.innerHTML = ``;
    holder.appendChild(table);
}

renderTable();

document.getElementById("fillCurrent").addEventListener("click", () => {
    const i = curRow;
    const j = curCol;

    clearHighlights();

    markCurrentCell(i, j);

    const deps = [{ r: i - 1, c: j }];
    if(j >= wt[i - 1]){
        deps.push({r: i - 1, c: j - wt[i - 1]});
    }

    deps.forEach(d => markDependencyCell(d.r, d.c));

    let best = dp[i - 1][j];
    if(j >= wt[i - 1]){
        best = Math.max(best, dp[i - 1][j - wt[i - 1]] + val[i - 1]);
    }
    
    // update cell in dp
    dp[i][j] = best;

    const td = document.querySelector(`td[data-r="${i}"][data-c="${j}"]`);
    td.textContent = best;

    curCol++;
    if(curCol > W){
        curCol = 1;
        curRow++;
    }
});

function clearHighlights(){
    document.querySelectorAll("td.current, td.dependency")
    .forEach(td => td.classList.remove("current", "dependency"));
}

function markCurrentCell(i, j) {
    const td = document.querySelector(`td[data-r="${i}"][data-c="${j}"]`);
    if (td) td.classList.add("current");
}
function markDependencyCell(i, j) {
    const td = document.querySelector(`td[data-r="${i}"][data-c="${j}"]`);
    if (td) td.classList.add("dependency");
}
