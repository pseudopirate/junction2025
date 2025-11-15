import { type WearablesData, storage } from "../storage";

// Re-export for convenience
export type { WearablesData };

// Web Bluetooth API type definitions
interface BluetoothNavigator extends Navigator {
    bluetooth?: {
        requestDevice(options: { filters: Array<{ services: string[] }>; optionalServices?: string[] }): Promise<BluetoothDevice>;
    };
}

interface BluetoothDevice {
    gatt?: {
        connect(): Promise<BluetoothRemoteGATTServer>;
    };
}

interface BluetoothRemoteGATTServer {
    getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
    getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic {
    startNotifications(): void;
    addEventListener(event: string, handler: (event: { target: { value: DataView } }) => void): void;
}

// Web Bluetooth API support check
function isWebBluetoothAvailable(): boolean {
    const nav = navigator as BluetoothNavigator;
    return 'bluetooth' in navigator && nav.bluetooth !== undefined && 'requestDevice' in nav.bluetooth;
}

// Generate mock/synthetic wearable data for development/testing
function generateMockWearablesData(date: Date): WearablesData {
    const baseDate = date.toISOString().split('T')[0];
    const timestamp = date.getTime();
    
    // Generate realistic mock data
    const baseHeartRate = 65 + Math.floor(Math.random() * 20); // 65-85 bpm
    const steps = 5000 + Math.floor(Math.random() * 8000); // 5000-13000 steps
    const stressLevel = Math.floor(Math.random() * 50); // 0-50 stress level
    const sleepHours = 6.5 + Math.random() * 2; // 6.5-8.5 hours
    
    return {
        date: baseDate,
        timestamp,
        heartRate: {
            bpm: baseHeartRate,
            restingBpm: baseHeartRate - 10,
            maxBpm: baseHeartRate + 40,
            hrv: 30 + Math.floor(Math.random() * 20), // 30-50ms HRV
        },
        steps,
        distance: steps * 0.7, // Approximate distance in meters (0.7m per step)
        calories: 1800 + Math.floor(Math.random() * 500), // 1800-2300 calories
        activeMinutes: 20 + Math.floor(Math.random() * 40), // 20-60 active minutes
        stressLevel,
        sleep: {
            durationHours: sleepHours,
            quality: 70 + Math.floor(Math.random() * 25), // 70-95 quality score
            deepSleepMinutes: Math.floor(sleepHours * 60 * 0.2), // ~20% deep sleep
            remSleepMinutes: Math.floor(sleepHours * 60 * 0.25), // ~25% REM
            lightSleepMinutes: Math.floor(sleepHours * 60 * 0.5), // ~50% light sleep
            awakeMinutes: Math.floor(sleepHours * 60 * 0.05), // ~5% awake
            sleepStart: new Date(date.getTime() - sleepHours * 3600000 - 8 * 3600000).toISOString(), // 8 hours before wake time
            sleepEnd: new Date(date.getTime() - 8 * 3600000).toISOString(), // 8 hours before current time
        },
        workouts: [
            {
                type: 'walking',
                durationMinutes: 30 + Math.floor(Math.random() * 30),
                calories: 150 + Math.floor(Math.random() * 100),
                distance: 2000 + Math.floor(Math.random() * 2000),
                averageHeartRate: baseHeartRate + 20,
                maxHeartRate: baseHeartRate + 40,
                startTime: new Date(date.getTime() - 4 * 3600000).toISOString(),
                endTime: new Date(date.getTime() - 3.5 * 3600000).toISOString(),
            },
        ],
        oxygenSaturation: 96 + Math.random() * 3, // 96-99% SpO2
        bodyTemperature: 36.5 + Math.random() * 0.5, // 36.5-37.0°C
        respiratoryRate: 12 + Math.floor(Math.random() * 6), // 12-18 breaths/min
    };
}

// Try to connect to a Bluetooth heart rate device
async function connectBluetoothHeartRate(): Promise<number | null> {
    if (!isWebBluetoothAvailable()) {
        return null;
    }

    try {
        const nav = navigator as BluetoothNavigator;
        if (!nav.bluetooth) {
            return null;
        }
        
        const device = await nav.bluetooth.requestDevice({
            filters: [{ services: ['heart_rate'] }],
            optionalServices: ['battery_service'],
        });

        const server = await device.gatt?.connect();
        if (!server) {
            return null;
        }

        const service = await server.getPrimaryService('heart_rate');
        const characteristic = await service.getCharacteristic('heart_rate_measurement');

        return new Promise((resolve) => {
            characteristic.addEventListener('characteristicvaluechanged', (event: { target: { value: DataView } }) => {
                const value = event.target.value;
                // Parse heart rate from BLE characteristic
                const flags = value.getUint8(0);
                let bpm: number;
                
                if (flags & 0x01) {
                    // 16-bit heart rate value
                    bpm = value.getUint16(1, true);
                } else {
                    // 8-bit heart rate value
                    bpm = value.getUint8(1);
                }
                
                resolve(bpm);
            });

            characteristic.startNotifications();
            
            // Timeout after 10 seconds if no data received
            setTimeout(() => {
                resolve(null);
            }, 10000);
        });
    } catch (error) {
        console.error('Bluetooth heart rate connection error:', error);
        return null;
    }
}

// Fetch wearable data for a specific date
async function fetchWearablesData(date: Date): Promise<WearablesData | null> {
    try {
        // Try to get real data from Web Bluetooth or sensors
        const realData: Partial<WearablesData> = {};
        
        // Try Bluetooth heart rate if available
        if (isWebBluetoothAvailable()) {
            const heartRate = await connectBluetoothHeartRate();
            if (heartRate) {
                realData.heartRate = {
                    bpm: heartRate,
                };
            }
        }
        
        // For now, use mock data as fallback
        // In a real implementation, you would:
        // 1. Connect to wearable devices via Web Bluetooth
        // 2. Use Generic Sensor API for device sensors
        // 3. Integrate with health APIs (Apple HealthKit, Google Fit, etc.) via native apps
        // 4. Use Web APIs for step counting if available
        
        const mockData = generateMockWearablesData(date);
        
        // Merge real data with mock data (real data takes precedence)
        const wearablesData: WearablesData = {
            ...mockData,
            ...realData,
            heartRate: realData.heartRate?.bpm 
                ? {
                    ...mockData.heartRate,
                    ...realData.heartRate,
                }
                : mockData.heartRate,
        };
        
        return wearablesData;
    } catch (error) {
        console.error('Error fetching wearables data:', error);
        return null;
    }
}

// Fetch and store wearable data for today
async function fetchTodayWearablesData(): Promise<WearablesData | null> {
    const today = new Date();
    return await fetchWearablesData(today);
}

// Initialize wearables data collection
export async function initWearables() {
    // Fetch wearable data for today
    const wearablesData = await fetchTodayWearablesData();
    
    if (wearablesData) {
        // Store wearable data using date timestamp as key
        const dateTimestamp = new Date(wearablesData.date).getTime();
        await storage.upsert(dateTimestamp, wearablesData, 'wearables');
    }

    // Set up periodic refresh (every hour)
    setInterval(async () => {
        const data = await fetchTodayWearablesData();
        if (data) {
            await storage.upsert(Date.now(), data, 'wearables');
        }
    }, 1000 * 60 * 60); // 1 hour
}

// Get wearable data for a specific date
export async function getWearablesData(date: Date): Promise<WearablesData | null> {
    const dateTimestamp = new Date(date.toISOString().split('T')[0]).getTime();
    return await storage.readData<WearablesData>(dateTimestamp, 'wearables');
}

// Get all wearable data
export async function getAllWearablesData(): Promise<WearablesData[]> {
    return await storage.readAllData<WearablesData>('wearables');
}

