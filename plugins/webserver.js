const { cmd } = require('../command');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Web server setup
let webServer = null;

// Function to generate pairing codes (8 digits like WhatsApp uses)
function generatePairingCode() {
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
}

// Function to generate session ID (like WhatsApp session IDs)
function generateSessionId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Function to create session data structure
function createSessionData(phoneNumber, pairingCode) {
  return {
    phone: phoneNumber,
    pairingCode: pairingCode,
    sessionId: generateSessionId(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    linkedAt: null,
    deviceInfo: null
  };
}

// Initialize web server
function initializeWebServer(robin) {
  if (webServer) return; // Already initialized

  const app = express();
  const PORT = process.env.WEB_PORT || 3000;

  // Middleware
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));

  // Serve the pairing interface
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pair.html'));
  });

  // API endpoint to generate pairing code
  app.post('/api/generate-pairing', async (req, res) => {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber || !phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
        return res.status(400).json({ error: 'Invalid phone number format' });
      }

      // Generate pairing code
      const pairingCode = generatePairingCode();
      
      // Create session directory
      const sessionDir = path.join(__dirname, '../auth_info_baileys', phoneNumber.replace('+', ''));
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }

      // Create session data
      const sessionData = createSessionData(phoneNumber, pairingCode);
      
      // Save session data
      const sessionFile = path.join(sessionDir, 'session_data.json');
      fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));

      // Save pairing code to text file
      const pairingFile = path.join(sessionDir, 'pairing_code.txt');
      fs.writeFileSync(pairingFile, `ONYX Pairing Code: ${pairingCode}\nPhone: ${phoneNumber}\nGenerated: ${new Date().toISOString()}\nStatus: Pending\n\nInstructions:\n1. Open WhatsApp on your phone\n2. Go to Settings > Linked Devices\n3. Tap "Link a Device"\n4. Enter this code: ${pairingCode}\n5. Complete the linking process`);

      res.json({
        success: true,
        pairingCode: pairingCode,
        sessionId: sessionData.sessionId,
        message: 'Pairing code generated successfully'
      });

    } catch (error) {
      console.error('API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // API endpoint to check session status
  app.get('/api/session-status/:phoneNumber', (req, res) => {
    try {
      const phoneNumber = req.params.phoneNumber;
      const sessionDir = path.join(__dirname, '../auth_info_baileys', phoneNumber.replace('+', ''));
      const sessionFile = path.join(sessionDir, 'session_data.json');

      if (!fs.existsSync(sessionFile)) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
      res.json({
        success: true,
        session: sessionData
      });

    } catch (error) {
      console.error('API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // API endpoint to list all sessions
  app.get('/api/sessions', (req, res) => {
    try {
      const sessionsDir = path.join(__dirname, '../auth_info_baileys');
      const sessions = [];

      if (fs.existsSync(sessionsDir)) {
        const dirs = fs.readdirSync(sessionsDir);
        
        for (const dir of dirs) {
          const sessionFile = path.join(sessionsDir, dir, 'session_data.json');
          if (fs.existsSync(sessionFile)) {
            const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
            sessions.push(sessionData);
          }
        }
      }

      res.json({
        success: true,
        sessions: sessions
      });

    } catch (error) {
      console.error('API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Start server
  webServer = app.listen(PORT, () => {
    console.log(`🌐 ONYX Web Server running on port ${PORT}`);
    console.log(`🔗 Pairing Interface: http://localhost:${PORT}`);
  });

  return webServer;
}

// Command to start web server
cmd({
  pattern: "webserver",
  desc: "Start ONYX web server for pairing interface",
  category: "owner",
  react: "🌐"
}, async (robin, mek, m, { from, body, args, isOwner }) => {
  if (!isOwner) {
    await m.reply('❌ This command is only for bot owner!');
    return;
  }

  try {
    if (webServer) {
      await m.reply('🌐 Web server is already running!');
      return;
    }

    initializeWebServer(robin);
    await m.reply('🌐 ONYX Web Server started successfully!\n\n🔗 Pairing Interface: http://localhost:3000\n📱 Use this interface to generate pairing codes');

  } catch (error) {
    console.error('Web server error:', error);
    await m.reply('❌ Error starting web server: ' + error.message);
  }
});

// Command to stop web server
cmd({
  pattern: "stopserver",
  desc: "Stop ONYX web server",
  category: "owner",
  react: "🛑"
}, async (robin, mek, m, { from, body, args, isOwner }) => {
  if (!isOwner) {
    await m.reply('❌ This command is only for bot owner!');
    return;
  }

  try {
    if (webServer) {
      webServer.close();
      webServer = null;
      await m.reply('🛑 ONYX Web Server stopped successfully!');
    } else {
      await m.reply('❌ Web server is not running!');
    }

  } catch (error) {
    console.error('Stop server error:', error);
    await m.reply('❌ Error stopping web server: ' + error.message);
  }
});

// Command to get web server status
cmd({
  pattern: "serverstatus",
  desc: "Check ONYX web server status",
  category: "public",
  react: "📊"
}, async (robin, mek, m, { from, body, args }) => {
  const status = webServer ? '🟢 Running' : '🔴 Stopped';
  const port = process.env.WEB_PORT || 3000;
  
  await robin.sendMessage(from, {
    text: `*📊 ONYX Web Server Status*\n\n🌐 Status: ${status}\n🔗 Port: ${port}\n🌍 Interface: http://localhost:${port}\n\n${webServer ? '✅ Web server is active and serving the pairing interface' : '❌ Web server is not running. Use .webserver to start it.'}`
  }, { quoted: mek });
});

// Auto-start web server when bot starts (optional)
module.exports = (robin) => {
  // Uncomment the line below to auto-start web server
  // initializeWebServer(robin);
}; 