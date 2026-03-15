import { google } from 'googleapis';

export function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return oauth2Client;
}

export function getGmailClient() {
  return google.gmail({ version: 'v1', auth: getOAuth2Client() });
}

export function getCalendarClient() {
  return google.calendar({ version: 'v3', auth: getOAuth2Client() });
}

export function getDriveClient() {
  return google.drive({ version: 'v3', auth: getOAuth2Client() });
}

export function getDocsClient() {
  return google.docs({ version: 'v1', auth: getOAuth2Client() });
}

export function getSheetsClient() {
  return google.sheets({ version: 'v4', auth: getOAuth2Client() });
}
