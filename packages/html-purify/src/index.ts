import { ImageSanitizerPlugin } from "./plugins/images";
import { HrefSanitizerPlugin } from "./plugins/naughty-href";
import type { SanitizerPlugin } from "./plugins/plugin";
import { ScriptAndStyleTagRemoverPlugin } from "./plugins/remove-js-css";
import { XSSSanitizerPlugin } from "./plugins/xss";
import { YoutubeIframeSanitizerPlugin } from "./plugins/youtube";

import { RelativeHrefSanitizerPlugin } from "./plugins/relative-href";
import { HTMLSanitizer } from "./sanitizer";

export const DEFAULT_PLUGINS: SanitizerPlugin[] = [
	new ImageSanitizerPlugin(),
	new HrefSanitizerPlugin(),
	new XSSSanitizerPlugin(),
	new ScriptAndStyleTagRemoverPlugin(),
	new YoutubeIframeSanitizerPlugin(),
];

function createSanitizer(plugins: SanitizerPlugin[] = DEFAULT_PLUGINS, baseURI: string = ''): HTMLSanitizer {
	return new HTMLSanitizer([
		...plugins,
		new RelativeHrefSanitizerPlugin(baseURI)
	]);
}

export { SanitizerPlugin, createSanitizer };
