import { getGmailClient } from '../google-client.js';

export const gmailTools = [
  {
    name: 'search_emails',
    description: 'Search emails in Gmail using a query string',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Gmail search query (e.g. "from:john subject:meeting")' },
        maxResults: { type: 'number', description: 'Maximum number of results (default 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'read_email',
    description: 'Read the full content of a specific email by ID',
    inputSchema: {
      type: 'object',
      properties: {
        messageId: { type: 'string', description: 'The Gmail message ID' },
      },
      required: ['messageId'],
    },
  },
  {
    name: 'send_email',
    description: 'Send an email via Gmail',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Email subject' },
        body: { type: 'string', description: 'Email body (plain text)' },
        cc: { type: 'string', description: 'CC email address (optional)' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
];

export async function handleGmailTool(name: string, args: Record<string, any>) {
  const gmail = getGmailClient();

  if (name === 'search_emails') {
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: args.query,
      maxResults: args.maxResults || 10,
    });

    const messages = res.data.messages || [];
    if (messages.length === 0) return { content: [{ type: 'text', text: 'No emails found.' }] };

    const summaries = await Promise.all(
      messages.map(async (m) => {
        const msg = await gmail.users.messages.get({ userId: 'me', id: m.id!, format: 'metadata', metadataHeaders: ['Subject', 'From', 'Date'] });
        const headers = msg.data.payload?.headers || [];
        const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)';
        const from = headers.find(h => h.name === 'From')?.value || '(unknown)';
        const date = headers.find(h => h.name === 'Date')?.value || '';
