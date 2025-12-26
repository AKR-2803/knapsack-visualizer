let wt = [1,3,4];
let val = [15, 20, 30];
let W = 4;
let N = wt.length;

const dp = Array.from({length: N + 1}, () => new Array(W+1).fill(null));

for(let i = 0; i <= N; i++) dp[i][0] = 0;
for(let j = 0; j <= W; j++) dp[0][j] = 0;

console.log(dp);