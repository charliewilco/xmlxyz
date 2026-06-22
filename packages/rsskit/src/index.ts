import { Parser, type Options as XMLParserOptions } from "@xmlxyz/xmlkit";
import { copyFromXML, getLink, isJSON, getSnippet, getContent } from "./utils";
import { fields, type Field, type FieldOptions } from "./fields";

export const DEFAULT_HEADERS = {
	"User-Agent": "rss-parser",
	Accept: "application/rss+xml",
};
export type CustomField = Field;

export type CustomFieldOptions = FieldOptions;

export interface CustomFields {
	feed?: CustomField[];
	item?: CustomField[];
}

export interface ParserOptions {
	xml2js?: XMLParserOptions;
	defaultRSS?: number;
	customFields?: CustomFields;
}

export interface Enclosure {
	url: string;
	length?: number;
	type?: string;
}

export interface RSSItem {
	link?: string;
	guid?: string;
	title?: string;
	pubDate?: string;
	creator?: string;
	summary?: string;
	content?: string;
	isoDate?: string;
	categories?: string[];
	contentSnippet?: string;
	enclosure?: Enclosure;
	media?: MediaRSS;
}

export interface MediaContent {
	url?: string;
	type?: string;
	medium?: string;
	width?: string;
	height?: string;
	fileSize?: string;
	expression?: string;
	bitrate?: string;
	duration?: string;
	lang?: string;
	title?: string;
	description?: string;
	credit?: string;
}

export interface MediaThumbnail {
	url?: string;
	width?: string;
	height?: string;
	time?: string;
}

export interface MediaRSS {
	content?: MediaContent[];
	thumbnails?: MediaThumbnail[];
	title?: string;
	description?: string;
	credit?: string;
}

export interface PaginationLinks {
	self?: string;
	first?: string;
	next?: string;
	last?: string;
	prev?: string;
}

export interface RSSOutput<U> {
	image?: {
		link?: string;
		url: string;
		title?: string;
	};
	paginationLinks?: PaginationLinks;
	link?: string;
	title?: string;
	items: (U & RSSItem)[];
	feedUrl?: string;
	description?: string;
	itunes?: {
		[key: string]: any;
		image?: string;
		owner?: {
			name?: string;
			email?: string;
		};
		author?: string;
		summary?: string;
		explicit?: string;
		categories?: string[];
		keywords?: string[];
	};
}

export class RSSKit<T = Record<string, unknown>, U = Record<string, unknown>> {
	public options: ParserOptions;
	public xmlParser: Parser;
	constructor(options: ParserOptions = {}) {
		options.xml2js = options.xml2js || {};

		this.options = options;
		this.xmlParser = new Parser(this.options.xml2js);
	}

	private xmlParseToAsync<T>(xml: string) {
		return new Promise<T>((resolve, reject) => {
			this.xmlParser.parseString(xml, (err: any, result: any) => {
				if (err) return reject(err);
				if (!result) {
					return reject(new Error("Unable to parse XML."));
				}

				return resolve(result);
			});
		});
	}

	public async parse(xml: string): Promise<T & RSSOutput<U>> {
		if (isJSON(xml)) {
			return JSON.parse(xml);
		}

		const result = await this.xmlParseToAsync<any>(xml);

		let feed = null;
		if (result.feed) {
			feed = this.buildAtomFeed(result);
		} else if (
			result.rss &&
			result.rss.$ &&
			result.rss.$.version &&
			result.rss.$.version.match(/^2/)
		) {
			feed = this.buildRSS2(result);
		} else if (result["rdf:RDF"]) {
			feed = this.buildRSS1(result);
		} else if (
			result.rss &&
			result.rss.$ &&
			result.rss.$.version &&
			result.rss.$.version.match(/0\.9/)
		) {
			feed = this.buildRSS0_9(result);
		} else if (result.rss && this.options.defaultRSS) {
			switch (this.options.defaultRSS) {
				case 0.9:
					feed = this.buildRSS0_9(result);
					break;
				case 1:
					feed = this.buildRSS1(result);
					break;
				case 2:
					feed = this.buildRSS2(result);
					break;
				default:
					throw new Error("default RSS version not recognized.");
			}
		} else {
			throw new Error("Feed not recognized as RSS 1 or 2.");
		}
		return feed;
	}

	private buildAtomFeed(xmlObj: any) {
		let feed: any = { items: [] };
		copyFromXML(xmlObj.feed, feed, this.feedFields);
		if (xmlObj.feed.link) {
			feed.link = getLink(xmlObj.feed.link, "alternate", 0);
			feed.feedUrl = getLink(xmlObj.feed.link, "self", 1);
		}
		if (xmlObj.feed.title) {
			let title = xmlObj.feed.title[0] || "";
			if (title._) title = title._;
			if (title) feed.title = title;
		}
		if (xmlObj.feed.updated) {
			feed.lastBuildDate = xmlObj.feed.updated[0];
		}
		feed.items = (xmlObj.feed.entry || []).map((entry: any) => this.parseItemAtom(entry));
		return feed;
	}

