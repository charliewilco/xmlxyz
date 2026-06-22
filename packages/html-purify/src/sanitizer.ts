import {
	escapeHTMLAttribute,
	escapeHTMLText,
	parseHTML,
	type HTMLNode,
} from "@xmlxyz/htmlkit";
import type { SanitizerPlugin } from "./plugins/plugin";

const VOID_ELEMENTS = new Set([
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr",
]);

/**
 * 1. Read HTML
 * 2. Detect any malicious HTML
 * 3. Sanitize the malicious HTML
 * 4. Return the sanitized HTML
 */
export class HTMLSanitizer {
	private plugins: SanitizerPlugin[];

	constructor(plugins: SanitizerPlugin[]) {
		this.plugins = plugins;
	}

	public cleanSync(html: string): string {
		return this.traverse(parseHTML(html));
	}

	private traverse(nodes: HTMLNode[]): string {
		let result = "";

		nodes.forEach((node) => {
			if (node.type === "tag") {
				if (!node.name) {
					return;
				}

				let tag = node.name;
				let attrs = node.attribs ?? {};

				let filteredAttrs: { [key: string]: string } = {};
				let allowedByPlugins = false;

				for (let i = 0; i < this.plugins.length; i++) {
					const plugin = this.plugins[i];
					if (plugin.allowedTags.has(tag) || plugin.allowedTags.has("*")) {
						allowedByPlugins = true;

						if (plugin.onTag) {
							const newTag = plugin.onTag(tag, attrs);
							if (newTag) {
								tag = newTag;
							} else {
								// Plugin returned falsy value, skip this tag
								return;
							}
						}

						for (const attr in attrs) {
							if (plugin.allowedAttributes.has(attr) || plugin.allowedAttributes.has("*")) {
								const value = plugin.onAttribute
									? plugin.onAttribute(attr, attrs[attr])
									: attrs[attr];
								filteredAttrs[attr] = value;
							}
						}
					}
				}

				if (!allowedByPlugins) {
					return;
				}

				const serializedAttrs =
					Object.keys(filteredAttrs).length === 0
						? ""
						: ` ${Object.entries(filteredAttrs)
								.map(([name, value]) => `${name}="${escapeHTMLAttribute(value)}"`)
								.join(" ")}`;

				result += `<${tag}${serializedAttrs}>`;

				if (VOID_ELEMENTS.has(tag)) {
					return;
				}

				if (node.children) {
					result += this.traverse(node.children);
				}

				result += `</${tag}>`;
			} else if (node.type === "text") {
				let text = node.data ?? "";

				for (let i = 0; i < this.plugins.length; i++) {
					const plugin = this.plugins[i];
					if (plugin.onText) {
						const newText = plugin.onText(text);
						if (newText) {
							text = newText;
						} else {
							// Plugin returned falsy value, skip this text node
							return;
						}
					}
				}

				result += escapeHTMLText(text);
			}
		});

		return result;
	}
}
