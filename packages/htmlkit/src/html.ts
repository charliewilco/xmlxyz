import { decodeHTMLEntities } from "./entities";

export interface HTMLTextNode {
	type: "text";
	data: string;
}

export interface HTMLElementNode {
	type: "tag";
	name: string;
	attribs: Record<string, string>;
	children: HTMLNode[];
}

export type HTMLNode = HTMLElementNode | HTMLTextNode;

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

const RAW_TEXT_ELEMENTS = new Set(["script", "style"]);

export const parseHTML = (html: string): HTMLNode[] => {
	const parser = new HTMLFragmentParser(html);
	return parser.parse();
};

class HTMLFragmentParser {
	private index = 0;
	private readonly root: HTMLElementNode = {
		type: "tag",
		name: "#root",
		attribs: {},
		children: [],
	};
	private readonly stack = [this.root];

	constructor(private readonly source: string) {}

	public parse(): HTMLNode[] {
		while (!this.isAtEnd()) {
			if (this.peek() !== "<") {
				this.readText();
			} else if (this.startsWith("<!--")) {
				this.skipComment();
			} else if (this.startsWith("</")) {
				this.readClosingTag();
			} else if (this.startsWith("<!") || this.startsWith("<?")) {
				this.skipMarkupDeclaration();
			} else if (!this.readOpeningTag()) {
				this.appendText(this.consume());
			}
		}

		return this.root.children;
	}

	private readText() {
		const start = this.index;
		while (!this.isAtEnd() && this.peek() !== "<") {
			this.index += 1;
		}
		this.appendText(this.source.slice(start, this.index));
	}

	private readOpeningTag() {
		const start = this.index;
		this.index += 1;

		const name = this.readName();
		if (!name) {
			this.index = start;
			return false;
		}

		const lowerName = name.toLowerCase();
		const attribs = this.readAttributes();
		const selfClosing = this.consumeIf("/") || VOID_ELEMENTS.has(lowerName);

		if (!this.consumeIf(">")) {
			this.index = start;
			return false;
		}

		const node: HTMLElementNode = {
			type: "tag",
			name: lowerName,
			attribs,
			children: [],
		};
		this.current.children.push(node);

		if (RAW_TEXT_ELEMENTS.has(lowerName)) {
			this.readRawText(node, lowerName);
		} else if (!selfClosing) {
			this.stack.push(node);
		}

		return true;
	}

	private readClosingTag() {
		this.index += 2;
		const name = this.readName().toLowerCase();
		this.skipUntil(">");
		this.consumeIf(">");

		if (!name) {
			return;
		}

		for (let i = this.stack.length - 1; i > 0; i--) {
			if (this.stack[i].name === name) {
				this.stack.length = i;
				return;
			}
		}
	}

	private readRawText(node: HTMLElementNode, tagName: string) {
		const closingTag = `</${tagName}`;
		const lowerSource = this.source.toLowerCase();
		const closingIndex = lowerSource.indexOf(closingTag, this.index);
		const endIndex = closingIndex === -1 ? this.source.length : closingIndex;
		const data = this.source.slice(this.index, endIndex);

		if (data) {
			node.children.push({
				type: "text",
				data: decodeHTMLEntities(data),
			});
		}

		this.index = endIndex;
		if (closingIndex !== -1) {
			this.readClosingTag();
		}
	}

	private readAttributes() {
		const attribs: Record<string, string> = {};

		while (!this.isAtEnd()) {
			this.skipWhitespace();

			if (this.peek() === ">" || this.peek() === "/") {
				break;
			}

			const name = this.readAttributeName();
			if (!name) {
				this.index += 1;
				continue;
			}

			this.skipWhitespace();
			if (!this.consumeIf("=")) {
				attribs[name.toLowerCase()] = "";
				continue;
			}

			this.skipWhitespace();
			attribs[name.toLowerCase()] = decodeHTMLEntities(this.readAttributeValue());
		}

		return attribs;
	}

	private readAttributeValue() {
		const quote = this.peek();
		if (quote === '"' || quote === "'") {
			this.index += 1;
			const start = this.index;
			this.skipUntil(quote);
			const value = this.source.slice(start, this.index);
			this.consumeIf(quote);
			return value;
		}

		const start = this.index;
		while (!this.isAtEnd() && !/[\s>]/.test(this.peek()) && this.peek() !== "/") {
			this.index += 1;
		}

		return this.source.slice(start, this.index);
	}

	private readName() {
		const start = this.index;
		while (!this.isAtEnd() && /[A-Za-z0-9:_-]/.test(this.peek())) {
			this.index += 1;
		}
		return this.source.slice(start, this.index);
	}

	private readAttributeName() {
		const start = this.index;
		while (!this.isAtEnd() && !/[\s=>/]/.test(this.peek())) {
			this.index += 1;
		}
		return this.source.slice(start, this.index);
	}

	private skipComment() {
		this.index += 4;
		const end = this.source.indexOf("-->", this.index);
		this.index = end === -1 ? this.source.length : end + 3;
	}

	private skipMarkupDeclaration() {
		this.skipUntil(">");
		this.consumeIf(">");
	}

	private skipWhitespace() {
		while (!this.isAtEnd() && /\s/.test(this.peek())) {
			this.index += 1;
		}
	}

	private skipUntil(token: string) {
		const tokenIndex = this.source.indexOf(token, this.index);
		this.index = tokenIndex === -1 ? this.source.length : tokenIndex;
	}

	private appendText(value: string) {
		if (!value) {
			return;
		}

		const last = this.current.children[this.current.children.length - 1];
		const data = decodeHTMLEntities(value);

		if (last?.type === "text") {
			last.data += data;
		} else {
			this.current.children.push({ type: "text", data });
		}
	}

	private consume() {
		const character = this.source[this.index] ?? "";
		this.index += 1;
		return character;
	}

	private consumeIf(token: string) {
		if (!this.startsWith(token)) {
			return false;
		}

		this.index += token.length;
		return true;
	}

	private startsWith(token: string) {
		return this.source.startsWith(token, this.index);
	}

	private peek() {
		return this.source[this.index] ?? "";
	}

	private isAtEnd() {
		return this.index >= this.source.length;
	}

	private get current() {
		return this.stack[this.stack.length - 1];
	}
}
