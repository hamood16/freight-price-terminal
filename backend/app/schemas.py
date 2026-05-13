from typing import Literal

from pydantic import BaseModel


MovementStatus = Literal["increase", "decrease", "stable", "unknown"]


class PortLocation(BaseModel):
    port: str
    country: str
    lat: float
    lng: float


class RoutePricing(BaseModel):
    current_price_per_kg: float
    previous_price_per_kg: float | None
    price_change_pct: float | None
    movement_status: MovementStatus


class ShippingRoute(BaseModel):
    route_id: str
    origin: PortLocation
    destination: PortLocation
    carrier: str
    service_type: str
    product_category: str
    container_type: str
    currency: str
    pricing: RoutePricing
    transit_days: int
    last_updated: str
