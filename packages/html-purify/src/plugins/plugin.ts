export interface SanitizerPlugin {
	allowedTags: Set<string>;
	allowedAttributes: Set<string>;
	onTag?: (tag: string, attrs: { [key: string]: string }) => string | void;
	onAttribute?: (attr: string, value: string) => string;
	onText?: (text: string) => string;
}
