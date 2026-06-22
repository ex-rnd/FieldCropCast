export interface DailyForecast {
  date: string;
  temp_min: number | null;
  temp_max: number | null;
  precipitation_sum: number;
  precipitation_probability: number;
  wind_max: number;
  condition_code: number;
  sunrise?: string;
  sunset?: string;
}

export interface HourlyForecast {
  time: string;
  temperature: number | null;
  condition_code: number;
  precipitation_probability: number | null;
  humidity?: number | null;
  feels_like?: number | null;
  uv_index?: number | null;
  wind_speed?: number | null;
  wind_direction?: number | null;
}

export interface CurrentWeather {
  temperature?: number | null;
  condition_code?: number;
  time?: string;
  wind_speed?: number | null;
  wind_direction?: number | null;
}

export interface LocationData {
  country?: string;
  city?: string;
  name?: string;
}

export interface WeatherData {
  current?: CurrentWeather;
  location?: LocationData;
  daily?: DailyForecast[];
  hourly?: HourlyForecast[];
  ai_summary?: string;
  summary?: string;
}

export interface FarmState {
  name: string;
  county: string;
  lat: string;
  lon: string;
  crop: string;
  units: 'metric' | 'imperial';
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface RiskResult {
  score: number;
  level: RiskLevel;
  detail: string;
}

export interface Risks {
  rain: RiskResult;
  wind: RiskResult;
  temp: RiskResult;
}

export interface Recommendation {
  cls: 'urgent' | 'warning' | 'caution' | 'good';
  icon: string;
  text: string;
}

export interface UsageData {
  plan?: string;
  period?: { requestCount?: number; aiRequestCount?: number; end?: string };
  limits?: { requests?: number; aiRequests?: number };
  remaining?: { requests?: number; aiRequests?: number };
}

// ── Webhook alerts ─────────────────────────────────────────────────────────
export type AlertSeverity = 'info' | 'warning' | 'high' | 'critical';

export type AlertType =
  | 'heavy_rain'
  | 'storm'
  | 'extreme_heat'
  | 'frost'
  | 'high_wind'
  | 'unknown';

export interface WeatherAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  receivedAt: string;
  expiresAt: string;
  raw: unknown;
}
