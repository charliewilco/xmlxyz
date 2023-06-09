type Field = string[] | string | [string, string, { includeSnippet: true }];

export interface IAllFields {
	feed: Array<Field>;
	item: Array<Field>;
	podcastFeed: Array<Field>;
	podcastItem: Array<Field>;
}

const fields: IAllFields = {
	feed: [],
	item: [],
	podcastFeed: [],
	podcastItem: [],
};

fields.feed = [
	["author", "creator"],
	["dc:publisher", "publisher"],
	["dc:creator", "creator"],
	["dc:source", "source"],
	["dc:title", "title"],
	["dc:type", "type"],
	"title",
	"description",
	"author",
	"pubDate",
	"webMaster",
	"managingEditor",
	"generator",
	"link",
	"language",
	"copyright",
	"lastBuildDate",
	"docs",
	"generator",
	"ttl",
	"rating",
	"skipHours",
	"skipDays",
];

fields.item = [
	["author", "creator"],
	["dc:creator", "creator"],
	["dc:date", "date"],
	["dc:language", "language"],
	["dc:rights", "rights"],
	["dc:source", "source"],
	["dc:title", "title"],
	"title",
	"link",
	"pubDate",
	"author",
	"summary",
	["content:encoded", "content:encoded", { includeSnippet: true }],
	"enclosure",
	"dc:creator",
	"dc:date",
	"comments",
];

var mapItunesField = function (f: string) {
	return ["itunes:" + f, f];
};

fields.podcastFeed = ["author", "subtitle", "summary", "explicit"].map(mapItunesField);

fields.podcastItem = [
	"author",
	"subtitle",
	"summary",
	"explicit",
	"duration",
	"image",
	"episode",
	"image",
	"season",
	"keywords",
].map(mapItunesField);

export { fields };
