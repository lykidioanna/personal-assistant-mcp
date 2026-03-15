import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import * as dotenv from 'dotenv';
import * as http from 'http';

import { gmailTools, handleGmailTool } from './tools/gmail.js';
import { calendarTools, handleCalendarTool } from './tools/calendar.js';
import { driveTools, handleDriveTool } from './tools/drive.js';
import { mapsTools, handleMapsTool } from './tools/maps.js';

dotenv.config();

const server = new McpServer({
  name: 'personal-assistant',
  version: '1.0.0',
});

function registerTool(
  name: string,
  description: string,
  handler: (args: Record<string, any>) => Promise<any>
) {
  server.tool(name, description, {}, async (args: any) => {
    try {
      return await handler(args);
    } catch (error: any) {
      return {
        content: [{ type: 'text' as const, text: 'Error: ' + error.message }],
        isError: true,
      };
    }
  });
}

const allTools = [...gmailTools, ...calendarTools, ...driveTools, ...mapsTools];

for (const tool of allTools) {
  const toolName = tool.name;
  registerTool(toolName, tool.description, async (args: Record<string, any>) => {
    if (gmailTools.find(t => t.name === toolName)) return await handleGmailTool(toolName, args);
    if (calendarTools.find(t => t.name === toolName)) return await handleCalendarTool(toolName, args);
    if (driveTools.find(t => t.name === toolName)) return await handleDriveTool(toolName, args);
    if (mapsTools.find(t => t.name === toolName)) return await handleMapsTool(toolName, args);
    throw new Error('Tool not found: ' + toolName);
  });
}

const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  try {
    const transport = new StreamableHTTPServerTransport({});
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } catch (error: any) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

httpServer.listen(PORT, () => {
  console.log('Personal Assistant MCP server running on port ' + PORT);
});
