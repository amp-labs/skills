import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Sandbox } from "@vercel/agent-eval";

const ampRelease = "1.2.0";
const ampReleaseChecksums: Record<string, string> = {
  arm64: "1ca45fdeecb0912fbc6cfd7153bc307e5b02fee127270add78632bebbaf21bbf",
  x86_64: "d69ff2de9e89b56e3eccb49b3586a1706b96b4fd4ebaef3a256d826cef7885e7",
};

const localBuildDir = process.env.AMP_CLI_BUILD;

const ampSource = localBuildDir ? `local build ${localBuildDir}` : `release ${ampRelease}`;

const nodeRootCertificatesForGoTls = `node -p "require('tls').rootCertificates.join('\\n')" > "$lib/ca-certificates.pem"`;
const wrapperUsingNodeCertificates = `printf '#!/bin/sh\\nSSL_CERT_FILE="\${SSL_CERT_FILE:-%s}" exec %s "$@"\\n' "$lib/ca-certificates.pem" "$lib/amp" > "$bin/amp"`;
const reachableFromLoginShells = 'ln -sf "$bin/amp" "$HOME/.local/bin/amp"';
const failUnlessEveryShellFindsAmp = ["amp version", 'bash -lc "amp version"'];

export async function installAmp(sandbox: Sandbox): Promise<void> {
  const arm = (await sandbox.runCommand("uname", ["-m"])).stdout.trim() === "aarch64";
  const placeBinary = localBuildDir
    ? await uploadLocalBuildAsBase64(sandbox, localBuildDir, arm)
    : downloadCheckedRelease(arm ? "arm64" : "x86_64");
  const script = [
    "set -e",
    "prefix=$(npm config get prefix)",
    'bin="$prefix/bin" lib="$prefix/libexec"',
    'mkdir -p "$bin" "$lib" "$HOME/.local/bin"',
    ...placeBinary,
    nodeRootCertificatesForGoTls,
    wrapperUsingNodeCertificates,
    'chmod +x "$bin/amp"',
    reachableFromLoginShells,
    ...failUnlessEveryShellFindsAmp,
  ];
  const result = await sandbox.runCommand("bash", ["-c", script.join("\n")]);
  if (result.exitCode !== 0)
    throw new Error(`amp install failed (${ampSource}): ${result.stderr || result.stdout}`);
}

function downloadCheckedRelease(arch: string): string[] {
  const url = `https://github.com/amp-labs/cli/releases/download/v${ampRelease}/cli_Linux_${arch}.tar.gz`;
  return [
    "tmp=$(mktemp -d)",
    `node -e "fetch('${url}').then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(b => require('fs').writeFileSync('$tmp/amp.tgz', Buffer.from(b)))"`,
    `echo "${ampReleaseChecksums[arch]}  $tmp/amp.tgz" | sha256sum -c -`,
    'tar xzf "$tmp/amp.tgz" -C "$lib" amp',
    'rm -rf "$tmp"',
  ];
}

async function uploadLocalBuildAsBase64(
  sandbox: Sandbox,
  buildDir: string,
  arm: boolean,
): Promise<string[]> {
  const binary = readFileSync(join(buildDir, arm ? "linux_arm64" : "linux_amd64", "amp"));
  await sandbox.writeFiles({ ".amp-cli-upload": binary.toString("base64") });
  return ['base64 -d .amp-cli-upload > "$lib/amp"', "rm .amp-cli-upload", 'chmod +x "$lib/amp"'];
}
