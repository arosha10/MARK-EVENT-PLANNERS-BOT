const { cmd } = require('../command');

cmd({
    pattern: "test",
    desc: "Test if the bot is working",
    category: "general",
    filename: __filename,
}, async (robin, msg, sms, { from, reply }) => {
    try {
        await reply("*✅ Bot is working perfectly!*\n\n🌀ONYX MD🔥BOT👾 is online and ready to serve you.");
    } catch (error) {
        console.error('Test command error:', error);
        await reply("*❌ Bot test failed*\n\nError: " + error.message);
    }
}); 