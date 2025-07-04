# MEGA Setup Instructions

## Why MEGA Integration?

The ONYX MD Bot uses MEGA cloud storage to:
- Store and retrieve WhatsApp session files
- Enable session sharing across different devices
- Provide backup and restore functionality

## Setup Steps

### 1. Create a MEGA Account
1. Go to [mega.nz](https://mega.nz)
2. Click "Create Account"
3. Fill in your details and verify your email
4. Note down your email and password

### 2. Configure Bot
1. Open the `config.env` file
2. Find the MEGA credentials section:
   ```
   # MEGA credentials (for session storage)
   MEGA_EMAIL=your_mega_email@example.com
   MEGA_PASSWORD=your_mega_password
   ```
3. Replace with your actual MEGA credentials
4. Save the file

### 3. Test MEGA Connection
Run the test script to verify your MEGA credentials:
```bash
node test-mega-simple.js
```

### 4. Restart Bot
After setting up MEGA credentials, restart the bot:
```bash
pm2 restart "🌀ONYX MD🔥BOT👾"
```

## Troubleshooting

### "MEGA credentials not configured"
- Make sure you've set MEGA_EMAIL and MEGA_PASSWORD in config.env
- Check that the credentials are correct

### "Failed to connect to MEGA account"
- Verify your email and password are correct
- Check your internet connection
- Ensure MEGA service is accessible

### "Invalid stream received from MEGA"
- This usually means the session file doesn't exist on MEGA
- Use the pairing system instead to create a new session

## Alternative: Use Pairing System

If MEGA setup is problematic, you can use the pairing system:
1. Access the web interface at `http://localhost:8000`
2. Generate a pairing code
3. Use the code to link your WhatsApp account

## Security Notes

- Keep your MEGA credentials secure
- Don't share your config.env file
- Consider using a dedicated MEGA account for the bot 