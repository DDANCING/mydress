// Executa o Next.js sempre com o Node.js de verdade.
//
// O Turbopack abre processos `node` para rodar o PostCSS/Tailwind e o build do Next 16
// não funciona no runtime do Bun. Quando o terminal foi aberto antes do Node entrar no
// PATH, o build falha com "spawning node pooled process - program not found".
// Este script encontra o Node mesmo fora do PATH e o coloca no PATH dos processos filhos.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const isWindows = process.platform === "win32";
const nodeExe = isWindows ? "node.exe" : "node";

// O `bun run` coloca no PATH um "node" falso (pasta bun-node-*) que na verdade é o Bun.
// Só aceitamos um executável que seja o Node de verdade.
const isRealNode = (dir) => {
  const binary = path.join(dir, nodeExe);
  if (!existsSync(binary) || /bun-node-/i.test(dir)) return false;
  const check = spawnSync(binary, ["-e", "process.stdout.write(typeof Bun === 'undefined' ? 'node' : 'bun')"], {
    encoding: "utf8",
  });
  return check.stdout === "node";
};

const findInPath = () =>
  (process.env.PATH || "")
    .split(path.delimiter)
    .filter(Boolean)
    .find(isRealNode);

const commonLocations = () =>
  [
    process.env.NODE_HOME,
    process.env.NVM_SYMLINK,
    process.env.VOLTA_HOME && path.join(process.env.VOLTA_HOME, "bin"),
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, "nodejs"),
    process.env["ProgramFiles(x86)"] && path.join(process.env["ProgramFiles(x86)"], "nodejs"),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Programs", "nodejs"),
    "/usr/local/bin",
    "/opt/homebrew/bin",
    "/usr/bin",
  ].filter(Boolean);

let nodeDir = findInPath();

if (!nodeDir) {
  nodeDir = commonLocations().find(isRealNode);

  if (!nodeDir) {
    console.error(
      "\n[run-next] Node.js não encontrado. O Next.js precisa do Node para compilar o CSS.\n" +
        "Instale em https://nodejs.org (versão LTS) e abra um novo terminal.\n"
    );
    process.exit(1);
  }

  process.env.PATH = `${nodeDir}${path.delimiter}${process.env.PATH || ""}`;
  console.log(`[run-next] O Node não estava no PATH deste terminal; usando ${nodeDir}`);
}

const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const result = spawnSync(path.join(nodeDir, nodeExe), [nextBin, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
