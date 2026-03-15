import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import * as dotenv from 'dotenv';
import * as http from 'http';

import { gmailTools, handleGmailTool } from './tools/gmail.js';
import { calendarTools, handleCalendarTool } from './tools/calendar.js';
import { driveTools, handleDriveTool } from './tools/drive.js';
import { mapsTools, handleMapsTool } from './tools/maps.js';
import { timetableTools, handleTimetableTool } from './tools/timetable.js';

dotenv.config();

type TextContent = { type: 'text'; text: string };
type ToolResult = { content: TextContent[]; isError?: boolean };

async function callTool(toolName: string, args: Record<string, any>): Promise<ToolResult> {
  try {
    let result: any;
    if (gmailTools.find(t => t.name === toolName)) {
      result = await handleGmailTool(toolName, args);
    } else if (calendarTools.find(t => t.name === toolName)) {
      result = await handleCalendarTool(toolName, args);
    } else if (driveTools.find(t => t.name === toolName)) {
      result = await handleDriveTool(toolName, args);
    } else if (mapsTools.find(t => t.name === toolName)) {
      result = await handleMapsTool(toolName, args);
    } else if (timetableTools.find(t => t.name === toolName)) {
      result = await handleTimetableTool(toolName, args);
    } else {
      throw new Error('Tool not found: ' + toolName);
    }
    return {
      content: result.content.map((c: any) => ({ type: 'text' as const, text: String(c.text) })),
    };
  } catch (error: any) {
    return {
      content: [{ type: 'text' as const, text: 'Error: ' + error.message }],
      isError: true,
    };
  }
}

function createServer() {
  const server = new McpServer({
    name: 'personal-assistant',
    version: '1.0.0',
  });

  const allTools = [...gmailTools, ...calendarTools, ...driveTools, ...mapsTools, ...timetableTools];

  for (const tool of allTools) {
    const toolName = tool.name;
    server.tool(
      toolName,
      tool.description,
      {},
      async (_args: any): Promise<ToolResult> => {
        return callTool(toolName, _args);
      }
    );
  }

  return server;
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
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({});
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } catch (error: any) {
    console.error('Request error:', error.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

httpServer.listen(PORT, () => {
  console.log('Personal Assistant MCP server running on port ' + PORT);
});
