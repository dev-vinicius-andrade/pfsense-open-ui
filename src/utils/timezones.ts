export interface TimezoneOption {
  label: string;
  value: string;
  group: string;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  // UTC
  { label: 'UTC', value: 'UTC', group: 'UTC' },

  // America
  { label: 'Adak', value: 'America/Adak', group: 'America' },
  { label: 'Anchorage', value: 'America/Anchorage', group: 'America' },
  { label: 'Bogota', value: 'America/Bogota', group: 'America' },
  { label: 'Chicago', value: 'America/Chicago', group: 'America' },
  { label: 'Denver', value: 'America/Denver', group: 'America' },
  { label: 'Detroit', value: 'America/Detroit', group: 'America' },
  { label: 'Halifax', value: 'America/Halifax', group: 'America' },
  { label: 'Los Angeles', value: 'America/Los_Angeles', group: 'America' },
  { label: 'Mexico City', value: 'America/Mexico_City', group: 'America' },
  { label: 'New York', value: 'America/New_York', group: 'America' },
  { label: 'Phoenix', value: 'America/Phoenix', group: 'America' },
  { label: 'Santiago', value: 'America/Santiago', group: 'America' },
  { label: 'Sao Paulo', value: 'America/Sao_Paulo', group: 'America' },
  { label: 'St. Johns', value: 'America/St_Johns', group: 'America' },
  { label: 'Toronto', value: 'America/Toronto', group: 'America' },
  { label: 'Vancouver', value: 'America/Vancouver', group: 'America' },
  { label: 'Winnipeg', value: 'America/Winnipeg', group: 'America' },
  { label: 'Argentina/Buenos Aires', value: 'America/Argentina/Buenos_Aires', group: 'America' },
  { label: 'Indiana/Indianapolis', value: 'America/Indiana/Indianapolis', group: 'America' },

  // Europe
  { label: 'Amsterdam', value: 'Europe/Amsterdam', group: 'Europe' },
  { label: 'Athens', value: 'Europe/Athens', group: 'Europe' },
  { label: 'Berlin', value: 'Europe/Berlin', group: 'Europe' },
  { label: 'Brussels', value: 'Europe/Brussels', group: 'Europe' },
  { label: 'Bucharest', value: 'Europe/Bucharest', group: 'Europe' },
  { label: 'Dublin', value: 'Europe/Dublin', group: 'Europe' },
  { label: 'Helsinki', value: 'Europe/Helsinki', group: 'Europe' },
  { label: 'Istanbul', value: 'Europe/Istanbul', group: 'Europe' },
  { label: 'Kyiv', value: 'Europe/Kyiv', group: 'Europe' },
  { label: 'Lisbon', value: 'Europe/Lisbon', group: 'Europe' },
  { label: 'London', value: 'Europe/London', group: 'Europe' },
  { label: 'Madrid', value: 'Europe/Madrid', group: 'Europe' },
  { label: 'Moscow', value: 'Europe/Moscow', group: 'Europe' },
  { label: 'Oslo', value: 'Europe/Oslo', group: 'Europe' },
  { label: 'Paris', value: 'Europe/Paris', group: 'Europe' },
  { label: 'Prague', value: 'Europe/Prague', group: 'Europe' },
  { label: 'Rome', value: 'Europe/Rome', group: 'Europe' },
  { label: 'Stockholm', value: 'Europe/Stockholm', group: 'Europe' },
  { label: 'Vienna', value: 'Europe/Vienna', group: 'Europe' },
  { label: 'Warsaw', value: 'Europe/Warsaw', group: 'Europe' },
  { label: 'Zurich', value: 'Europe/Zurich', group: 'Europe' },

  // Asia
  { label: 'Almaty', value: 'Asia/Almaty', group: 'Asia' },
  { label: 'Baghdad', value: 'Asia/Baghdad', group: 'Asia' },
  { label: 'Bangkok', value: 'Asia/Bangkok', group: 'Asia' },
  { label: 'Colombo', value: 'Asia/Colombo', group: 'Asia' },
  { label: 'Dhaka', value: 'Asia/Dhaka', group: 'Asia' },
  { label: 'Dubai', value: 'Asia/Dubai', group: 'Asia' },
  { label: 'Hong Kong', value: 'Asia/Hong_Kong', group: 'Asia' },
  { label: 'Jakarta', value: 'Asia/Jakarta', group: 'Asia' },
  { label: 'Karachi', value: 'Asia/Karachi', group: 'Asia' },
  { label: 'Kolkata', value: 'Asia/Kolkata', group: 'Asia' },
  { label: 'Kuala Lumpur', value: 'Asia/Kuala_Lumpur', group: 'Asia' },
  { label: 'Manila', value: 'Asia/Manila', group: 'Asia' },
  { label: 'Novosibirsk', value: 'Asia/Novosibirsk', group: 'Asia' },
  { label: 'Riyadh', value: 'Asia/Riyadh', group: 'Asia' },
  { label: 'Seoul', value: 'Asia/Seoul', group: 'Asia' },
  { label: 'Shanghai', value: 'Asia/Shanghai', group: 'Asia' },
  { label: 'Singapore', value: 'Asia/Singapore', group: 'Asia' },
  { label: 'Taipei', value: 'Asia/Taipei', group: 'Asia' },
  { label: 'Tehran', value: 'Asia/Tehran', group: 'Asia' },
  { label: 'Tokyo', value: 'Asia/Tokyo', group: 'Asia' },
  { label: 'Ulaanbaatar', value: 'Asia/Ulaanbaatar', group: 'Asia' },
  { label: 'Vladivostok', value: 'Asia/Vladivostok', group: 'Asia' },

  // Pacific
  { label: 'Auckland', value: 'Pacific/Auckland', group: 'Pacific' },
  { label: 'Fiji', value: 'Pacific/Fiji', group: 'Pacific' },
  { label: 'Guam', value: 'Pacific/Guam', group: 'Pacific' },
  { label: 'Honolulu', value: 'Pacific/Honolulu', group: 'Pacific' },
  { label: 'Samoa', value: 'Pacific/Samoa', group: 'Pacific' },
  { label: 'Tongatapu', value: 'Pacific/Tongatapu', group: 'Pacific' },

  // Africa
  { label: 'Cairo', value: 'Africa/Cairo', group: 'Africa' },
  { label: 'Casablanca', value: 'Africa/Casablanca', group: 'Africa' },
  { label: 'Johannesburg', value: 'Africa/Johannesburg', group: 'Africa' },
  { label: 'Lagos', value: 'Africa/Lagos', group: 'Africa' },
  { label: 'Nairobi', value: 'Africa/Nairobi', group: 'Africa' },
  { label: 'Tunis', value: 'Africa/Tunis', group: 'Africa' },
];

export const TIMEZONE_GROUPS = Array.from(new Set(TIMEZONE_OPTIONS.map((tz) => tz.group)));

export function findTimezoneOption(value: string): TimezoneOption | undefined {
  return TIMEZONE_OPTIONS.find((tz) => tz.value === value);
}