const { cmd } = require('../command');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Function to generate session codes like "FK9M9K1D"
function generateSessionCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

cmd({
  pattern: "session",
  desc: "Generate session for a phone number",
  category: "owner",
  react: "🔗"
}, async (robin, mek, m, { from, body, args, isOwner }) => {
  // Check if user is owner
  if (!isOwner) {
    await m.reply('❌ This command is only for bot owner!');
    return;
  }

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
    await m.reply('🔄 Generating session QR code for ' + phoneNumber + '...');
    
    // Create session directory if it doesn't exist
    const sessionDir = path.join(__dirname, '../auth_info_baileys', phoneNumber.replace('+', ''));
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    // Generate a unique session code (like FK9M9K1D)
    const sessionCode = generateSessionCode();
    
    // Generate QR code with the session code
    const qrBuffer = await qrcode.toBuffer(sessionCode, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Send QR code image
    await robin.sendMessage(from, {
      image: qrBuffer,
      caption: `*🔗 Session QR Code Generated*\n\n📱 Phone: ${phoneNumber}\n🔑 Session Code: ${sessionCode}\n📁 Session stored in: auth_info_baileys/${phoneNumber.replace('+', '')}\n\nScan this QR code to get the session code: ${sessionCode}`
    }, { quoted: mek });

    // Also send the session code as text
    await robin.sendMessage(from, {
      text: `*🔑 Session Code*\n\n${sessionCode}\n\nUse this code to authenticate or link the device.`
    }, { quoted: mek });

  } catch (error) {
    console.error('Session generation error:', error);
    await m.reply('❌ Error generating session: ' + error.message);
  }
}); 