import { getDriveClient, getDocsClient, getSheetsClient } from '../google-client.js';

export const driveTools = [
  {
    name: 'search_drive',
    description: 'Search for files in Google Drive, Docs, and Sheets',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (file name or content)' },
        fileType: { type: 'string', description: 'Filter by type: doc, sheet, pdf, or leave empty for all' },
        maxResults: { type: 'number', description: 'Maximum number of results (default 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'read_document',
    description: 'Read the content of a Google Doc',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: { type: 'string', description: 'The Google Doc ID (from the URL)' },
      },
      required: ['documentId'],
    },
  },
  {
    name: 'read_spreadsheet',
    description: 'Read data from a Google Sheet',
    inputSchema: {
      type: 'object',
      properties: {
        spreadsheetId: { type: 'string', description: 'The Google Sheets ID (from the URL)' },
        range: { type: 'string', description: 'Cell range to read e.g. Sheet1!A1:E20' },
      },
      required: ['spreadsheetId'],
    },
  },
];

export async function handleDriveTool(name: string, args: Record<string, any>) {
  const drive = getDriveClient();

  if (name === 'search_drive') {
    let mimeFilter = '';
    if (args.fileType === 'doc') mimeFilter = " and mimeType='application/vnd.google-apps.document'";
    else if (args.fileType === 'sheet') mimeFilter = " and mimeType='application/vnd.google-apps.spreadsheet'";
    else if (args.fileType === 'pdf') mimeFilter = " and mimeType='application/pdf'";

    const res = await drive.files.list({
      q: "fullText contains '" + args.query + "'" + mimeFilter + " and trashed=false",
      pageSize: args.maxResults || 10,
      fields: 'files(id, name, mimeType, modifiedTime, webViewLink)',
    });

    const files = res.data.files || [];
    if (files.length === 0) return { content: [{ type: 'text', text: 'No files found.' }] };

    const formatted = files.map(f => {
      let type = '📁 File';
      if (f.mimeType?.includes('document')) type = '📝 Doc';
      else if (f.mimeType?.includes('spreadsheet')) type = '📊 Sheet';
      else if (f.mimeType?.includes('pdf')) type = '📄 PDF';
      return type + ': ' + f.name + '\n   ID: ' + f.id + '\n   Modified: ' + f.modifiedTime + '\n   Link: ' + f.webViewLink;
    });

    return { content: [{ type: 'text', text: formatted.join('\n\n') }] };
  }

  if (name === 'read_document') {
    const docs = getDocsClient();
    const res = await docs.documents.get({ documentId: args.documentId });
    const content = res.data.body?.content || [];

    const text = content.map((block: any) => {
      return block.paragraph?.elements?.map((el: any) => el.textRun?.content || '').join('') || '';
    }).join('');

    return { co
