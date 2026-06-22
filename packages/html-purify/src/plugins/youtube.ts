import type { SanitizerPlugin } from "./plugin";

export class YoutubeIframeSanitizerPlugin implements SanitizerPlugin {
	allowedTags: Set<string> = new Set(["iframe"]);
	allowedAttributes: Set<string> = new Set([
		"allowfullscreen",
		"frameborder",
		"height",
		"src",
		"width",
	]);

	onTag(tag: string, attrs: { [key: string]: string }): string | void {
		if (tag === "iframe") {
			const src = attrs["src"];
			if (src && src.startsWith("https://www.youtube.com/embed/")) {
				return tag;
			}
		}

		return "";
	}
}
