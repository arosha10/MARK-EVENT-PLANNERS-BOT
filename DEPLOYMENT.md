# 🚀 ONYX MD Bot - GitHub Actions Deployment Guide

## Quick Setup

### 1. **Fork/Clone Repository**
```bash
git clone https://github.com/your-username/ONYX-MD-BOT.git
cd ONYX-MD-BOT
```

### 2. **Set GitHub Secrets**

Go to your repository → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `SESSION_ID` | `D9oGWTKZ%23_FD3OdyM3PAicjH0DyvK4OjTnPKL35xK5V63Lr5MX9Y` | Your MEGA session ID |
| `OWNER_NUM` | `94761676948` | Your WhatsApp number |
| `MEGA_EMAIL` | `your_mega_email@gmail.com` | Your MEGA email |
| `MEGA_PASSWORD` | `your_mega_password` | Your MEGA password |
| `PREFIX` | `.` | Bot command prefix |
| `MODE` | `public` | Bot mode (public/private) |
| `PORT` | `8000` | Main server port |
| `WEB_PORT` | `3000` | Web interface port |

### 3. **Deploy to Railway (Recommended)**

#### Option A: Automatic via GitHub Actions
Add these additional secrets:
- `RAILWAY_TOKEN`: Your Railway token
- `RAILWAY_SERVICE`: Your Railway service name

#### Option B: Manual Railway Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### 4. **Deploy to Render**

1. Connect your GitHub repo to Render
2. Set environment variables in Render dashboard
3. Add `RENDER_WEBHOOK_URL` secret to GitHub

### 5. **Deploy to Heroku**

```bash
# Create Heroku app
heroku create your-onyx-bot

# Set environment variables
heroku config:set SESSION_ID="your_session_id"
heroku config:set OWNER_NUM="your_number"
heroku config:set MEGA_EMAIL="your_email"
heroku config:set MEGA_PASSWORD="your_password"

# Deploy
git push heroku main
```

## GitHub Actions Workflow

The workflow will automatically:

1. ✅ **Install dependencies**
2. ✅ **Create config.env** from secrets
3. ✅ **Test bot startup**
4. ✅ **Create deployment package**
5. ✅ **Deploy to configured platforms**
6. ✅ **Notify deployment status**

## Deployment Platforms

### **Railway** (Recommended)
- Free tier available
- Easy setup
- Automatic deployments
- Good performance

### **Render**
- Free tier available
- Web service support
- Easy environment variable setup

### **Heroku**
- Paid plans only
- Reliable service
- Good documentation

## Post-Deployment

### 1. **Test the Bot**
- Send `.alive` to check if bot is working
- Test pairing system with `.session +your_number`

### 2. **Access Web Interface**
- URL: `https://your-app.railway.app` (Railway)
- URL: `https://your-app.onrender.com` (Render)
- URL: `https://your-app.herokuapp.com` (Heroku)

### 3. **Generate Pairing Codes**
- Use web interface or `.session` command
- Share pairing codes with users
- Monitor session status

## Environment Variables Reference

```env
# Required
SESSION_ID=your_mega_session_id
OWNER_NUM=your_whatsapp_number
MEGA_EMAIL=your_mega_email
MEGA_PASSWORD=your_mega_password

# Optional
PREFIX=.
MODE=public
PORT=8000
WEB_PORT=3000
AUTO_READ_STATUS=true
AUTO_VOICE=true
AUTO_STICKER=true
AUTO_REPLY=true
```

## Troubleshooting

### **Bot not starting**
- Check environment variables
- Verify MEGA credentials
- Check logs in platform dashboard

### **Pairing not working**
- Ensure web interface is accessible
- Check session ID format
- Verify MEGA upload permissions

### **Deployment failed**
- Check GitHub Actions logs
- Verify all secrets are set
- Ensure repository has correct structure

## Support

- **GitHub Issues**: Report bugs and feature requests
- **WhatsApp**: Contact bot owner for support
- **Documentation**: Check README.md for more details

---

## 🎉 Ready to Deploy!

Your ONYX MD bot is now ready for automated deployment via GitHub Actions!

**Next Steps:**
1. Set up GitHub secrets
2. Push to main branch
3. Monitor deployment in Actions tab
4. Test bot functionality
5. Share pairing interface with users 