	private parseItemAtom(entry?: any) {
		let item: any = {};
		copyFromXML(entry, item, this.itemFields);
		if (entry.title) {
			let title = entry.title[0] || "";
			if (title._) title = title._;
			if (title) item.title = title;
		}
		if (entry.link && entry.link.length) {
			item.link = getLink(entry.link, "alternate", 0);
		}
		if (entry.published && entry.published.length && entry.published[0].length)
			item.pubDate = new Date(entry.published[0]).toISOString();
		if (!item.pubDate && entry.updated && entry.updated.length && entry.updated[0].length)
			item.pubDate = new Date(entry.updated[0]).toISOString();
		if (
			entry.author &&
			entry.author.length &&
			entry.author[0].name &&
			entry.author[0].name.length
		)
			item.author = entry.author[0].name[0];
		if (entry.content && entry.content.length) {
			item.content = getContent(entry.content[0]);
			item.contentSnippet = getSnippet(item.content);
		}
		if (entry.summary && entry.summary.length) {
			item.summary = getContent(entry.summary[0]);
		}
		if (entry.id) {
			item.id = entry.id[0];
		}
		this.decorateMedia(item, entry);
		this.setISODate(item);
		return item;
	}

	private buildRSS0_9(xmlObj: any) {
		var channel = xmlObj.rss.channel[0];
		var items = channel.item;
		return this.buildRSS(channel, items);
	}

	private buildRSS1(xmlObj: any) {
		xmlObj = xmlObj["rdf:RDF"];
		let channel = xmlObj.channel[0];
		let items = xmlObj.item;
		return this.buildRSS(channel, items);
	}

	private buildRSS2(xmlObj: any) {
		let channel = xmlObj.rss.channel[0];
		let items = channel.item;
		let feed = this.buildRSS(channel, items);
		if (xmlObj.rss.$ && xmlObj.rss.$["xmlns:itunes"]) {
			this.decorateItunes(feed, channel);
		}
		return feed;
	}

	private buildRSS(channel: any, items: any[]) {
		items = items || [];
		let feed: any = { items: [] };
		let feedFields = this.feedFields;
		let itemFields = this.itemFields;
		if (channel["atom:link"] && channel["atom:link"][0] && channel["atom:link"][0].$) {
			feed.feedUrl = channel["atom:link"][0].$.href;
		}
		if (channel.image && channel.image[0] && channel.image[0].url) {
			feed.image = {};
			let image = channel.image[0];
			if (image.link) feed.image.link = image.link[0];
			if (image.url) feed.image.url = image.url[0];
			if (image.title) feed.image.title = image.title[0];
			if (image.width) feed.image.width = image.width[0];
			if (image.height) feed.image.height = image.height[0];
		}
		const paginationLinks = this.generatePaginationLinks(channel);
		if (Object.keys(paginationLinks).length) {
			feed.paginationLinks = paginationLinks;
		}
		copyFromXML(channel, feed, feedFields);
		feed.items = items.map((xmlItem: string) => this.parseItemRss(xmlItem, itemFields));
		return feed;
	}

	private parseItemRss(xmlItem: any, itemFields: any[]) {
		let item: any = {};
		copyFromXML(xmlItem, item, itemFields);
		if (xmlItem.enclosure) {
			item.enclosure = xmlItem.enclosure[0].$;
		}
		if (xmlItem.description) {
			item.content = getContent(xmlItem.description[0]);
			item.contentSnippet = getSnippet(item.content);
		}
		if (xmlItem.guid) {
			item.guid = xmlItem.guid[0];
			if (item.guid._) item.guid = item.guid._;
		}
		if (xmlItem.category) item.categories = xmlItem.category;
		this.decorateMedia(item, xmlItem);
		this.setISODate(item);
		return item;
	}

	private decorateMedia(item: any, xmlItem: any) {
		const media: MediaRSS = {};

		const mediaContent = this.mapMediaNodes<MediaContent>(xmlItem["media:content"]);
		if (mediaContent.length) {
			media.content = mediaContent;
		}

		const thumbnails = this.mapMediaNodes<MediaThumbnail>(xmlItem["media:thumbnail"]);
		if (thumbnails.length) {
			media.thumbnails = thumbnails;
		}

		const title = this.getXMLText(xmlItem["media:title"]?.[0]);
		if (title) {
			media.title = title;
		}

		const description = this.getXMLText(xmlItem["media:description"]?.[0]);
		if (description) {
			media.description = description;
		}

		const credit = this.getXMLText(xmlItem["media:credit"]?.[0]);
		if (credit) {
			media.credit = credit;
		}

		if (Object.keys(media).length) {
			item.media = media;
		}
	}

