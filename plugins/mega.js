const { cmd } = require('../command');
const { File } = require('megajs');
const fs = require('fs');
const path = require('path');

// MEGA account configuration
const MEGA_EMAIL = process.env.MEGA_EMAIL || '';
const MEGA_PASSWORD = process.env.MEGA_PASSWORD || '';

// Function to initialize MEGA client
async function getMegaClient() {
  try {
    if (!MEGA_EMAIL || !MEGA_PASSWORD) {
      throw new Error('MEGA credentials not configured. Please set MEGA_EMAIL and MEGA_PASSWORD environment variables in config.env file.');
    }
    const storage = await File.fromCredentials(MEGA_EMAIL, MEGA_PASSWORD);
    return storage;
  } catch (error) {
    console.error('MEGA client initialization error:', error);
    throw new Error('Failed to connect to MEGA account: ' + error.message);
  }
}

// Function to download file from MEGA
async function downloadFromMega(megaLink, outputPath) {
  try {
    // Validate MEGA link format
    if (!megaLink || !megaLink.includes('mega.nz/file/') || megaLink === 'https://mega.nz/file/') {
      throw new Error('Invalid MEGA link format. Please provide a complete MEGA file link.');
    }
    
    const file = File.fromURL(megaLink);
    
    return new Promise((resolve, reject) => {
      file.download((err, stream) => {
        if (err) {
          reject(new Error(`MEGA download error: ${err.message}`));
          return;
        }
        
        try {
          const writeStream = fs.createWriteStream(outputPath);
          
          // Handle the stream properly
          if (stream && typeof stream.pipe === 'function') {
            stream.pipe(writeStream);
            writeStream.on('finish', () => resolve(outputPath));
            writeStream.on('error', (writeErr) => reject(new Error(`File write error: ${writeErr.message}`)));
            stream.on('error', (streamErr) => reject(new Error(`Stream error: ${streamErr.message}`)));
          } else if (stream && Buffer.isBuffer(stream)) {
            // Handle Buffer data directly
            try {
              fs.writeFileSync(outputPath, stream);
              resolve(outputPath);
            } catch (writeError) {
              reject(new Error(`File write error: ${writeError.message}`));
            }
          } else {
            reject(new Error('Invalid stream received from MEGA'));
          }
        } catch (error) {
          reject(new Error(`Stream setup error: ${error.message}`));
        }
      });
    });
  } catch (error) {
    throw new Error(`Failed to download from MEGA: ${error.message}`);
  }
}

// Function to upload file to MEGA
async function uploadToMega(filePath, fileName) {
  try {
    const storage = await getMegaClient();
    
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(filePath);
      const file = storage.upload({
        name: fileName,
        size: fs.statSync(filePath).size
      }, readStream);
      
      file.on('complete', () => {
        resolve(file.link);
      });
      
      file.on('error', (error) => {
        reject(new Error(`Upload error: ${error.message}`));
      });
      
      readStream.on('error', (error) => {
        reject(new Error(`File read error: ${error.message}`));
      });
    });
  } catch (error) {
    throw new Error(`Failed to upload to MEGA: ${error.message}`);
  }
}

// Command to download file from MEGA
cmd({
  pattern: "megadl",
  desc: "Download file from MEGA link",
  category: "public",
  react: "📥"
}, async (robin, mek, m, { from, body, args }) => {
  if (!args || args.length === 0) {
    await m.reply('❌ Please provide a MEGA link!\n\nExample: .megadl https://mega.nz/file/...');
    return;
  }

  const megaLink = args[0];
  
  if (!megaLink || !megaLink.includes('mega.nz/file/') || megaLink === 'https://mega.nz/file/') {
    await m.reply('❌ Invalid MEGA link! Please provide a complete MEGA file link.\n\nExample: .megadl https://mega.nz/file/abc123#def456');
    return;
  }

  try {
    await m.reply('🔄 Downloading file from MEGA...');
    
    // Create downloads directory
    const downloadsDir = path.join(__dirname, '../downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }
    
    // Generate unique filename
    const fileName = `mega_download_${Date.now()}`;
    const outputPath = path.join(downloadsDir, fileName);
    
    // Download file
    await downloadFromMega(megaLink, outputPath);
    
    // Get file info
    const stats = fs.statSync(outputPath);
    const fileSize = (stats.size / 1024 / 1024).toFixed(2); // MB
    
    // Send file
    await robin.sendMessage(from, {
      document: fs.readFileSync(outputPath),
      fileName: fileName,
      caption: `*📥 MEGA Download Complete*\n\n📁 File: ${fileName}\n📊 Size: ${fileSize} MB\n🔗 Source: MEGA\n\nDownloaded via ONYX MD Bot`
    }, { quoted: mek });
    
    // Clean up
    fs.unlinkSync(outputPath);
    
  } catch (error) {
    console.error('MEGA download error:', error);
    await m.reply('❌ Error downloading from MEGA: ' + error.message);
  }
});

// Command to upload file to MEGA
cmd({
  pattern: "megaupload",
  desc: "Upload file to MEGA and get share link",
  category: "public",
  react: "📤"
}, async (robin, mek, m, { from, body, args }) => {
  if (!m.quoted || !m.quoted.msg) {
    await m.reply('❌ Please reply to a file you want to upload to MEGA!');
    return;
  }

  try {
    await m.reply('🔄 Uploading file to MEGA...');
    
    // Download the quoted file
    const buffer = await m.quoted.download();
    const fileName = m.quoted.msg.fileName || `upload_${Date.now()}`;
    
    // Save temporarily
    const tempPath = path.join(__dirname, '../temp', fileName);
    const tempDir = path.dirname(tempPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    fs.writeFileSync(tempPath, buffer);
    
    // Upload to MEGA
    const megaLink = await uploadToMega(tempPath, fileName);
    
    // Send MEGA link
    await robin.sendMessage(from, {
      text: `*📤 MEGA Upload Complete*\n\n📁 File: ${fileName}\n🔗 MEGA Link: ${megaLink}\n\nUploaded via ONYX MD Bot`
    }, { quoted: mek });
    
    // Clean up
    fs.unlinkSync(tempPath);
    
  } catch (error) {
    console.error('MEGA upload error:', error);
    await m.reply('❌ Error uploading to MEGA: ' + error.message);
  }
});

// Command to get MEGA account info
cmd({
  pattern: "megainfo",
  desc: "Get MEGA account information",
  category: "public",
  react: "ℹ️"
}, async (robin, mek, m, { from, body, args }) => {
  try {
    const storage = await getMegaClient();
    const accountInfo = storage.account;
    
    await robin.sendMessage(from, {
      text: `*ℹ️ MEGA Account Info*\n\n📧 Email: ${accountInfo.email}\n💾 Storage Used: ${(accountInfo.storage.used / 1024 / 1024 / 1024).toFixed(2)} GB\n💾 Storage Total: ${(accountInfo.storage.total / 1024 / 1024 / 1024).toFixed(2)} GB\n📊 Usage: ${((accountInfo.storage.used / accountInfo.storage.total) * 100).toFixed(1)}%\n\nConnected via ONYX MD Bot`
    }, { quoted: mek });
    
  } catch (error) {
    console.error('MEGA info error:', error);
    await m.reply('❌ Error getting MEGA info: ' + error.message);
  }
}); 