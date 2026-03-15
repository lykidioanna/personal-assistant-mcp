import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as dotenv from 'dotenv';

import { gmailTools, handleGmailTool } from './tools/gmail.js';
import { calendarTools, handleCalendarTool } from './tools/calendar.js';
import { driveTools, handleDriveTool } from './tools/drive.js';
import { mapsTools, handleMapsTool } from './tools/maps.js';

dotenv.config();

const server = new McpServer({
  name: 'personal-assistant',
  version: '1.0.0',
});

const allTools = [...gmailTools, ...calendarTools, ...driveTools, ...mapsTools];

for (const tool of allTools) {
  server.tool(
    tool.name,
    tool.description,
    tool.inputSchema.properties as any,
    async (args: Record<string, any>) => {
      try {
        if (gmailTools.find(t => t.name === tool.name)) return await handleGmailTool(tool.name, args);
        if (calendarTools.find(t => t.name === tool.name)) return await handleCalendarTool(tool.name, args);
        if (driveTools.find(t => t.name === tool.name)) return await handleDriveTool(tool.name, args);
        if (mapsTools.find(t => t.name === tool.name)) return await handleMapsTool(tool.name, args);
        throw new Error('Tool not found: ' + tool.name);
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: 'Error: ' + error.message }],
          isError: true,
        };
      }
    }
  );
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Personal Assistant MCP server running');
}

main().catch(console.error);
