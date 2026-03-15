import { google } from 'googleapis';
import * as http from 'http';
import * as url from 'url';
import * as dotenv from 'dotenv';

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/auth/callback'
);

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent',
});

console.log('\n🔐 Personal Assistant MCP - Auth Setup\n');
console.log('Opening auth URL. If it does not open automatically, paste this into your browser:\n');
console.log(authUrl);
console.log('\nWaiting for authentication...\n');

const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith('/auth/callback')) return;

  const qs = url.parse(req.url, true).query;
  const code = qs.code as string;

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<h1>✅ Auth successful! You can close this tab and return to your terminal.</h1>');

  const { tokens } = await oauth2Client.getToken(code);

  console.log('\n✅ Authentication successful!\n');
  console.log('Add this to your Render environment variables:\n');
  console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);

  server.close();
});

server.listen(3000, () => {
  const { exec } = require('child_process');
  exec(`open "${authUrl}"`);
});
