# SouthyAI Growth Engine MVP (v0.2)

A low-cost Cloudflare Worker starter for SouthyAI Technologies. Version 0.2 adds section navigation and a Zeely-inspired AI video production-brief studio. It serves a dashboard and provides:
- Public website technical/content audit.
- A conservative same-origin crawl of the homepage and up to 7 internal HTML links.
- Checks for page title, meta description, H1, content length, image alt text, canonical URL, HTTPS, `robots.txt`, and `sitemap.xml`.
- Basic public competitor-page audit.
- Editable campaign drafts for LinkedIn, Facebook, a video ad script, and a prospecting email.
- Optional D1 persistence for audit history and lead tracking.
- Video ad brief builder: creative settings, script, scene storyboard, generation prompt, and downloadable JSON production brief.

## Important limits
This is an MVP, not a finished autonomous marketing platform. It does **not** currently:
- Guarantee ChatGPT or Google rankings.
- Discover new competitors or leads automatically.
- Send emails.
- Publish to social accounts.
- Buy or manage paid ads.
- Render videos. The new video studio prepares production briefs only until an AI video provider is connected.
Those features require properly selected external services, credentials, platform approvals, privacy safeguards, and testing.

## Deploy as a Cloudflare Worker

1. Download and unzip this project.
2. Install Node.js and Wrangler (Cloudflare's command-line tool) on your computer:
   `npm install -g wrangler`
3. Log in:
   `npx wrangler login`
4. From this folder deploy:
   `npx wrangler deploy`
5. Open the Worker URL Cloudflare gives you. The dashboard and `/api/health` should respond.

If you cannot use the command line, create a Worker in Cloudflare Dashboard and paste `src/worker.js` into the editor. Because this Worker embeds the HTML interface, it is a single-file dashboard app.

## Optional: persist reports and leads with D1

1. Create a D1 database in Cloudflare Dashboard, or run:
   `npx wrangler d1 create southyai-growth-engine`
2. Copy the returned database ID into `wrangler.toml` under `[[d1_databases]]`.
3. Uncomment the D1 binding block and ensure `binding = "DB"`.
4. Run:
   `npx wrangler d1 execute southyai-growth-engine --remote --file=schema.sql`
5. Redeploy:
   `npx wrangler deploy`

Without D1, website audits and campaign drafts still work, but saved leads and audit history do not persist.

## Safe use
- Only audit public websites you own or have permission to inspect.
- Crawl limits are intentionally small; do not use this to overload websites or bypass access controls.
- Review generated marketing copy before publication. Do not publish unverified claims.
- Use public business contact information appropriately and follow applicable privacy, anti-spam, POPIA and platform rules.
- Keep API keys out of source code and public repositories. Store secrets as Worker secrets when needed.

## Suggested next build steps
1. Add a reliable search provider for market/competitor discovery.
2. Add an AI provider behind a server-side Worker endpoint for research summaries and tailored content.
3. Add a lead source and CRM workflow with source URL, fit score, and opt-out tracking.
4. Integrate an email service with approval-first sending and rate limits.
5. Integrate an authorised video generation service and social publishing APIs.
6. Add authentication before using this with private lead records. This starter does not yet include dashboard login, so do not store sensitive data in a publicly accessible deployment.
