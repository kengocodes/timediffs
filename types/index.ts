export type TimezoneId = string;

export interface Timezone {
  id: TimezoneId;
  city: string;
  country: string;
  countryCode: string;
  isHome?: boolean;
}

export interface TimezoneDisplay {
  timezone: Timezone;
  formattedTime: string;
  formattedDate: string;
  offsetDisplay: string;
}
