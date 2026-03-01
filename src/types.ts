export type SensorType = 'temperature' | 'humidity' | 'smoke';

export interface SensorReading {
  timestamp: number;
  value: number;
}

export interface SiteStatus {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'warning' | 'critical' | 'offline';
  lastUpdate: number;
  sensors: {
    temperature: {
      current: number;
      unit: string;
      history: SensorReading[];
      threshold: number;
    };
    humidity: {
      current: number;
      unit: string;
      history: SensorReading[];
      threshold: number;
    };
    smoke: {
      current: number;
      unit: string;
      history: SensorReading[];
      threshold: number;
    };
  };
}

export interface Alert {
  id: string;
  siteId: string;
  siteName: string;
  type: SensorType;
  severity: 'warning' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
}
