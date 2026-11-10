# VPS Deployment Guide: Secure Note-Taking Application

When you are ready to deploy to your VPS, follow these simple steps or share the SSH login credentials (host, user, password/key) so we can deploy it directly.

---

## Option 1: Docker Compose Deployment (Recommended)

1. **Connect to your VPS:**
   ```bash
   ssh root@<YOUR_VPS_IP>
   ```

2. **Clone the repository:**
   ```bash
   git clone <YOUR_GIT_REPO_URL> /var/www/secure-notes
   cd /var/www/secure-notes
   ```

3. **Start the application with MongoDB container:**
   ```bash
   docker compose up -d --build
   ```

4. **Seed initial demo data (Optional):**
   ```bash
   docker compose exec app npm run seed
   ```

5. **Verify:**
   Open `http://<YOUR_VPS_IP>:5000` in your web browser.

---

## Option 2: Direct Node.js + PM2 + MongoDB Service

1. **Install Node.js 20+ and MongoDB on Ubuntu/Debian VPS:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs mongodb
   sudo systemctl enable --now mongodb
   ```

2. **Clone and Install Dependencies:**
   ```bash
   git clone <YOUR_GIT_REPO_URL> /var/www/secure-notes
   cd /var/www/secure-notes
   npm ci --only=production
   ```

3. **Setup Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your desired PORT, MONGO_URI, and JWT_SECRET
   nano .env
   ```

4. **Seed Database:**
   ```bash
   npm run seed
   ```

5. **Start with PM2 Process Manager:**
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name "secure-notes-api"
   pm2 save
   pm2 startup
   ```

6. **(Optional) Configure Nginx Reverse Proxy & SSL:**
   ```nginx
   server {
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

