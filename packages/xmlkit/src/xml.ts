export interface XMLParserOptions {
	trim?: boolean;
	normalize?: boolean;
}

export interface XMLBuilderOptions {
	headless?: boolean;
	rootName?: string;
	renderOpts?: {
		pretty?: boolean;
	};
}

export interface XMLObject {
	$?: Record<string, string>;
	_?: string;
	[key: string]: XMLValue[] | Record<string, string> | string | undefined;
}

export type XMLValue = string | XMLObject;
export type XMLDocument = Record<string, XMLValue>;
export type Options = XMLParserOptions;

interface XMLNode {
	name: string;
	attributes: Record<string, string>;
	children: XMLNode[];
	textSegments: string[];
}

const SPECIAL_KEYS = new Set(["$", "_"]);
const WHITESPACE = /\s/;
const ENTITY_REGEX = /&(#x?[0-9a-f]+|[a-z]+);/gi;
const NAMED_ENTITIES: Record<string, string> = {
	amp: "&",
	apos: "'",
	gt: ">",
	lt: "<",
	quot: '"',
};

const isWhitespaceOnly = (value: string) => value.trim().length === 0;

const decodeEntities = (value: string) =>
	value.replace(ENTITY_REGEX, (match, entity) => {
		if (entity[0] === "#") {
			const isHex = entity[1]?.toLowerCase() === "x";
			const codePoint = Number.parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);

			if (!Number.isFinite(codePoint)) {
				return match;
			}

			try {
				return String.fromCodePoint(codePoint);
			} catch {
				return match;
			}
		}

		return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
	});

