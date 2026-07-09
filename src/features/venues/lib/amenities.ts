export const VENUE_AMENITIES = [
  { value: "parking", label: "Parking" },
  { value: "showers", label: "Showers" },
  { value: "changing_rooms", label: "Changing rooms" },
  { value: "lockers", label: "Lockers" },
  { value: "cafeteria", label: "Cafeteria" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "ac", label: "Air conditioning" },
  { value: "pro_shop", label: "Pro shop" },
  { value: "first_aid", label: "First aid" },
  { value: "wheelchair_access", label: "Wheelchair access" },
  { value: "cctv", label: "CCTV" },
  { value: "drinking_water", label: "Drinking water" },
] as const;

export function getAmenityLabel(value: string): string {
  return VENUE_AMENITIES.find((a) => a.value === value)?.label ?? value;
}
