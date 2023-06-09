import type { ChildNode } from "domhandler";
import { DomHandler, Parser } from "htmlparser2";
import type { SanitizerPlugin } from "./plugins/plugin";

/**
 * 1. Read HTML
 * 2. Detect any malicious HTML
 * 3. Sanitize the malicious HTML
 * 4. Return the sanitized HTML
 */
export class HTMLSanitizer {
	private plugins: SanitizerPlugin[];
	private htmlParser?: Parser;

	constructor(plugins: SanitizerPlugin[]) {
		this.plugins = plugins;
	}

	public cleanSync(html: string): string {
		let sanitizedHtml = "";

		// Create a new parser
		this.htmlParser = new Parser(
			new DomHandler((err, dom) => {
				if (err) {
					throw err;
				}

				sanitizedHtml = this.traverse(dom);
			})
		);

		// Parse the HTML
		this.htmlParser.write(html);
		this.htmlParser.end();

		return sanitizedHtml;
	}

	private traverse(nodes: ChildNode[]): string {
		let result = "";

		nodes.forEach((node) => {
			if (node.type === "tag") {
				let tag = node.name;
				let attrs = node.attribs;

				let filteredAttrs: { [key: string]: string } = {};
				let allowedByPlugins = false;

				for (let i = 0; i < this.plugins.length; i++) {
					const plugin = this.plugins[i];
					if (plugin.allowedTags.has(tag) || plugin.allowedTags.has('*')) {
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
							if (plugin.allowedAttributes.has(attr) || plugin.allowedAttributes.has('*')) {
								const value = plugin.onAttribute ? plugin.onAttribute(attr, attrs[attr]) : attrs[attr];
								filteredAttrs[attr] = value;
							}
						}
					}
				}

				if (!allowedByPlugins) {
					return;
				}

				if (Object.keys(filteredAttrs).length === 0) {
					result += `<${tag}>`;
				} else {
					result += `<${tag} ${Object.entries(filteredAttrs)
						.map(([name, value]) => `${name}="${value}"`)
						.join(" ")}>`;
				}

				if (node.children) {
					result += this.traverse(node.children);
				}

				result += `</${tag}>`;
			} else if (node.type === "text") {
				let text = node.data;

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

				result += text;
			}
		});

		return result;
	}
}
