const { cmd } = require('../command');
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
    await m.reply('🔄 Generating session code for ' + phoneNumber + '...');
    
    // Create session directory if it doesn't exist
    const sessionDir = path.join(__dirname, '../auth_info_baileys', phoneNumber.replace('+', ''));
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    // Generate a unique session code (like FK9M9K1D)
    const sessionCode = generateSessionCode();
    
    // Save session code to a file
    const sessionFile = path.join(sessionDir, 'session_code.txt');
    fs.writeFileSync(sessionFile, `Session Code: ${sessionCode}\nPhone: ${phoneNumber}\nGenerated: ${new Date().toISOString()}`);

    // Send the session code as text
    await robin.sendMessage(from, {
      text: `*🔗 Session Code Generated*\n\n📱 Phone: ${phoneNumber}\n🔑 Session Code: *${sessionCode}*\n📁 Session stored in: auth_info_baileys/${phoneNumber.replace('+', '')}\n\nUse this code to authenticate or link the device.`
    }, { quoted: mek });

    // Send a formatted version for easy copying
    await robin.sendMessage(from, {
      text: `*📋 Copy Code*\n\n\`\`\`${sessionCode}\`\`\`\n\nCopy the code above for easy use.`
    }, { quoted: mek });

  } catch (error) {
    console.error('Session generation error:', error);
    await m.reply('❌ Error generating session: ' + error.message);
  }
}); 