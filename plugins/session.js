const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');
const { File } = require('megajs');
const { exec } = require('child_process');
const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  delay,
  makeCacheableSignalKeyStore,
  Browsers,
  jidNormalizedUser,
} = require("@whiskeysockets/baileys");

// MEGA account configuration
const MEGA_EMAIL = process.env.MEGA_EMAIL || 'herakuwhatsappbot@gmail.com';
const MEGA_PASSWORD = process.env.MEGA_PASSWORD || 'herakuwhatsappbot@gmail.com';

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

// Function to remove file/directory
function removeFile(FilePath) {
  if (!fs.existsSync(FilePath)) return false;
  fs.rmSync(FilePath, { recursive: true, force: true });
}

// Function to generate random MEGA ID
function randomMegaId(length = 6, numberLength = 4) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  const number = Math.floor(Math.random() * Math.pow(10, numberLength));
  return `${result}${number}`;
}

// Function to upload to MEGA
async function uploadToMega(fileStream, fileName) {
  try {
    const { File } = require('megajs');
    const storage = await File.fromCredentials(MEGA_EMAIL, MEGA_PASSWORD);
    const file = storage.upload({
      name: fileName,
      size: fs.statSync(fileStream.path).size
    }, fileStream);
    
    return file.link;
  } catch (error) {
    throw new Error(`Failed to upload to MEGA: ${error.message}`);
  }
}

