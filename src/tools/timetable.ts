import axios from 'axios';

export const timetableTools = [
  {
    name: 'get_gym_timetable',
    description: 'Fetch the Virgin Active Clapham class timetable',
    inputSchema: {
      type: 'object',
      properties: {
        day: { type: 'string', description: 'Day to filter by e.g. Monday, Tuesday (optional)' },
        classType: { type: 'string', description: 'Type of class to filter by e.g. yoga, spin, HIIT (optional)' },
      },
    },
  },
];

export async function handleTimetableTool(name: string, args: Record<string, any>) {
  if (name === 'get_gym_timetable') {
    const res = await axios.get('https://www.virginactive.co.uk/clubs/clapham/timetable/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    const html: string = res.data;

    // Extract text content by stripping HTML tags
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Filter by day if specified
    let result = text;
    if (args.day) {
      const day = args.day.toLowerCase();
      const idx = result.toLowerCase().indexOf(day);
      if (idx !== -1) {
        result = result.substring(idx, idx + 3000);
      }
    }

    // Filter by class type if specified
    if (args.classType) {
      const classType = args.classType.toLowerCase();
      const lines = result.split(' ');
      const relevant: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(classType)) {
          const start = Math.max(0, i - 10);
          const end = Math.min(lines.length, i + 20);
          relevant.push(lines.slice(start, end).join(' '));
        }
      }
      result = relevant.length > 0 ? relevant.join('\n\n') : 'No classes found matching: ' + args.classType;
    }

    // Trim to reasonable length
    if (result.length > 4000) {
      result = result.substring(0, 4000) + '...';
    }

    return { content: [{ type: 'text' as const, text: result }] };
  }

  throw new Error('Unknown timetable tool: ' + name);
}
