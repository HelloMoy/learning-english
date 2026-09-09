# Vendored fonts

`Geist-Regular.woff` and `Geist-ExtraBold.woff` are the two weights the Open
Graph card renders in. They are checked in rather than loaded through
`next/font/google` like the rest of the app, because `ImageResponse` (Satori)
takes fonts as an `ArrayBuffer` and accepts `ttf`, `otf` and `woff` — but **not**
`woff2`, which is the only format `next/font` caches.

Fetching them from Google at render time would work and is not worth a network
round trip on every cold image render.

Geist is licensed under the SIL Open Font License 1.1.
Source: https://fonts.google.com/specimen/Geist
