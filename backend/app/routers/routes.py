from fastapi import APIRouter, Query

from app.schemas import ShippingRoute
from app.services.routes_service import get_routes


router = APIRouter()


@router.get("/routes", response_model=list[ShippingRoute])
def list_routes(
    origin_country: list[str] | None = Query(default=None),
    destination_country: list[str] | None = Query(default=None),
    origin_port: list[str] | None = Query(default=None),
    destination_port: list[str] | None = Query(default=None),
    product_category: str | None = Query(default=None),
    carrier: str | None = Query(default=None),
    movement_status: str | None = Query(default=None),
) -> list[ShippingRoute]:
    return get_routes(
        {
            "origin_country": origin_country,
            "destination_country": destination_country,
            "origin_port": origin_port,
            "destination_port": destination_port,
            "product_category": product_category,
            "carrier": carrier,
            "movement_status": movement_status,
        }
    )
