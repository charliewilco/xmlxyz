import { defineConfig } from "tsup";

export default defineConfig((options) => {
	return {
		minify: !options.watch,
		dts: true,
		splitting: true,
		clean: true,
		sourcemap: true,
		entryPoints: ["src/index.ts"],
		format: ["esm", "cjs"],
	};
});
