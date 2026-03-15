import { getCalendarClient } from '../google-client.js';

export const calendarTools = [
  {
    name: 'list_events',
    description: 'List upcoming calendar events',
    inputSchema: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Number of days ahead to look (default 7)' },
        maxResults: { type: 'number', description: 'Maximum number of events (default 20)' },
      },
    },
  },
  {
    name: 'create_event',
    description: 'Create a new calendar event',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Event title' },
        startDateTime: { type: 'string', description: 'Start date/time in ISO format (e.g. 2025-04-01T10:00:00)' },
        endDateTime: { type: 'string', description: 'End date/time in ISO format' },
        description: { type: 'string', description: 'Event description (optional)' },
        location: { type: 'string', description: 'Event location (optional)' },
        attendees: { type: 'string', description: 'Comma-separated attendee emails (optional)' },
      },
      required: ['title', 'startDateTime', 'endDateTime'],
    },
  },
  {
    name: 'find_free_time',
    description: 'Find free time slots in the calendar',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date to check in YYYY-MM-DD format' },
        durationMinutes: { type: 'number', description: 'Required duration in minutes (default 60)' },
      },
      required: ['date'],
    },
  },
];

export async function handleCalendarTool(name: string, args: Record<string, any>) {
  const calendar = getCalendarClient();

  if (name === 'list_events') {
    const days = args.days || 7;
    const now = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);

    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: end.toISOString(),
      maxResults: args.maxResults || 20,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = res.data.items || [];
    if (events.length === 0) return { content: [{ type: 'text', text: 'No upcoming events found.' }] };

    const formatted = events.map(e => {
      const start = e.start?.dateTime || e.start?.date || '';
      const end = e.end?.dateTime || e.end?.date || '';
      return `📅 ${e.summary}\n   Start: ${start}\n   End: ${end}${e.location ? `\n   Location: ${e.location}` : ''}${e.description ? `\n   Notes: ${e.description}` : ''}`;
    });

    return { content: [{ type: 'text', text: formatted.join('\n\n') }] };
  }

  if (name === 'create_event') {
    const event: any = {
      summary: args.title,
      start: { dateTime: args.startDateTime, timeZone: 'Europe/London' },
      end: { dateTime: args.endDateTime, timeZone: 'Europe/London' },
    };

    if (args.description) event.description = args.description;
    if (args.location) event.location = args.location;
    if (args.attendees) {
      event.attendees = args.attendees.split(',').map((e: string) => ({ email: e.trim() }));
    }

    const res = await calendar.events.insert({ calendarId: 'primary', requestBody: event });
    return { content: [{ type: 'text', text: `Event created: ${res.data.summary}
