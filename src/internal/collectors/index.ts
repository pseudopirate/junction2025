import { storage } from "../storage";
import { data as csvData } from "./mock.data";

export async function ensurePermissions() {
    const perms: Record<string, string> = {}
    // Check geolocation permission
    if ('permissions' in navigator) {
      try {
        const geoStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
        perms.geolocation = geoStatus.state
      } catch (e) {
        perms.geolocation = 'unknown'
      }
    }

    // Check notifications permission
    if ('Notification' in window && 'permissions' in navigator) {
      try {
        const notifStatus = await navigator.permissions.query({ name: 'notifications' as PermissionName })
        perms.notifications = notifStatus.state
      } catch (e) {
        perms.notifications = 'unknown'
      }
    }

    await storage.upsert(1, perms, 'permissions')
}

interface GeoPosition {
    accuracy: number
    latitude: number
    longitude: number
    altitude: number | null
    altitudeAccuracy: number | null
    heading: number | null
    speed: number | null
    timestamp: number
}
async function initGeo() {
    navigator.geolocation.watchPosition(
        ({ coords, timestamp }) => {
            const position: GeoPosition = {
                accuracy: coords.accuracy,
                latitude: coords.latitude,
                longitude: coords.longitude,
                altitude: coords.altitude,
                altitudeAccuracy: coords.altitudeAccuracy,
                heading: coords.heading,
                speed: coords.speed,
                timestamp: timestamp
            }

            storage.upsert(Date.now(), position, 'geolocation')
        },
        (error) => {
            console.error(error)
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    )
}

async function fetchWeather() {
    const API_KEY = '55b5742fa01c2f15048e8b5fe33e69cf'

    const geo = await storage.readAll<GeoPosition>('geolocation');
    const first = geo[0];
    if (!first) return;
    const lat = first.data.latitude;
    const lon = first.data.longitude;


    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Weather API error')
    
    const data = await response.json()
    console.log('weather', data);
    await storage.upsert(Date.now(), data, 'weather');
}

async function initUserData(): Promise<Record<string, string | number>[]> {
    // Parse CSV string into array of objects
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
        return []; // Need at least header + one data row
    }
    
    // Extract headers from first line
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Parse data rows
    const objects = lines.slice(1).map((line) => {
        const values = line.split(',');
        const obj: Record<string, string | number> = {};
        
        headers.forEach((header, i) => {
            const value = values[i]?.trim() || '';
            // Try to convert to number if possible
            const numValue = Number(value);
            if (value !== '' && !isNaN(numValue) && isFinite(numValue)) {
                obj[header] = numValue;
            } else {
                obj[header] = value;
            }
        });
        
        return obj;
    });
    
    // Store parsed data in storage
    for (const obj of objects) {
        if (obj.date) {
            // Use date as timestamp key, or generate one
            const timestamp = typeof obj.date === 'string' ? new Date(obj.date).getTime() : Date.now();
            await storage.upsert(timestamp, obj, 'general');
        }
    }
    
    return objects;
}

async function initWeather() {
    fetchWeather();
    setInterval(async () => {
        fetchWeather();
    }, 1000 * 60 * 5); // 5 min
}

export async function initListeners() {
    await Promise.all([
        initGeo(),
        initWeather(),
        initUserData(),
    ]);
}
