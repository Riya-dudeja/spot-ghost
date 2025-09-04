# SpotGhost Chrome Extension

SpotGhost is a browser extension designed to help users detect and avoid job scams on popular job sites like LinkedIn, Indeed, Glassdoor, and more. It provides instant classic analysis and AI-powered risk assessment for job postings, displaying results directly in a side panel.

## Features
- **Job Extraction:** Automatically extracts job details from supported job sites.
- **Classic Analysis:** Runs instant risk checks using proven scam indicators and red flags.
- **AI Analysis:** Sends job data to the backend for advanced analysis using Gemini AI (if enabled on backend).
- **Notifications:** Alerts users when high-risk jobs are detected.
- **Side Panel UI:** Displays analysis results, including classic and AI verdicts, flags, and recommendations.
- **Report Scam:** Allows users to report suspicious jobs directly from the extension.

## Folder Structure
- `background.js` — Handles extension events, backend API calls, notifications, and message passing.
- `content.js` — Extracts job data from web pages, runs classic analysis, and communicates with background.
- `sidepanel.js` — Renders the UI for analysis results and user actions.
- `manifest.json` — Chrome extension manifest (MV3), permissions, icons, and entry points.
- `icon.svg` — Extension icon.
- `popup.html`, `popup.js` — Optional popup UI for quick actions.
- `sidepanel.html`, `sidepanel.css` — Side panel UI and styles.
- `content-enhanced.css` — Additional styles for injected overlays.
- `test-page.html` — Test page for development/debugging.

## Setup & Usage
1. **Install Extension:** Load the folder as an unpacked extension in Chrome (chrome://extensions > Load unpacked).
2. **Configure Backend:** Ensure your backend API is deployed and has a valid Gemini API key set as `API_KEY`.
3. **Analyze Jobs:** Visit supported job sites and use the extension to analyze job postings.
4. **View Results:** Open the side panel to see classic and AI analysis, flags, and recommendations.
5. **Report Scams:** Use the "Report This Job" button to submit suspicious postings.

## Development
- Edit scripts and UI files as needed.
- Reload the extension in Chrome after making changes.
- Use the test page for debugging extraction and analysis logic.

## Troubleshooting
- If AI analysis is missing, check backend API key and logs.
- For extraction issues, use console logs in `content.js` and `sidepanel.js`.
- For notification issues, ensure icon files are present and manifest is correct.

## License
MIT

## Author
Riya Dudeja
