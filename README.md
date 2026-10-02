<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/6d6a81d6-6ae8-4d6e-aa3a-fc110c7dc874

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Publish shared change data

The site is statically hosted, so importing a CSV in the app only saves it in
that browser. To publish a dataset for everyone:

1. Import the CSV and choose **Export Shared Data**. This downloads a
   `sampleChanges.ts` file containing the current dashboard tickets.
2. Replace `src/data/sampleChanges.ts` in the repository with that downloaded
   file, then commit and push the change. The GitHub Pages deployment publishes
   the new shared dataset.
3. Visitors without a browser-local import will see the committed dataset.
   Browsers with an existing local import continue to use their local data;
   choose **Reset Sample Data** to discard that override and load the latest
   deployed dataset.

Only publish ticket data that is approved to be visible to everyone who can
access the repository and deployed site.
