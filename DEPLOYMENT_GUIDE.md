# DASH · Pilot deployment guide

## Active pilot screens
- Tablero general `/dashboard`
- Productos y promociones `/productos-promociones`
- Clientes `/clientes`
- Ventas `/ventas`

All other MVP routes render the shared Coming Soon experience.

## MongoDB Atlas
1. Create an Atlas project/cluster.
2. Create a Database User.
3. Configure Network Access for the environments that need access.
4. Copy the Node.js connection string.
5. Put it in `server/.env` as `MONGO_URI=...`.
6. Start the API and verify `GET /api/health` reports `mongodb: connected`.

Google Sheets remain the source of Casa Margot operational data in this pilot. MongoDB is connected now so DASH can progressively store users, permissions, configuration, notes, imports and future normalized records.

## GitHub
From the `Dash` folder:
```bash
git init
git add .
git commit -m "Prepare DASH Casa Margot pilot deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

## Render
Deploy two services from the same GitHub repository.

### API / Web Service
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check: `/api/health`
- Environment variables: `MONGO_URI`, `CLIENT_URL`, `NODE_ENV=production` and all `CASA_MARGOT_*_CSV_URL` variables.

### Web / Static Site
- Root Directory: `client/dash`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Environment variable: `VITE_API_URL=https://YOUR-API.onrender.com`
- Rewrite rule: `/*` → `/index.html`

After the web URL exists, update the API's `CLIENT_URL` to that exact web URL and redeploy/restart the API.
