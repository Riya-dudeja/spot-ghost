# SpotGhost

Live Demo: [spot-ghost-jobs.vercel.app](https://spot-ghost-jobs.vercel.app)

SpotGhost is a full-stack web application and Chrome extension designed to help users detect and avoid job scams on popular job sites like LinkedIn, Indeed, Glassdoor, and more. It combines instant classic analysis and AI-powered risk assessment for job postings, with results displayed in both the web dashboard and browser extension.

## Features
- **Job Scam Detection:** Analyze job postings for scam indicators using classic rules and Gemini AI.
- **Chrome Extension:** Extracts job data from job sites, runs analysis, and displays results in a side panel.
- **Dashboard:** View your reports, analysis history, and manage your profile.
- **Report Scams:** Submit suspicious jobs for review and help others stay safe.
- **Notifications:** Get alerts for high-risk jobs.
- **Backend API:** Handles job analysis requests, integrates with Gemini AI (requires API key).

## Project Structure
- `app/` — Next.js app directory (pages, API routes, dashboard, authentication)
- `components/` — React components for UI and forms
- `lib/` — Utility libraries (auth, database connection)
- `models/` — Mongoose models for jobs, reports, users
- `public/` — Static assets and icons
- `spot-ghost-extension/` — Chrome extension source code
- `docs/` — Project documentation

## Getting Started
1. **Install dependencies:**
	```bash
	npm install
	# or
	yarn install
	```
2. **Run the development server:**
	```bash
	npm run dev
	# or
	yarn dev
	```
3. **Open the app:**
	Visit [http://localhost:3000](http://localhost:3000) in your browser.

4. **Load the Chrome Extension:**
	- Go to `chrome://extensions` in your browser.
	- Click "Load unpacked" and select the `spot-ghost-extension` folder.

## Environment Variables
- For AI analysis, set your Gemini API key in the backend environment as `API_KEY`.
- Example: On Vercel, add `API_KEY` in your project settings.

## Security Hardening
- Rate Limiting: All public endpoints enforce IP and per-user limits with graceful 429 responses.
- Input Validation: Write/auth endpoints use strict Zod schemas (types, lengths, URL/email checks). Unexpected fields are rejected.
- Sanitization: String inputs are trimmed/normalized to reduce injection risk.
- Authentication: `JWT_SECRET` is only read from environment; cookies are `httpOnly`, `sameSite=lax`, and `secure` in production.
- Keys Management: No secrets in source. Provide keys via environment variables and never expose via `NEXT_PUBLIC_*`.
- OWASP Alignment: Measures mitigate brute-force, unsafe deserialization, and accidental secret exposure.

See `.env.example` for required variables. Rotate credentials regularly.

## Deployment
- Deploy the Next.js app easily on Vercel or your preferred platform.
- The Chrome extension can be published to the Chrome Web Store or loaded unpacked for development.

## Learn More
- [Next.js Documentation](https://nextjs.org/docs)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Gemini API Docs](https://ai.google.dev/)

## License
MIT

## Author
Riya Dudeja
