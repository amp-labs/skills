import { latestResults, type ScenarioResult } from "../lib/results.ts";

const significance = 0.05;

type Counts = { passed: number; total: number };

type Comparison = {
  arm: string;
  main: Counts;
  branch: Counts;
  mainWorkloads: number;
  branchWorkloads: number;
  onlyOnBranch: number;
  onlyOnMain: number;
};

const workload = ({ modelDir, scenario }: ScenarioResult): string => `${modelDir}/${scenario}`;

const totals = (results: ScenarioResult[]): Counts =>
  results.reduce(
    (sum, result) => ({
      passed: sum.passed + result.passedRuns,
      total: sum.total + result.totalRuns,
    }),
    { passed: 0, total: 0 },
  );

function compare(branchDir: string, mainDir: string, arm: string): Comparison {
  const mainResults = latestResults(mainDir, arm);
  const branchResults = latestResults(branchDir, arm);
  const onMain = new Set(mainResults.map(workload));
  const onBranch = new Set(branchResults.map(workload));
  const inBoth = (result: ScenarioResult): boolean =>
    onMain.has(workload(result)) && onBranch.has(workload(result));
  const sharedMain = mainResults.filter(inBoth);
  const sharedBranch = branchResults.filter(inBoth);
  return {
    arm,
    main: totals(sharedMain),
    branch: totals(sharedBranch),
    mainWorkloads: onMain.size,
    branchWorkloads: onBranch.size,
    onlyOnBranch: onBranch.size - sharedBranch.length,
    onlyOnMain: onMain.size - sharedMain.length,
  };
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

function verdict(comparison: Comparison, p: number | null): string {
  const { main, branch } = comparison;
  if (comparison.branchWorkloads === 0) return "no results";
  if (comparison.mainWorkloads === 0) return "no baseline";
  if (p === null) return "nothing in common";
  if (p < significance) return "**dropped**";
  if (branch.passed / branch.total < main.passed / main.total) return "lower, not significant";
  return "ok";
}

function notCompared({ onlyOnBranch, onlyOnMain }: Comparison): string {
  const parts: string[] = [];
  if (onlyOnBranch > 0) parts.push(`${onlyOnBranch} on this branch`);
  if (onlyOnMain > 0) parts.push(`${onlyOnMain} on main`);
  return parts.join(", ") || "-";
}

const [branchResults, mainResults, ...arms] = process.argv.slice(2);
if (!branchResults || !mainResults || arms.length === 0) {
  process.stderr.write("Usage: compare-results.ts <branch results> <main results> <arm>...\n");
  process.exit(1);
}

const rows = arms.map((arm) => {
  const comparison = compare(branchResults, mainResults, arm);
  const p =
    comparison.main.total && comparison.branch.total
      ? probabilityOfDropAtLeastThisLarge(comparison.main, comparison.branch)
      : null;
  return { ...comparison, p, verdict: verdict(comparison, p) };
});

const table = [
  "| Arm | main | branch | p | Verdict | Not compared |",
  "| --- | --- | --- | --- | --- | --- |",
  ...rows.map(
    (row) =>
      `| ${row.arm} | ${rate(row.main)} | ${rate(row.branch)} | ${row.p?.toFixed(3) ?? "-"} | ${row.verdict} | ${notCompared(row)} |`,
  ),
];
process.stdout.write(`${table.join("\n")}\n`);
if (rows.some((row) => row.p !== null && row.p < significance)) process.exitCode = 1;
