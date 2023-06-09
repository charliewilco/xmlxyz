interface ParsedUrl {
	isRelativeUrl: boolean;
	url: URL;
}

export function parseUrl(value: string | URL): ParsedUrl {
	if (value instanceof URL) {
		return {
			isRelativeUrl: value.protocol === "relative:",
			url: value,
		};
	}

	value = value.replace(/^(\w+:)?\s*[\\/]\s*[\\/]/, "$1//");
	if (value.startsWith("relative:")) {
		// An attempt to exploit our workaround for base URLs being
		// mandatory for relative URL validation in the WHATWG
		// URL parser, reject it
		throw new Error("relative: exploit attempt");
	}
	// naughtyHref is in charge of whether protocol relative URLs
	// are cool. Here we are concerned just with allowed hostnames and
	// whether to allow relative URLs.
	//
	// Build a placeholder "base URL" against which any reasonable
	// relative URL may be parsed successfully
	let base = "relative://relative-site";
	for (let i = 0; i < 100; i++) {
		base += `/${i}`;
	}

	const parsed = new URL(value, base);

	const isRelativeUrl =
		parsed && parsed.hostname === "relative-site" && parsed.protocol === "relative:";
	return {
		isRelativeUrl,
		url: parsed,
	};
}
