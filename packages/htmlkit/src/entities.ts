import {
	HTML_NAMED_CHARACTER_REFERENCES,
	MAX_NAMED_CHARACTER_REFERENCE_LENGTH,
} from "./generated/entities";

const WINDOWS_1252_CONTROL_REFERENCES: Record<number, string> = {
	0x80: "\u20AC",
	0x82: "\u201A",
	0x83: "\u0192",
	0x84: "\u201E",
	0x85: "\u2026",
	0x86: "\u2020",
	0x87: "\u2021",
	0x88: "\u02C6",
	0x89: "\u2030",
	0x8a: "\u0160",
	0x8b: "\u2039",
	0x8c: "\u0152",
	0x8e: "\u017D",
	0x91: "\u2018",
	0x92: "\u2019",
	0x93: "\u201C",
	0x94: "\u201D",
	0x95: "\u2022",
	0x96: "\u2013",
	0x97: "\u2014",
	0x98: "\u02DC",
	0x99: "\u2122",
	0x9a: "\u0161",
	0x9b: "\u203A",
	0x9c: "\u0153",
	0x9e: "\u017E",
	0x9f: "\u0178",
};

export const decodeHTMLEntities = (value: string) => {
	let result = "";
	let index = 0;

	while (index < value.length) {
		const ampersandIndex = value.indexOf("&", index);
		if (ampersandIndex === -1) {
			result += value.slice(index);
			break;
		}

		result += value.slice(index, ampersandIndex);

		const numericReference = readNumericCharacterReference(value, ampersandIndex + 1);
		if (numericReference) {
			result += numericReference.value;
			index = numericReference.end;
			continue;
		}

		const namedReference = readNamedCharacterReference(value, ampersandIndex + 1);
		if (namedReference) {
			result += namedReference.value;
			index = namedReference.end;
			continue;
		}

		result += "&";
		index = ampersandIndex + 1;
	}

	return result;
};

const readNumericCharacterReference = (value: string, index: number) => {
	if (value[index] !== "#") {
		return;
	}

	const isHex = value[index + 1]?.toLowerCase() === "x";
	const digitsStart = index + (isHex ? 2 : 1);
	let digitsEnd = digitsStart;

	while (
		digitsEnd < value.length &&
		(isHex ? /[0-9a-f]/i.test(value[digitsEnd]) : /[0-9]/.test(value[digitsEnd]))
	) {
		digitsEnd += 1;
	}

	if (digitsEnd === digitsStart) {
		return;
	}

	const codePoint = Number.parseInt(value.slice(digitsStart, digitsEnd), isHex ? 16 : 10);
	const end = value[digitsEnd] === ";" ? digitsEnd + 1 : digitsEnd;

	return {
		value: decodeCodePoint(codePoint),
		end,
	};
};

const readNamedCharacterReference = (value: string, index: number) => {
	const maxEnd = Math.min(index + MAX_NAMED_CHARACTER_REFERENCE_LENGTH, value.length);

	for (let end = maxEnd; end > index; end--) {
		const reference = value.slice(index, end);
		const decoded = HTML_NAMED_CHARACTER_REFERENCES[reference];

		if (decoded) {
			return { value: decoded, end };
		}
	}
};

const decodeCodePoint = (codePoint: number) => {
	if (
		!Number.isFinite(codePoint) ||
		codePoint === 0 ||
		codePoint > 0x10ffff ||
		(codePoint >= 0xd800 && codePoint <= 0xdfff)
	) {
		return "\uFFFD";
	}

	return WINDOWS_1252_CONTROL_REFERENCES[codePoint] ?? String.fromCodePoint(codePoint);
};

export const escapeHTMLText = (value: string) =>
	value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const escapeHTMLAttribute = (value: string) =>
	escapeHTMLText(value).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
