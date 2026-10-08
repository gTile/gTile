import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, "out", "extension");

// Only reset the build staging directory. Never git-clean the checkout or
// package pre-existing files from dist/, which may contain local artifacts.
rmSync(output, { recursive: true, force: true });
if (process.argv.includes("--clean")) {
  for (const name of ["gtile.dist.tgz", "gtile.dist.zip"]) {
    rmSync(join(root, name), { force: true });
  }
  process.exit(0);
}

execFileSync(process.execPath, [
  join(root, "node_modules", "typescript", "bin", "tsc"),
  "-p", join(root, "tsconfig.prod.json"), "--outDir", output,
], { cwd: root, stdio: "inherit" });
rmSync(join(output, "types"), { recursive: true, force: true });

for (const name of ["metadata.json", "stylesheet.css", "images"]) {
  cpSync(join(root, "dist", name), join(output, name), { recursive: true });
}
mkdirSync(join(output, "schemas"), { recursive: true });
cpSync(join(root, "dist", "schemas",
  "org.gnome.shell.extensions.gtile.gschema.xml"),
  join(output, "schemas", "org.gnome.shell.extensions.gtile.gschema.xml"));

if (process.argv.includes("--package")) {
  // GNOME's installer compiles the included schema. A ZIP is the standard
  // extension format; retain the TAR archive for existing release consumers.
  rmSync(join(root, "gtile.dist.zip"), { force: true });
  execFileSync("zip", ["-q", "-r", join(root, "gtile.dist.zip"), "."],
    { cwd: output, stdio: "inherit" });
  execFileSync("tar", ["-czf", join(root, "gtile.dist.tgz"), "-C", output, "."],
    { cwd: root, stdio: "inherit" });
}
