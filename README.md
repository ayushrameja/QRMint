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

Configure the existing Worker in Settings > Builds:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root directory | `/` |
| Build command | `pnpm run build` |
| Deploy command | `pnpm exec wrangler deploy` |
| Preview command | `pnpm exec wrangler preview` |
| Enable Preview builds | Enabled |
| Build variable `PNPM_VERSION` | `11.3.0` |
| Build variable `NODE_VERSION` | `24` |

After the Git connection and deployment token are configured in Cloudflare,
pushes to `main` deploy production and other branches create Preview URLs.
`deploy:preview` builds and publishes a Preview from the current branch without
changing production. `preview:cloudflare` remains the local preview command.

## Notes

- QR generation runs in the browser.
- No backend, accounts, ads, analytics, or local draft history are included in v1.
- PNG and SVG export are generated from the live QR preview.
