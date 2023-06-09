import { decodeHTML } from "entities";
import { Builder } from "xml2js";

export const stripHtml = function (str: string) {
	str = str.replace(
		/([^\n])<\/?(h|br|p|ul|ol|li|blockquote|section|table|tr|div)(?:.|\n)*?>([^\n])/gm,
		"$1\n$3"
	);
	str = str.replace(/<(?:.|\n)*?>/gm, "");
	return str;
};

export const getSnippet = function (str: string) {
	return decodeHTML(stripHtml(str)).trim();
};

export const getLink = function (links: any[], rel: string, fallbackIdx: number) {
	if (!links) return;
	for (let i = 0; i < links.length; ++i) {
		if (links[i].$.rel === rel) return links[i].$.href;
	}
	if (links[fallbackIdx]) return links[fallbackIdx].$.href;
};

export const getContent = function (content: any) {
	if (typeof content._ === "string") {
		return content._;
	} else if (typeof content === "object") {
		let builder = new Builder({
			headless: true,
			// explicitRoot: true,
			rootName: "div",
			renderOpts: { pretty: false },
		});
		return builder.buildObject(content);
	} else {
		return content;
	}
};

export const copyFromXML = function (xml: string, dest: any, fields: any[] = []) {
	fields.forEach(function (f) {
		let from = f;
		let to = f;
		let options = {
			keepArray: false,
			includeSnippet: false,
		};
		if (Array.isArray(f)) {
			from = f[0];
			to = f[1];
			if (f.length > 2) {
				options = f[2];
			}
		}
		const { keepArray, includeSnippet } = options;
		if (xml[from] !== undefined) {
			dest[to] = keepArray ? xml[from] : xml[from][0];
		}
		if (dest[to] && typeof dest[to]._ === "string") {
			dest[to] = dest[to]._;
		}
		if (includeSnippet && dest[to] && typeof dest[to] === "string") {
			dest[to + "Snippet"] = getSnippet(dest[to]);
		}
	});
};

export const maybePromisify = function (
	callback: (...args: any) => any,
	promise: Promise<any>
) {
	if (!callback) return promise;
	return promise.then(
		(data) => setTimeout(() => callback(null, data)),
		(err) => setTimeout(() => callback(err))
	);
};

const DEFAULT_ENCODING = "utf8";
const ENCODING_REGEX = /(encoding|charset)\s*=\s*(\S+)/;
const SUPPORTED_ENCODINGS = [
	"ascii",
	"utf8",
	"utf16le",
	"ucs2",
	"base64",
	"latin1",
	"binary",
	"hex",
];
const ENCODING_ALIASES = {
	"utf-8": "utf8",
	"iso-8859-1": "latin1",
};

export const getEncodingFromContentType = function (contentType: string) {
	contentType = contentType || "";
	let match = contentType.match(ENCODING_REGEX);
	let encoding: keyof typeof ENCODING_ALIASES | string = (match || [])[2] || "";
	encoding = encoding.toLowerCase();
	encoding = ENCODING_ALIASES[encoding as keyof typeof ENCODING_ALIASES] || encoding;
	if (!encoding || SUPPORTED_ENCODINGS.indexOf(encoding) === -1) {
		encoding = DEFAULT_ENCODING;
	}
	return encoding;
};

export const isJSON = <T extends any>(str: any): str is T => {
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
};