// Function to handle pairing process
async function handlePairing(phoneNumber, pairingCode, robin, from) {
  let pairingTimeout;
  
  try {
    // Set a timeout for the entire pairing process
    pairingTimeout = setTimeout(async () => {
      console.log('Pairing process timed out');
      await robin.sendMessage(from, {
        text: `⏰ Pairing process timed out. Please try again with:\n\n.pair ${phoneNumber}`
      }, { quoted: null });
      
      // Clean up
      const tempSessionDir = path.join(__dirname, '../temp_session');
      if (fs.existsSync(tempSessionDir)) {
        removeFile(tempSessionDir);
      }
    }, 120000); // 2 minutes timeout
    
    // Create session directory
    const sessionDir = path.join(__dirname, '../auth_info_baileys', phoneNumber.replace('+', ''));
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    // Create temporary session directory for pairing
    const tempSessionDir = path.join(__dirname, '../temp_session');
    if (fs.existsSync(tempSessionDir)) {
      removeFile(tempSessionDir);
    }
    fs.mkdirSync(tempSessionDir, { recursive: true });

    // Initialize WhatsApp connection for pairing
    const { state, saveCreds } = await useMultiFileAuthState(tempSessionDir);
    
    const RobinPairWeb = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(
          state.keys,
          pino({ level: "fatal" }).child({ level: "fatal" })
        ),
      },
      printQRInTerminal: false,
      logger: pino({ level: "fatal" }).child({ level: "fatal" }),
      browser: Browsers.macOS("Safari"),
      version: [2, 2323, 4],
      syncFullHistory: false,
      connectTimeoutMs: 60000,
      qrTimeout: 40000,
    });

    RobinPairWeb.ev.on("creds.update", saveCreds);
    
    RobinPairWeb.ev.on("connection.update", async (s) => {
      const { connection, lastDisconnect } = s;
      console.log('Connection update:', connection);
      
      if (connection === "open") {
        try {
          console.log('Connection opened successfully');
          await delay(3000);
          
          // Check if user is registered
          if (!RobinPairWeb.authState.creds.registered) {
            console.log('User not registered, requesting pairing code');
            const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");
            
            try {
              const code = await RobinPairWeb.requestPairingCode(cleanNumber);
              console.log('Pairing code generated:', code);
              
              // Send pairing code to user
              await robin.sendMessage(from, {
                text: `*🔗 ONYX Pairing Code Generated*\n\n📱 Phone: ${phoneNumber}\n🔢 Pairing Code: *${code}*\n\n📋 Instructions:\n1. Open WhatsApp on your phone\n2. Go to Settings > Linked Devices\n3. Tap "Link a Device"\n4. Enter this code: *${code}*\n5. Complete the linking process\n\n⚠️ Note: After linking, a Safari web link will appear and the session ID will be sent to the bot owner.`
              }, { quoted: null });

              // Save initial session data
              const sessionData = createSessionData(phoneNumber, code);
              const sessionFile = path.join(sessionDir, 'session_data.json');
              fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
              
              // Wait for registration to complete
              console.log('Waiting for user to complete pairing...');
              await delay(45000); // Increased wait time
            } catch (codeError) {
              console.error('Error requesting pairing code:', codeError);
              await robin.sendMessage(from, {
                text: `❌ Error requesting pairing code: ${codeError.message}`
              }, { quoted: null });
              return;
            }
          }
          
          // Check if now registered
          if (RobinPairWeb.authState.creds.registered) {
            console.log('User registered, processing session');
            await delay(3000);
            
            // Read session credentials
            const sessionPrabath = fs.readFileSync(path.join(tempSessionDir, "creds.json"));
            const user_jid = jidNormalizedUser(RobinPairWeb.user.id);

            // Upload session to MEGA
            const mega_url = await uploadToMega(
              fs.createReadStream(path.join(tempSessionDir, "creds.json")),
              `${randomMegaId()}.json`
            );

            const string_session = mega_url.replace("https://mega.nz/file/", "");

            // Send session ID to owner
            const ownerNumber = process.env.OWNER_NUM || "94761676948";
            const sid = `*🌀ONYX MD🔥BOT👾*\n\n> *ONYX MD වෙත ඔබව සාදරයෙන් පිලිගනිමු!*\n> *Welcome to ONYX MD!*\n> *ONYX MDக்கு வருக!*\n\n📱 Phone: ${phoneNumber}\n🔢 Pairing Code: ${pairingCode || 'Generated'}\n\n👉 ${string_session} 👈\n\n*This is the Session ID, copy this id and paste into config.js file*\n\n*You can contact bot owner*\n\n*http://wa.me/94761676948*\n\n*You can join my whatsapp group*\n\n*https://chat.whatsapp.com/IT6mjqGINN6LaLSKnTZd6r*\n\n> *By Arosh Samuditha*`;
            
            const mg = `🛑 *Do not share this code to anyone* 🛑`;

            // Send session info to owner
            await robin.sendMessage(ownerNumber + '@s.whatsapp.net', {
              image: {
                url: "https://raw.githubusercontent.com/aroshsamuditha/ONYX-MEDIA/refs/heads/main/oNYX%20bOT.jpg",
              },
              caption: sid,
            });

            await robin.sendMessage(ownerNumber + '@s.whatsapp.net', {
              text: string_session,
            });

            await robin.sendMessage(ownerNumber + '@s.whatsapp.net', {
              text: mg,
            });

            // Update session data
            const sessionData = createSessionData(phoneNumber, pairingCode || 'Generated');
            sessionData.sessionId = string_session;
            sessionData.status = 'linked';
            sessionData.linkedAt = new Date().toISOString();
            
            const sessionFile = path.join(sessionDir, 'session_data.json');
            fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));

            // Send success message to user
            await robin.sendMessage(from, {
              text: `*✅ Pairing Successful!*\n\n📱 Phone: ${phoneNumber}\n🔢 Pairing Code: ${pairingCode || 'Generated'}\n\nYour session has been successfully linked and the session ID has been sent to the bot owner.`
            }, { quoted: null });

            // Clean up
            clearTimeout(pairingTimeout);
            await delay(1000);
            removeFile(tempSessionDir);
            RobinPairWeb.end();
          } else {
            console.log('User still not registered after waiting');
            await robin.sendMessage(from, {
              text: `❌ Pairing failed: User not registered. Please try again with the command:\n\n.pair ${phoneNumber}`
            }, { quoted: null });
            
            // Clean up
            clearTimeout(pairingTimeout);
            removeFile(tempSessionDir);
            RobinPairWeb.end();
          }

        } catch (e) {
          console.error('Pairing error:', e);
          await robin.sendMessage(from, {
            text: `❌ Error during pairing process: ${e.message}`
          }, { quoted: null });
          
          // Clean up on error
          clearTimeout(pairingTimeout);
          removeFile(tempSessionDir);
          RobinPairWeb.end();
        }
        
      } else if (connection === "close") {
        console.log('Connection closed:', lastDisconnect?.error?.message);
        if (lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
          await delay(5000);
          console.log('Attempting to reconnect...');
          // Don't recursively call handlePairing to avoid infinite loops
        }
      } else if (connection === "connecting") {
        console.log('Connecting to WhatsApp...');
      }
    });

    // Initial check for registration
    await delay(2000);
    if (!RobinPairWeb.authState.creds.registered) {
      console.log('Initial check: User not registered');
      const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");
      try {
        const code = await RobinPairWeb.requestPairingCode(cleanNumber);
        console.log('Pairing code requested:', code);
        
        // Send pairing code to user
        await robin.sendMessage(from, {
          text: `*🔗 ONYX Pairing Code Generated*\n\n📱 Phone: ${phoneNumber}\n🔢 Pairing Code: *${code}*\n\n📋 Instructions:\n1. Open WhatsApp on your phone\n2. Go to Settings > Linked Devices\n3. Tap "Link a Device"\n4. Enter this code: *${code}*\n5. Complete the linking process\n\n⚠️ Note: After linking, a Safari web link will appear and the session ID will be sent to the bot owner.`
        }, { quoted: null });

        // Save initial session data
        const sessionData = createSessionData(phoneNumber, code);
        const sessionFile = path.join(sessionDir, 'session_data.json');
        fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
      } catch (codeError) {
        console.error('Error requesting pairing code:', codeError);
        await robin.sendMessage(from, {
          text: `❌ Error requesting pairing code: ${codeError.message}`
        }, { quoted: null });
      }
    }

  } catch (err) {
    console.error('Pairing process error:', err);
    await robin.sendMessage(from, {
      text: `❌ Error in pairing process: ${err.message}`
    }, { quoted: null });
    
    // Clean up on error
    clearTimeout(pairingTimeout);
    const tempSessionDir = path.join(__dirname, '../temp_session');
    if (fs.existsSync(tempSessionDir)) {
      removeFile(tempSessionDir);
    }
  }
}

