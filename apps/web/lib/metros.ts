/** The 25 US metros the synthetic dataset spans. Shared by the seed
 * generator and the location picker so the two can never drift apart. */
export type Metro = { city: string; state: string };

export const METROS: Metro[] = [
  { city: "Austin", state: "TX" },
  { city: "Dallas", state: "TX" },
  { city: "Houston", state: "TX" },
  { city: "San Francisco", state: "CA" },
  { city: "San Jose", state: "CA" },
  { city: "Los Angeles", state: "CA" },
  { city: "San Diego", state: "CA" },
  { city: "Seattle", state: "WA" },
  { city: "Portland", state: "OR" },
  { city: "Denver", state: "CO" },
  { city: "Phoenix", state: "AZ" },
  { city: "Salt Lake City", state: "UT" },
  { city: "Chicago", state: "IL" },
  { city: "Minneapolis", state: "MN" },
  { city: "Columbus", state: "OH" },
  { city: "Indianapolis", state: "IN" },
  { city: "Nashville", state: "TN" },
  { city: "Atlanta", state: "GA" },
  { city: "Miami", state: "FL" },
  { city: "Tampa", state: "FL" },
  { city: "Charlotte", state: "NC" },
  { city: "Raleigh", state: "NC" },
  { city: "Boston", state: "MA" },
  { city: "New York", state: "NY" },
  { city: "Philadelphia", state: "PA" },
];

export const REVENUE_BANDS = [
  "<$1M",
  "$1–10M",
  "$10–50M",
  "$50–250M",
  "$250M+",
] as const;

export const EMPLOYEE_PRESETS = [
  { label: "1–10", min: 1, max: 10 },
  { label: "11–50", min: 11, max: 50 },
  { label: "51–200", min: 51, max: 200 },
  { label: "201–1,000", min: 201, max: 1000 },
  { label: "1,000+", min: 1001, max: 100000 },
] as const;
