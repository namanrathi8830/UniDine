const localtunnel = require('localtunnel');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

async function setupTunnel() {
  console.log(`Setting up tunnel to localhost:${PORT}...`);
  
  const tunnel = await localtunnel({ port: PORT });
  
  console.log(`Tunnel established at: ${tunnel.url}`);
  console.log(`Use this URL as your Callback URL: ${tunnel.url}/webhook`);
  console.log(`Verify Token: ${process.env.VERIFY_TOKEN}`);
  
  tunnel.on('close', () => {
    console.log('Tunnel closed');
    process.exit(1);
  });
  
  // Keep the process running
  process.on('SIGINT', () => {
    console.log('Closing tunnel...');
    tunnel.close();
    process.exit(0);
  });
}

setupTunnel().catch(err => {
  console.error('Error setting up tunnel:', err);
  process.exit(1);
}); 