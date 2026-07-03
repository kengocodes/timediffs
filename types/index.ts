export type TimezoneId = string;

export interface Timezone {
  id: TimezoneId;
  city: string;
  country: string;
  countryCode: string;
  offset: string;
  offsetHours: number;
  isHome?: boolean;
}

export interface TimezoneDisplay {
  timezone: Timezone;
  formattedTime: string;
  formattedDate: string;
  offsetDisplay: string;
}
