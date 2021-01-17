# Cache It With Vercel

Serve a single asset from [Vercel Edge Network](https://vercel.com/docs/edge-network/caching) with a custom [caching strategy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control).

### Example

[https://cache-it-with.vercel.app/api/cache?_url_=aHR0cHM6Ly9zb3VyY2UudW5zcGxhc2guY29tL2RhaWx5&_s-maxage_=86400&_stale-while-revalidate_](https://cache-it-with.vercel.app/api/cache?url=aHR0cHM6Ly9zb3VyY2UudW5zcGxhc2guY29tL2RhaWx5&s-maxage=86400&stale-while-revalidate)

### Endpoint

[https://cache-it-with.vercel.app/api/cache](https://cache-it-with.vercel.app/api/cache)

### Supported query parameters

- `url` (mandatory) - a [Base64URL](https://en.wikipedia.org/wiki/Base64#Variants_summary_table)-encoded URL of the resource to be cached (encode [here](https://base64.guru/standards/base64url/encode));
- `max-age`, `s-maxage` - a number between `0` and `31536000`;
- `immutable`, `must-revalidate`, `no-cache`, `no-store`, `public`, `stale-while-revalidate` - specify the parameter name to enable the directive (no need to provide a value).
