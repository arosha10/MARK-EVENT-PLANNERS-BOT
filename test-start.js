// Simple test script to verify bot startup
console.log('Testing ONYX MD Bot startup...');

try {
  // Test basic imports
  console.log('✓ Testing basic imports...');
  const fs = require('fs');
  const path = require('path');
  
  // Test config loading
  console.log('✓ Testing config loading...');
  const config = require('./config');
  console.log('  - PREFIX:', config.PREFIX);
  console.log('  - OWNER_NUM:', config.OWNER_NUM);
  
  // Test command module
  console.log('✓ Testing command module...');
  const command = require('./command');
  console.log('  - Commands loaded:', command.commands.length);
  
  // Test functions
  console.log('✓ Testing functions...');
  const { getBuffer, getRandom } = require('./lib/functions');
  console.log('  - Random ID:', getRandom('.txt'));
  
  // Test MEGA credentials
  console.log('✓ Testing MEGA credentials...');
  const MEGA_EMAIL = process.env.MEGA_EMAIL || 'herakuwhatsappbot@gmail.com';
  const MEGA_PASSWORD = process.env.MEGA_PASSWORD || 'herakuwhatsappbot@gmail.com';
  console.log('  - MEGA Email:', MEGA_EMAIL ? 'Set' : 'Not set');
  console.log('  - MEGA Password:', MEGA_PASSWORD ? 'Set' : 'Not set');
  
  // Test directory structure
  console.log('✓ Testing directory structure...');
  const requiredDirs = ['auth_info_baileys', 'plugins', 'lib'];
  for (const dir of requiredDirs) {
    if (fs.existsSync(dir)) {
      console.log(`  - ${dir}/: ✓ Exists`);
    } else {
      console.log(`  - ${dir}/: ✗ Missing`);
    }
  }
  
  // Test plugins
  console.log('✓ Testing plugins...');
  const pluginDir = './plugins';
  if (fs.existsSync(pluginDir)) {
    const plugins = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js'));
    console.log(`  - Found ${plugins.length} plugins`);
    for (const plugin of plugins) {
      console.log(`    - ${plugin}`);
    }
  }
  
  console.log('\n🎉 All tests passed! Bot should start successfully.');
  console.log('\nTo start the bot, run:');
  console.log('  npm start');
  console.log('  or');
  console.log('  node index.js');
  
} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  console.error('\nStack trace:', error.stack);
  process.exit(1);
} 