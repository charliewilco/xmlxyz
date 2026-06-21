import { build, context } from "esbuild";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, readdir, readFile, rm } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

const watch = process.argv.includes("--watch");
const packageRoot = process.cwd();
const distPath = join(packageRoot, "dist");
const packageJson = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
const packageDirectoryName = basename(packageRoot);
const packagesRoot = dirname(packageRoot);
const external = [
	...Object.keys(packageJson.dependencies ?? {}),
	...Object.keys(packageJson.peerDependencies ?? {}),
];

const commonOptions = {
	entryPoints: [join(packageRoot, "src/index.ts")],
	bundle: true,
	external,
	logLevel: "info",
	minify: !watch,
	platform: "neutral",
	sourcemap: true,
	target: "esnext",
};

if (watch) {
	await rm(distPath, { force: true, recursive: true });
	const esmContext = await context({
		...commonOptions,
		format: "esm",
		outfile: join(distPath, "index.js"),
	});
	const cjsContext = await context({
		...commonOptions,
		format: "cjs",
		outfile: join(distPath, "index.cjs"),
	});

	await Promise.all([esmContext.watch(), cjsContext.watch()]);
	await buildDeclarations();
	console.log(`Watching ${packageJson.name}`);
} else {
	await rm(distPath, { force: true, recursive: true });
	await build({
		...commonOptions,
		format: "esm",
		outfile: join(distPath, "index.js"),
	});
	await build({
		...commonOptions,
		format: "cjs",
		outfile: join(distPath, "index.cjs"),
	});
	await buildDeclarations();
}

async function buildDeclarations() {
	await run("tsc", ["--emitDeclarationOnly", "--pretty"]);
	await normalizeDeclarations();
}

async function normalizeDeclarations() {
	const nestedSourcePath = join(distPath, packageDirectoryName, "src");
	if (!existsSync(nestedSourcePath)) {
		return;
	}

	await cp(nestedSourcePath, distPath, { recursive: true });

	const entries = await readdir(packagesRoot, { withFileTypes: true });
	await Promise.all(
		entries
			.filter((entry) => entry.isDirectory())
			.map((entry) => rm(join(distPath, entry.name), { force: true, recursive: true })),
	);
}

function run(command, args) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			cwd: packageRoot,
			shell: process.platform === "win32",
			stdio: "inherit",
		});

		child.on("error", reject);
		child.on("exit", (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
			}
		});
	});
}
