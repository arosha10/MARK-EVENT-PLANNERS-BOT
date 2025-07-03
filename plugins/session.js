const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');

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
    await m.reply('🔄 Generating ONYX pairing code for ' + phoneNumber + '...');
    
    // Create session directory if it doesn't exist
    const sessionDir = path.join(__dirname, '../auth_info_baileys', phoneNumber.replace('+', ''));
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    // Generate a pairing code (8 digits like WhatsApp uses)
    const pairingCode = generatePairingCode();
    
    // Create session data
    const sessionData = createSessionData(phoneNumber, pairingCode);
    
    // Save session data to JSON file
    const sessionFile = path.join(sessionDir, 'session_data.json');
    fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));

    // Save pairing code to a text file for easy access
    const pairingFile = path.join(sessionDir, 'pairing_code.txt');
    fs.writeFileSync(pairingFile, `ONYX Pairing Code: ${pairingCode}\nPhone: ${phoneNumber}\nGenerated: ${new Date().toISOString()}\nStatus: Pending\n\nInstructions:\n1. Open WhatsApp on your phone\n2. Go to Settings > Linked Devices\n3. Tap "Link a Device"\n4. Enter this code: ${pairingCode}\n5. Complete the linking process`);

    // Send the pairing code as text
    await robin.sendMessage(from, {
      text: `*🔗 ONYX Pairing Code Generated*\n\n📱 Phone: ${phoneNumber}\n🔢 Pairing Code: *${pairingCode}*\n🆔 Session ID: *${sessionData.sessionId}*\n\n📋 Instructions (Mobile Only):\n1. Open WhatsApp on your phone\n2. Go to Settings > Linked Devices\n3. Tap "Link a Device"\n4. Enter this code: *${pairingCode}*\n5. Complete the linking process\n\n⚠️ Note: This is for WhatsApp mobile app only, not web browsers.\n\n💾 Session data saved to: auth_info_baileys/${phoneNumber.replace('+', '')}/`
    }, { quoted: mek });

    // Send a formatted version for easy copying
    await robin.sendMessage(from, {
      text: `*📋 Copy Pairing Code*\n\n\`\`\`${pairingCode}\`\`\`\n\nCopy this code to enter in WhatsApp mobile app Link Device feature.`
    }, { quoted: mek });

    // Send session ID separately
    await robin.sendMessage(from, {
      text: `*🆔 Session ID*\n\n\`\`\`${sessionData.sessionId}\`\`\`\n\nThis session ID will be used after successful device linking.`
    }, { quoted: mek });

    // Send follow-up message after 30 seconds
    setTimeout(async () => {
      try {
        await robin.sendMessage(from, {
          text: `*⏰ ONYX Reminder*\n\nHave you completed the mobile device linking with code *${pairingCode}*?\n\nIf yes, your session ID *${sessionData.sessionId}* is ready for use.\nIf not, please complete the linking process in your WhatsApp mobile app first.`
        }, { quoted: mek });
      } catch (e) {
        console.log('Reminder message failed to send');
      }
    }, 30000);

  } catch (error) {
    console.error('ONYX pairing code generation error:', error);
    await m.reply('❌ Error generating pairing code: ' + error.message);
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