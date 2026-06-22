import type { SanitizerPlugin } from "./plugin";
import { Srcset } from "../parse-srcset";

export class ImageSanitizerPlugin implements SanitizerPlugin {
	allowedTags = new Set(["img"]);
	allowedAttributes = new Set(["src", "srcset", "alt"]);

	onTag(tag: string, attrs: { [key: string]: string }): string {
		if (this.isAllowedImageURL(attrs.src) && this.isAllowedSrcset(attrs.srcset)) {
			return tag;
		}

		return "";
	}

	private isAllowedSrcset(value: string | undefined) {
		if (!value) {
			return true;
		}

		try {
			const candidates = Srcset.parse(value, { failOnInvalid: true });
			return (
				candidates.length > 0 &&
				candidates.every((candidate) => {
					return typeof candidate.url === "string" && this.isAllowedImageURL(candidate.url);
				})
			);
		} catch {
			return false;
		}
	}

	private isAllowedImageURL(value: string | undefined) {
		if (!value) {
			return false;
		}

		try {
			const url = new URL(value);
			return (
				(url.protocol === "http:" || url.protocol === "https:") &&
				/\.(jpg|jpeg|gif|png)$/i.test(url.pathname)
			);
		} catch {
			return false;
		}
	}
}
