import { latestResults } from "../lib/results.ts";

const significance = 0.05;

type Counts = { passed: number; total: number };

function pooled(resultsDir: string, arm: string): Counts {
  return latestResults(resultsDir, arm).reduce(
    (sum, result) => ({
      passed: sum.passed + result.passedRuns,
      total: sum.total + result.totalRuns,
    }),
    { passed: 0, total: 0 },
  );
}

function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let value = 1;
  for (let i = 1; i <= k; i++) value = (value * (n - k + i)) / i;
  return value;
}

function probabilityOfDropAtLeastThisLarge(main: Counts, branch: Counts): number {
  const passed = main.passed + branch.passed;
  const total = main.total + branch.total;
  let probability = 0;
  for (let k = 0; k <= branch.passed; k++)
    probability += choose(passed, k) * choose(total - passed, branch.total - k);
  return probability / choose(total, branch.total);
}

const rate = ({ passed, total }: Counts) => `${passed}/${total}`;

function verdict(main: Counts, branch: Counts, p: number | null): string {
  if (main.total === 0) return "no baseline";
  if (branch.total === 0) return "no results";
  if (p !== null && p < significance) return "**dropped**";
  if (branch.passed / branch.total < main.passed / main.total) return "lower, not significant";
  return "ok";
}

const [branchResults, mainResults, ...arms] = process.argv.slice(2);
if (!branchResults || !mainResults || arms.length === 0) {
  process.stderr.write("Usage: compare-results.ts <branch results> <main results> <arm>...\n");
  process.exit(1);
}

const rows = arms.map((arm) => {
  const main = pooled(mainResults, arm);
  const branch = pooled(branchResults, arm);
  const p = main.total && branch.total ? probabilityOfDropAtLeastThisLarge(main, branch) : null;
  return { arm, main, branch, p, verdict: verdict(main, branch, p) };
});

const table = [
  "| Arm | main | branch | p | Verdict |",
  "| --- | --- | --- | --- | --- |",
  ...rows.map(
    (row) =>
      `| ${row.arm} | ${rate(row.main)} | ${rate(row.branch)} | ${row.p?.toFixed(3) ?? "-"} | ${row.verdict} |`,
  ),
];
process.stdout.write(`${table.join("\n")}\n`);
if (rows.some((row) => row.p !== null && row.p < significance)) process.exitCode = 1;
