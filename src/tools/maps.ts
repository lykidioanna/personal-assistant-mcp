import axios from 'axios';

export const mapsTools = [
  {
    name: 'search_places',
    description: 'Search for places, restaurants, businesses near a location',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to search for e.g. Italian restaurants near Clapham' },
        location: { type: 'string', description: 'Location to search near (optional)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_directions',
    description: 'Get directions and travel time between two places',
    inputSchema: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: 'Starting location' },
        destination: { type: 'string', description: 'Destination' },
        mode: { type: 'string', description: 'Travel mode: driving, walking, transit, bicycling (default: driving)' },
      },
      required: ['origin', 'destination'],
    },
  },
];

export async function handleMapsTool(name: string, args: Record<string, any>) {
  const apiKey = process.env.MAPS_API_KEY;

  if (name === 'search_places') {
    const query = args.location ? args.query + ' near ' + args.location : args.query;
    const res = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: { query, key: apiKey },
    });

    const places = res.data.results?.slice(0, 5) || [];
    if (places.length === 0) return { content: [{ type: 'text', text: 'No places found.' }] };

    const formatted = places.map((p: any) => {
      const rating = p.rating ? '⭐ ' + p.rating + '/5 (' + p.user_ratings_total + ' reviews)' : 'No rating';
      let line = '📍 ' + p.name + '\n   ' + p.formatted_address + '\n   ' + rating;
      if (p.opening_hours?.open_now !== undefined) {
        line += '\n   ' + (p.opening_hours.open_now ? '🟢 Open now' : '🔴 Closed');
      }
      return line;
    });

    return { content: [{ type: 'text', text: formatted.join('\n\n') }] };
  }

  if (name === 'get_directions') {
    const mode = args.mode || 'driving';
    const res = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: args.origin,
        destination: args.destination,
        mode,
        key: apiKey,
      },
    });

    const route = res.data.routes?.[0];
    if (!route) return { content: [{ type: 'text', text: 'No route found.' }] };

    const leg = route.legs[0];
    const steps = leg.steps.map((s: any, i: number) =>
      (i + 1) + '. ' + s.html_instructions.replace(/<[^>]+>/g, '') + ' (' + s.distance.text + ')'
    ).join('\n');

    return {
      content: [{
        type: 'text',
        text: '🗺️ ' + args.origin + ' to ' + args.destination + '\n\nDistance: ' + leg.distance.text + '\nDuration: ' + leg.duration.text + '\nMode: ' + mode + '\n\nDirections:\n' + steps,
      }],
    };
  }

  throw new Error('Unknown maps tool: ' + name);
}
