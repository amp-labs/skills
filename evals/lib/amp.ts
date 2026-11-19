import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Sandbox } from "@vercel/agent-eval";

// The public amp CLI release, with checksums from its checksums.txt.
const release = "1.2.0";
const releaseSha256: Record<string, string> = {
  arm64: "1ca45fdeecb0912fbc6cfd7153bc307e5b02fee127270add78632bebbaf21bbf",
  x86_64: "d69ff2de9e89b56e3eccb49b3586a1706b96b4fd4ebaef3a256d826cef7885e7",
};

// A local build instead of the release: a directory holding linux_arm64/amp and linux_amd64/amp.
const localBuild = process.env.AMP_CLI_BUILD;

const ampCli = localBuild ? `local build ${localBuild}` : `release ${release}`;

// Installs amp behind a wrapper on the agent's PATH: the npm global bin directory, which the sandbox adds, and
// ~/.local/bin, which ~/.profile adds for login shells such as the `bash -lc` that Codex runs commands in.
// The sandbox image has no CA bundle and amp is a Go binary, so the wrapper points it at Node's root certificates.
export async function installAmp(sandbox: Sandbox): Promise<void> {
  const arm = (await sandbox.runCommand("uname", ["-m"])).stdout.trim() === "aarch64";
  const install = localBuild
    ? await uploadLocalBuild(sandbox, arm)
    : downloadRelease(arm ? "arm64" : "x86_64");
  const script = [
    "set -e",
    "prefix=$(npm config get prefix)",
    'bin="$prefix/bin" lib="$prefix/libexec"',
    'mkdir -p "$bin" "$lib" "$HOME/.local/bin"',
    ...install,
    `node -p "require('tls').rootCertificates.join('\\n')" > "$lib/ca-certificates.pem"`,
    `printf '#!/bin/sh\\nSSL_CERT_FILE="\${SSL_CERT_FILE:-%s}" exec %s "$@"\\n' "$lib/ca-certificates.pem" "$lib/amp" > "$bin/amp"`,
    'chmod +x "$bin/amp"',
    'ln -sf "$bin/amp" "$HOME/.local/bin/amp"',
    "amp version",
    'bash -lc "amp version"',
  ];
  const result = await sandbox.runCommand("bash", ["-c", script.join("\n")]);
  if (result.exitCode !== 0)
    throw new Error(`amp install failed (${ampCli}): ${result.stderr || result.stdout}`);
}

function downloadRelease(arch: string): string[] {
  const url = `https://github.com/amp-labs/cli/releases/download/v${release}/cli_Linux_${arch}.tar.gz`;
  return [
    "tmp=$(mktemp -d)",
    `node -e "fetch('${url}').then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(b => require('fs').writeFileSync('$tmp/amp.tgz', Buffer.from(b)))"`,
    `echo "${releaseSha256[arch]}  $tmp/amp.tgz" | sha256sum -c -`,
    'tar xzf "$tmp/amp.tgz" -C "$lib" amp',
    'rm -rf "$tmp"',
  ];
}

// The sandbox only takes text files in the workspace, so the binary goes in as base64 and is decoded onto PATH
// before the agent starts.
async function uploadLocalBuild(sandbox: Sandbox, arm: boolean): Promise<string[]> {
  const binary = readFileSync(join(localBuild!, arm ? "linux_arm64" : "linux_amd64", "amp"));
  await sandbox.writeFiles({ ".amp-cli-upload": binary.toString("base64") });
  return ['base64 -d .amp-cli-upload > "$lib/amp"', "rm .amp-cli-upload", 'chmod +x "$lib/amp"'];
}
