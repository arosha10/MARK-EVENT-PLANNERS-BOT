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
    await m.reply('🔄 Generating pairing code for ' + phoneNumber + '...');
    
    // Create session directory if it doesn't exist
    const sessionDir = path.join(__dirname, '../auth_info_baileys', phoneNumber.replace('+', ''));
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    // Generate a pairing code (8 digits like WhatsApp uses)
    const pairingCode = generatePairingCode();
    
    // Save pairing code to a file
    const pairingFile = path.join(sessionDir, 'pairing_code.txt');
    fs.writeFileSync(pairingFile, `Pairing Code: ${pairingCode}\nPhone: ${phoneNumber}\nGenerated: ${new Date().toISOString()}\nStatus: Pending`);

    // Send the pairing code as text
    await robin.sendMessage(from, {
      text: `*🔗 WhatsApp Pairing Code Generated*\n\n📱 Phone: ${phoneNumber}\n🔢 Pairing Code: *${pairingCode}*\n\n📋 Instructions:\n1. Open WhatsApp on your phone\n2. Go to Settings > Linked Devices\n3. Tap "Link a Device"\n4. Enter this code: *${pairingCode}*\n5. Complete the linking process\n\nAfter linking, you'll receive a session ID.`
    }, { quoted: mek });

    // Send a formatted version for easy copying
    await robin.sendMessage(from, {
      text: `*📋 Copy Pairing Code*\n\n\`\`\`${pairingCode}\`\`\`\n\nCopy this code to enter in WhatsApp Link Device.`
    }, { quoted: mek });

    // Send follow-up message after 30 seconds
    setTimeout(async () => {
      try {
        await robin.sendMessage(from, {
          text: `*⏰ Reminder*\n\nHave you completed the device linking with code *${pairingCode}*?\n\nIf yes, you should receive a session ID shortly. If not, please complete the linking process first.`
        }, { quoted: mek });
      } catch (e) {
        console.log('Reminder message failed to send');
      }
    }, 30000);

  } catch (error) {
    console.error('Pairing code generation error:', error);
    await m.reply('❌ Error generating pairing code: ' + error.message);
  }
}); 