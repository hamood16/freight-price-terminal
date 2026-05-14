from fastapi import APIRouter, HTTPException, Query

from app.schemas import RouteDetailResponse, ShippingRoute
from app.services.routes_service import get_route_detail, get_routes


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


@router.get("/routes/{route_id}", response_model=RouteDetailResponse)
def retrieve_route_detail(route_id: str) -> RouteDetailResponse:
    route_detail = get_route_detail(route_id)

    if route_detail is None:
        raise HTTPException(status_code=404, detail="Route not found")

    return route_detail
