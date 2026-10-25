# IDM Tools — Vercel-ready backend

## Contents
- `server.js`: Express app, also runnable locally.
- `api/index.js`: Vercel Functions entry point.
- `vercel.json`: routes requests to the Express function and includes `projects/**`.
- `public/` and `projects/`: folders reserved for your frontend and project files.

## Deploy
1. Copy your original frontend assets into `public/` (the ZIP you provided did not contain them).
2. Copy the files/folders to browse into `projects/` (also missing from the ZIP you provided).
3. Push the project to a Git repository and import it into Vercel.
4. Set the project root to this folder and deploy.

## Important limitation
This version is read-only on Vercel. It lists and reads files included in the deployment. It does not provide persistent writes, uploads, rename, or delete operations. Serverless local storage is not persistent. Use external object storage or a VPS for persistent file management.

## Local run
`npm install`
`npm start`

Open `http://localhost:8000/api/health`.