cmd({
  pattern: "session",
  desc: "Generate pairing code for WhatsApp Link Device",
  category: "public",
  react: "🔗"
}, async (robin, mek, m, { from, body, args }) => {

  // Check if phone number is provided
  if (!args || args.length === 0) {
    await m.reply('❌ Please provide a phone number!\n\nExample: .session +94761676948');
    return;
  }

  const phoneNumber = args[0];
  
  // Validate phone number format
  if (!phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
    await m.reply('❌ Invalid phone number format!\n\nPlease use format: +94761676948');
    return;
  }

  try {
    await m.reply('🔄 Starting ONYX pairing process for ' + phoneNumber + '...');
    
    // Start the pairing process
    await handlePairing(phoneNumber, null, robin, from);

  } catch (error) {
    console.error('ONYX pairing error:', error);
    await m.reply('❌ Error in pairing process: ' + error.message);
  }
});

// Command to check session status
cmd({
  pattern: "sessionstatus",
  desc: "Check session status for a phone number",
  category: "public",
  react: "📊"
}, async (robin, mek, m, { from, body, args }) => {
  if (!args || args.length === 0) {
    await m.reply('❌ Please provide a phone number!\n\nExample: .sessionstatus +94761676948');
    return;
  }

  const phoneNumber = args[0];
  const sessionDir = path.join(__dirname, '../auth_info_baileys', phoneNumber.replace('+', ''));
  const sessionFile = path.join(sessionDir, 'session_data.json');

  if (!fs.existsSync(sessionFile)) {
    await m.reply('❌ No session found for ' + phoneNumber);
    return;
  }

  try {
    const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
    const status = sessionData.status === 'pending' ? '⏳ Pending' : '✅ Linked';
    
    await robin.sendMessage(from, {
      text: `*📊 ONYX Session Status*\n\n📱 Phone: ${sessionData.phone}\n🔢 Pairing Code: ${sessionData.pairingCode}\n🆔 Session ID: ${sessionData.sessionId}\n📈 Status: ${status}\n📅 Created: ${new Date(sessionData.createdAt).toLocaleString()}\n${sessionData.linkedAt ? `🔗 Linked: ${new Date(sessionData.linkedAt).toLocaleString()}` : ''}`
    }, { quoted: mek });
  } catch (error) {
    await m.reply('❌ Error reading session data: ' + error.message);
  }
}); 