# DASH Starter MERN PWA

## Local

```bash
cd server
cp .env.example .env
npm install
npm start
```

```bash
cd client/dash
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

## GitHub

```bash
git init
git add .
git commit -m "Initial DASH MERN PWA"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Render

Server Web Service:
- Root Directory: server
- Build Command: npm install
- Start Command: npm start
- Environment: MONGO_URI, GOOGLE_SHEET_CSV_URL, CLIENT_URL

Client Static Site:
- Root Directory: client/dash
- Build Command: npm install && npm run build
- Publish Directory: dist
- Environment: VITE_API_URL=https://YOUR_SERVER.onrender.com