const escapeText = (value: string) =>
	value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const escapeAttribute = (value: string) =>
	escapeText(value).replace(/"/g, "&quot;").replace(/'/g, "&apos;");

class XMLTokenizer {
	private readonly source: string;
	private index = 0;

	constructor(xml: string) {
		this.source = xml.replace(/^\uFEFF/, "");
	}

	public parse(options: XMLParserOptions = {}): XMLDocument {
		this.skipWhitespace();
		this.skipMisc();
		this.skipWhitespace();

		const root = this.parseElement(options);
		this.skipWhitespace();
		this.skipMisc();
		this.skipWhitespace();

		if (!this.isAtEnd()) {
			throw new Error(`Unexpected content after root element at index ${this.index}.`);
		}

		return { [root.name]: this.toXMLValue(root, options) };
	}

	private parseElement(options: XMLParserOptions): XMLNode {
		this.expect("<");

		if (this.peek() === "/" || this.peek() === "!" || this.peek() === "?") {
			throw new Error(`Unexpected token at index ${this.index}.`);
		}

		const name = this.readName();
		const attributes = this.readAttributes();

		if (this.consume("/>")) {
			return {
				name,
				attributes,
				children: [],
				textSegments: [],
			};
		}

		this.expect(">");

		const node: XMLNode = {
			name,
			attributes,
			children: [],
			textSegments: [],
		};

		while (!this.isAtEnd()) {
			if (this.startsWith("</")) {
				break;
			}

			if (this.startsWith("<!--")) {
				this.skipComment();
				continue;
			}

			if (this.startsWith("<?")) {
				this.skipProcessingInstruction();
				continue;
			}

			if (this.startsWith("<![CDATA[")) {
				node.textSegments.push(this.readCData());
				continue;
			}

			if (this.peek() === "<") {
				node.children.push(this.parseElement(options));
				continue;
			}

			node.textSegments.push(decodeEntities(this.readText()));
		}

		this.expect("</");
		const closingName = this.readName();
		if (closingName !== name) {
			throw new Error(`Expected closing tag </${name}> but found </${closingName}>.`);
		}
		this.skipWhitespace();
		this.expect(">");

		return node;
	}

	private toXMLValue(node: XMLNode, options: XMLParserOptions): XMLValue {
		const hasAttributes = Object.keys(node.attributes).length > 0;
		const childGroups: Record<string, XMLValue[]> = {};

		for (const child of node.children) {
			childGroups[child.name] ||= [];
			childGroups[child.name].push(this.toXMLValue(child, options));
		}

		const hasChildren = Object.keys(childGroups).length > 0;
		const text = this.normalizeText(node.textSegments.join(""), options);
		const hasText = hasChildren ? !isWhitespaceOnly(text) : text.length > 0;

		if (!hasAttributes && !hasChildren) {
			return hasText ? text : "";
		}

		const value: XMLObject = {};

		if (hasAttributes) {
			value.$ = node.attributes;
		}

		if (hasText) {
			value._ = text;
		}

		for (const [name, values] of Object.entries(childGroups)) {
			value[name] = values;
		}

		return value;
	}

	private normalizeText(value: string, options: XMLParserOptions) {
		if (options.trim) {
			value = value.trim();
		}

		if (options.normalize) {
			value = value.replace(/\s+/g, " ");
		}

		return value;
	}

	private readAttributes() {
		const attributes: Record<string, string> = {};

		while (!this.isAtEnd()) {
			this.skipWhitespace();

			if (this.startsWith("/>") || this.peek() === ">") {
				break;
			}

			const name = this.readName();
			this.skipWhitespace();
			this.expect("=");
			this.skipWhitespace();
			const quote = this.peek();

			if (quote !== '"' && quote !== "'") {
				throw new Error(`Expected quoted attribute value at index ${this.index}.`);
			}

			this.index += 1;
			const valueStart = this.index;
			const closingQuoteIndex = this.source.indexOf(quote, this.index);

			if (closingQuoteIndex === -1) {
				throw new Error(`Unterminated attribute value for "${name}".`);
			}

			this.index = closingQuoteIndex;
			attributes[name] = decodeEntities(this.source.slice(valueStart, closingQuoteIndex));
			this.index += 1;
		}

		return attributes;
	}

	private readCData() {
		this.expect("<![CDATA[");
		const closingIndex = this.source.indexOf("]]>", this.index);

		if (closingIndex === -1) {
			throw new Error("Unterminated CDATA section.");
		}

		const value = this.source.slice(this.index, closingIndex);
		this.index = closingIndex + 3;
		return value;
	}

	private readText() {
		const nextTag = this.source.indexOf("<", this.index);
		const end = nextTag === -1 ? this.source.length : nextTag;
		const value = this.source.slice(this.index, end);
		this.index = end;
		return value;
	}

	private readName() {
		const start = this.index;

		while (!this.isAtEnd()) {
			const char = this.peek();
			if (char === "/" || char === ">" || char === "=" || WHITESPACE.test(char)) {
				break;
			}
			this.index += 1;
		}

		if (start === this.index) {
			throw new Error(`Expected name at index ${this.index}.`);
		}

		return this.source.slice(start, this.index);
	}

	private skipMisc() {
		let moved = false;

		do {
			moved = false;

			if (this.startsWith("<!--")) {
				this.skipComment();
				this.skipWhitespace();
				moved = true;
			}

			if (this.startsWith("<?")) {
				this.skipProcessingInstruction();
				this.skipWhitespace();
				moved = true;
			}

			if (this.startsWith("<!DOCTYPE")) {
				this.skipDoctype();
				this.skipWhitespace();
				moved = true;
			}
		} while (moved);
	}

	private skipComment() {
		this.expect("<!--");
		const closingIndex = this.source.indexOf("-->", this.index);

		if (closingIndex === -1) {
			throw new Error("Unterminated XML comment.");
		}

		this.index = closingIndex + 3;
	}

	private skipProcessingInstruction() {
		this.expect("<?");
		const closingIndex = this.source.indexOf("?>", this.index);

		if (closingIndex === -1) {
			throw new Error("Unterminated XML processing instruction.");
		}

		this.index = closingIndex + 2;
	}

	private skipDoctype() {
		this.expect("<!DOCTYPE");

		let depth = 0;
		let quote: string | null = null;

		while (!this.isAtEnd()) {
			const char = this.peek();

			if (quote) {
				if (char === quote) {
					quote = null;
				}
				this.index += 1;
				continue;
			}

			if (char === '"' || char === "'") {
				quote = char;
				this.index += 1;
				continue;
			}

			if (char === "[") {
				depth += 1;
				this.index += 1;
				continue;
			}

			if (char === "]") {
				depth = Math.max(0, depth - 1);
				this.index += 1;
				continue;
			}

			if (char === ">" && depth === 0) {
				this.index += 1;
				return;
			}

			this.index += 1;
		}

		throw new Error("Unterminated DOCTYPE declaration.");
	}

	private skipWhitespace() {
		while (!this.isAtEnd() && WHITESPACE.test(this.peek())) {
			this.index += 1;
		}
	}

	private startsWith(value: string) {
		return this.source.startsWith(value, this.index);
	}

	private consume(value: string) {
		if (!this.startsWith(value)) {
			return false;
		}

		this.index += value.length;
		return true;
	}

	private expect(value: string) {
		if (!this.consume(value)) {
			throw new Error(`Expected "${value}" at index ${this.index}.`);
		}
	}

	private peek() {
		return this.source[this.index] ?? "";
	}

	private isAtEnd() {
		return this.index >= this.source.length;
	}
}

const serializeAttributes = (attributes?: Record<string, string>) => {
	if (!attributes || !Object.keys(attributes).length) {
		return "";
	}

	return Object.entries(attributes)
		.map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`)
		.join("");
};

const serializeValue = (name: string, value: unknown): string => {
	if (Array.isArray(value)) {
		return value.map((item) => serializeValue(name, item)).join("");
	}

	if (value === undefined || value === null) {
		return `<${name}/>`;
	}

	if (typeof value !== "object") {
		return `<${name}>${escapeText(String(value))}</${name}>`;
	}

	const xmlValue = value as XMLObject;
	const attributes = serializeAttributes(xmlValue.$);
	const childKeys = Object.keys(xmlValue).filter((key) => !SPECIAL_KEYS.has(key));
	const text = typeof xmlValue._ === "string" ? escapeText(xmlValue._) : "";
	const children = childKeys
		.map((key) => serializeValue(key, xmlValue[key] as XMLValue[] | XMLValue))
		.join("");

	if (!text && !children) {
		return `<${name}${attributes}/>`;
	}

	return `<${name}${attributes}>${text}${children}</${name}>`;
};

export class Parser {
	constructor(private readonly options: XMLParserOptions = {}) {}

	public parseString<T = XMLDocument>(
		xml: string,
		callback: (error: Error | null, result?: T) => void,
	) {
		try {
			callback(null, new XMLTokenizer(xml).parse(this.options) as T);
		} catch (error) {
			callback(error as Error);
		}
	}

	public parseStringPromise<T = XMLDocument>(xml: string) {
		return new Promise<T>((resolve, reject) => {
			this.parseString<T>(xml, (error, result) => {
				if (error) {
					reject(error);
					return;
				}

				resolve(result as T);
			});
		});
	}
}

export class Builder {
	constructor(private readonly options: XMLBuilderOptions = {}) {}

	public buildObject(value: unknown) {
		const rootName = this.options.rootName || "root";
		const xml = serializeValue(rootName, value);

		if (this.options.headless) {
			return xml;
		}

		return `<?xml version="1.0" encoding="UTF-8"?>${xml}`;
	}
}

export class XML {
	public static parse<T = XMLDocument>(xml: string, options: XMLParserOptions = {}) {
		return new Parser(options).parseStringPromise<T>(xml);
	}

	public static build(value: unknown, options: XMLBuilderOptions = {}) {
		return new Builder(options).buildObject(value);
	}
}