	private mapMediaNodes<T extends object>(nodes: any[] | undefined): T[] {
		return (nodes || []).map((node) => {
			const value: Record<string, string> = { ...(node.$ || {}) };
			const title = this.getXMLText(node["media:title"]?.[0]);
			const description = this.getXMLText(node["media:description"]?.[0]);
			const credit = this.getXMLText(node["media:credit"]?.[0]);

			if (title) {
				value.title = title;
			}
			if (description) {
				value.description = description;
			}
			if (credit) {
				value.credit = credit;
			}

			return value as T;
		});
	}

	private getXMLText(value: any): string | undefined {
		if (typeof value === "string") {
			return value;
		}

		if (value && typeof value._ === "string") {
			return value._;
		}
	}

	/**
	 * Add iTunes specific fields from XML to extracted JSON
	 *
	 * @access public
	 * @param {object} feed extracted
	 * @param {object} channel parsed XML
	 */
	private decorateItunes(feed: any, channel: any) {
		let items = channel.item || [];
		feed.itunes = {};

		if (channel["itunes:owner"]) {
			let owner: any = {};

			if (channel["itunes:owner"][0]["itunes:name"]) {
				owner.name = channel["itunes:owner"][0]["itunes:name"][0];
			}
			if (channel["itunes:owner"][0]["itunes:email"]) {
				owner.email = channel["itunes:owner"][0]["itunes:email"][0];
			}
			feed.itunes.owner = owner;
		}

		if (channel["itunes:image"]) {
			let image;
			let hasImageHref =
				channel["itunes:image"][0] &&
				channel["itunes:image"][0].$ &&
				channel["itunes:image"][0].$.href;
			image = hasImageHref ? channel["itunes:image"][0].$.href : null;
			if (image) {
				feed.itunes.image = image;
			}
		}

		if (channel["itunes:category"]) {
			const categoriesWithSubs = channel["itunes:category"].map((category: any) => {
				return {
					name: category && category.$ && category.$.text,
					subs: category["itunes:category"]
						? category["itunes:category"].map((subcategory: any) => ({
								name: subcategory && subcategory.$ && subcategory.$.text,
							}))
						: null,
				};
			});

			feed.itunes.categories = categoriesWithSubs.map((category: any) => category.name);
			feed.itunes.categoriesWithSubs = categoriesWithSubs;
		}

		if (channel["itunes:keywords"]) {
			if (channel["itunes:keywords"].length > 1) {
				feed.itunes.keywords = channel["itunes:keywords"].map(
					(keyword: any) => keyword && keyword.$ && keyword.$.text,
				);
			} else {
				let keywords = channel["itunes:keywords"][0];
				if (keywords && typeof keywords._ === "string") {
					keywords = keywords._;
				}

				if (keywords && keywords.$ && keywords.$.text) {
					feed.itunes.keywords = keywords.$.text.split(",");
				} else if (typeof keywords === "string") {
					feed.itunes.keywords = keywords.split(",");
				}
			}
		}

		copyFromXML(channel, feed.itunes, fields.podcastFeed);
		items.forEach((item: any, index: number) => {
			let entry = feed.items[index];
			entry.itunes = {};
			copyFromXML(item, entry.itunes, fields.podcastItem);
			let image = item["itunes:image"];
			if (image && image[0] && image[0].$ && image[0].$.href) {
				entry.itunes.image = image[0].$.href;
			}
		});
	}

	private setISODate(item: any) {
		let date = item.pubDate || item.date;
		if (date) {
			try {
				item.isoDate = new Date(date.trim()).toISOString();
			} catch (e) {
				// Ignore bad date format
			}
		}
	}

	/**
	 * Generates a pagination object where the rel attribute is the key and href attribute is the value
	 *  { self: 'self-url', first: 'first-url', ...  }
	 *
	 * @access private
	 * @param {Object} channel parsed XML
	 * @returns {Object}
	 */
	private generatePaginationLinks(channel: any) {
		if (!channel["atom:link"]) {
			return {};
		}
		const paginationRelAttributes = ["self", "first", "next", "prev", "last"];

		return channel["atom:link"].reduce((paginationLinks: any, link: any) => {
			if (!link.$ || !paginationRelAttributes.includes(link.$.rel)) {
				return paginationLinks;
			}
			paginationLinks[link.$.rel] = link.$.href;
			return paginationLinks;
		}, {});
	}

	private get feedFields() {
		return [...fields.feed, ...(this.options.customFields?.feed || [])];
	}

	private get itemFields() {
		return [...fields.item, ...(this.options.customFields?.item || [])];
	}
}
