// import { storage } from "../storage";

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

    // await storage.upsert('permissions', perms, 'permissions')
}

async function initGeo() {
    navigator.geolocation.watchPosition(
        (position) => {
            console.log(position)
            // storage.create('geolocation', position, 'geolocation')
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

async function fetchWeather(lat: number, lon: number) {
    const API_KEY = '55b5742fa01c2f15048e8b5fe33e69cf'
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Weather API error')
    
    const data = await response.json()
    // await storage.upsert('weather', data, 'weather');
}

async function initWeather() {
    setInterval(async () => {
        // const geo = await storage.read('geolocation', 'geolocation');
        // console.log(geo)
    }, 1000); // 5 min
}

export async function initListeners() {
    await Promise.all([
        initGeo(),
        initWeather(),
    ]);
}


