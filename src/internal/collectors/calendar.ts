import { type CalendarData, storage } from "../storage";

// Google Calendar API configuration
// Note: You'll need to set up a Google Cloud project and OAuth 2.0 credentials
// Replace CLIENT_ID with your actual Google OAuth client ID
const GOOGLE_CLIENT_ID = '';
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

interface GoogleCalendarEvent {
    id: string;
    summary?: string;
    start: {
        dateTime?: string;
        date?: string;
    };
    end: {
        dateTime?: string;
        date?: string;
    };
}

interface GoogleCalendarResponse {
    items: GoogleCalendarEvent[];
}

// Load Google Identity Services library
function loadGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.google?.accounts) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            if (window.google?.accounts) {
                resolve();
            } else {
                reject(new Error('Google Identity Services failed to load'));
            }
        };
        script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.head.appendChild(script);
    });
}

// Get OAuth token using Google Identity Services
async function getGoogleAccessToken(): Promise<string | null> {
    if (!GOOGLE_CLIENT_ID) {
        console.warn('Google Client ID not configured. Calendar integration disabled.');
        return null;
    }

    try {
        await loadGoogleIdentityServices();
    } catch (error) {
        console.error('Failed to load Google Identity Services:', error);
        return null;
    }

    return new Promise((resolve) => {
        if (!window.google?.accounts) {
            resolve(null);
            return;
        }

        window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: CALENDAR_SCOPE,
            callback: (response: { access_token?: string; error?: string }) => {
                if (response.error) {
                    console.error('OAuth error:', response.error);
                    resolve(null);
                } else {
                    resolve(response.access_token || null);
                }
            },
        }).requestAccessToken();
    });
}

// Fetch calendar events for a specific date
async function fetchCalendarEvents(date: Date, accessToken: string): Promise<GoogleCalendarEvent[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const timeMin = startOfDay.toISOString();
    const timeMax = endOfDay.toISOString();

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired, try to refresh
                throw new Error('Token expired');
            }
            throw new Error(`Calendar API error: ${response.status}`);
        }

        const data: GoogleCalendarResponse = await response.json();
        return data.items || [];
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        throw error;
    }
}

// Calculate duration in minutes between two dates
function calculateDurationMinutes(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
}

// Calculate workload score (0-100) based on event count and duration
function calculateWorkloadScore(eventCount: number, totalDurationMinutes: number): number {
    // Normalize based on:
    // - Event count: 0-10 events = 0-50 points
    // - Duration: 0-480 minutes (8 hours) = 0-50 points
    const eventScore = Math.min((eventCount / 10) * 50, 50);
    const durationScore = Math.min((totalDurationMinutes / 480) * 50, 50);
    return Math.round(eventScore + durationScore);
}

// Fetch and process calendar data for today
async function fetchTodayCalendarData(): Promise<CalendarData | null> {
    try {
        const accessToken = await getGoogleAccessToken();
        if (!accessToken) {
            return null;
        }

        const today = new Date();
        const events = await fetchCalendarEvents(today, accessToken);

        // Process events
        const processedEvents = events
            .filter(event => {
                // Only include events with valid start/end times
                const start = event.start?.dateTime || event.start?.date;
                const end = event.end?.dateTime || event.end?.date;
                return start && end;
            })
            .map(event => {
                const start = event.start?.dateTime || event.start?.date || '';
                const end = event.end?.dateTime || event.end?.date || '';
                const durationMinutes = calculateDurationMinutes(start, end);

                return {
                    id: event.id,
                    summary: event.summary || 'No title',
                    start,
                    end,
                    durationMinutes,
                };
            });

        const totalDurationMinutes = processedEvents.reduce(
            (sum, event) => sum + event.durationMinutes,
            0
        );

        const workloadScore = calculateWorkloadScore(processedEvents.length, totalDurationMinutes);

        const calendarData: CalendarData = {
            date: today.toISOString().split('T')[0], // YYYY-MM-DD format
            eventCount: processedEvents.length,
            totalDurationMinutes,
            workloadScore,
            events: processedEvents,
        };

        return calendarData;
    } catch (error) {
        console.error('Error fetching calendar data:', error);
        return null;
    }
}

export async function initCalendar() {
    // Fetch calendar data for today
    const calendarData = await fetchTodayCalendarData();
    
    if (calendarData) {
        // Store calendar data using date as timestamp key
        const dateTimestamp = new Date(calendarData.date).getTime();
        await storage.upsert(dateTimestamp, calendarData, 'calendar');
    }

    // Set up periodic refresh (every hour)
    setInterval(async () => {
        const data = await fetchTodayCalendarData();
        if (data) {
            const dateTimestamp = new Date(data.date).getTime();
            await storage.upsert(dateTimestamp, data, 'calendar');
        }
    }, 1000 * 60 * 60); // 1 hour
}

