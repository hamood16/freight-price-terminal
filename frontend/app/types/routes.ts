export type MovementStatus = "increase" | "decrease" | "stable" | "unknown";

export type PortLocation = {
  port: string;
  country: string;
  lat: number;
  lng: number;
};

export type RoutePricing = {
  current_price_per_kg: number;
  previous_price_per_kg: number | null;
  price_change_pct: number | null;
  movement_status: MovementStatus;
};

export type ShippingRoute = {
  route_id: string;
  origin: PortLocation;
  destination: PortLocation;
  carrier: string;
  service_type: string;
  product_category: string;
  container_type: string;
  currency: string;
  pricing: RoutePricing;
  transit_days: number;
  last_updated: string;
};
