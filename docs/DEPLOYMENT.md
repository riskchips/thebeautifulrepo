# Hosted recruitment preview

Live URL: **https://the-ugly-repo.vercel.app**

The Vercel deployment serves `public/` as static assets and rewrites `/api/*` to the single Node.js function in `api/index.mjs`. The adapter invokes the same application handler with `readOnly: true` and includes the fictional JSON seed and workbench metadata in its function bundle.

The preview never opens the writable local store. Saved-data endpoints return HTTP 403 with an explanation to clone and debug locally. GET endpoints, price previews and isolated diagnostics continue to work. The UI labels this mode and disables saved-data actions. No external database or application secrets are needed.

## Local development

`npm ci` then `npm start` runs the complete editable sandbox. The `readOnly` option defaults to false locally. `npm test` checks both modes, including API routing, rejection of saved-data changes, and local persistence.

## Redeploying

Use your own Vercel account for a personal deployment. From the repository root, run `vercel deploy --prod` using the official Vercel CLI and follow its project-linking instructions. The source owner's live preview is not an applicant submission destination. The repository's Vercel settings do not expose the private evaluator kit.

This source deployment was published from the CLI. Vercel Git auto-deploy is not configured by this change; after editing the source, publish a new production deployment explicitly.
