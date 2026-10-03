# QRMint

QRMint is a client-only QR code creator built with Next.js, TypeScript, Tailwind CSS, and `qr-code-styling`.

## Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
pnpm lint
pnpm build
pnpm run preview:cloudflare
pnpm run deploy:cloudflare
```

## Cloudflare deployment

The app is statically exported by Next.js into `out/` and served by the
`qr-mint` Cloudflare Worker at https://qrmint.ayush.im. Run
`pnpm install --frozen-lockfile` before building. `preview:cloudflare` builds the
export and starts a local Workers preview; `deploy:cloudflare` builds and deploys
the static assets using `wrangler.jsonc`.

GitHub production builds and branch preview deployments require a separate
Workers Builds connection after this migration is merged.

## Notes

- QR generation runs in the browser.
- No backend, accounts, ads, analytics, or local draft history are included in v1.
- PNG and SVG export are generated from the live QR preview.
