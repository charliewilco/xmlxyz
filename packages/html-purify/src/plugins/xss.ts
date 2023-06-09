import type { SanitizerPlugin } from "./plugin";

export class XSSSanitizerPlugin implements SanitizerPlugin {
	allowedTags = new Set([
		"a",
		"abbr",
		"acronym",
		"b",
		"blockquote",
		"code",
		"em",
		"i",
		"li",
		"ol",
		"strong",
		"ul",
		"p",
	]);
	allowedAttributes = new Set(["href", "title"]);

	onTag(tag: string, attrs: { [key: string]: string }): string {
		if (attrs.href) {
			attrs.href = this.stripXSS(attrs.href);
		}

		if (attrs.title) {
			attrs.title = this.stripXSS(attrs.title);
		}

		return tag;
	}

	onText(text: string): string {
		return this.stripXSS(text);
	}

	private stripXSS(value: string): string {
		// Strip any <script> tags
		value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

		// Replace any XSS attack strings with spaces
		value = value.replace(/&(#[0-9]+|[a-z]+);?/gi, (match, capture) => {
			const entity = match.toLowerCase();
			if (entity.startsWith("on")) {
				return " ";
			} else {
				return match;
			}
		});

		return value;
	}
}
