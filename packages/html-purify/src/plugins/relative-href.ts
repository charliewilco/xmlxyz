import type { SanitizerPlugin } from "./plugin";

export class RelativeHrefSanitizerPlugin implements SanitizerPlugin {
	allowedTags = new Set(["a"]);
	allowedAttributes = new Set(["href"]);
	baseURI: string;

	constructor(baseURI: string) {
		this.baseURI = baseURI;
	}

	onAttribute(attr: string, value: string): string {
		// If this is not the `href` attribute, do nothing with it.
		if (attr !== "href") return value;

		if (!value) {
			// No href attribute, skip the tag
			return "";
		}

		try {
			// If this is a standard URL, do nothing with it.
			new URL(value);

			return value;
		} catch (err) {
			// If this is a relative URL, add the base URL to it.
			return new URL(value, this.baseURI).href;
		}
	}
}
