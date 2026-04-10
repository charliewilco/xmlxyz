---
"@xmlxyz/rsskit": patch
"@xmlxyz/xmlkit": patch
---

Replace RSSKit's `xml2js` dependency with the in-repo `xmlkit` parser/builder so the SDK stays ESM-first and lighter on third-party runtime dependencies.
