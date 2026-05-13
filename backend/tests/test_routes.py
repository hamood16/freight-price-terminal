from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_routes_returns_data() -> None:
    response = client.get("/routes")

    assert response.status_code == 200
    assert len(response.json()) > 0


def test_routes_response_contains_expected_canonical_fields() -> None:
    response = client.get("/routes")

    route = response.json()[0]

    assert route["route_id"]
    assert route["origin"]["port"]
    assert route["origin"]["country"]
    assert isinstance(route["origin"]["lat"], float)
    assert isinstance(route["origin"]["lng"], float)
    assert route["destination"]["port"]
    assert route["destination"]["country"]
    assert isinstance(route["destination"]["lat"], float)
    assert isinstance(route["destination"]["lng"], float)
    assert route["carrier"]
    assert route["service_type"]
    assert route["product_category"]
    assert route["container_type"]
    assert route["currency"]
    assert isinstance(route["pricing"]["current_price_per_kg"], float)
    assert "previous_price_per_kg" in route["pricing"]
    assert "price_change_pct" in route["pricing"]
    assert route["pricing"]["movement_status"] in {
        "increase",
        "decrease",
        "stable",
        "unknown",
    }
    assert isinstance(route["transit_days"], int)
    assert route["last_updated"]


def test_routes_filters_by_origin_country() -> None:
    response = client.get("/routes", params={"origin_country": "China"})

    routes = response.json()

    assert response.status_code == 200
    assert len(routes) == 1
    assert routes[0]["origin"]["country"] == "China"


def test_routes_filters_by_destination_country() -> None:
    response = client.get("/routes", params={"destination_country": "United States"})

    routes = response.json()

    assert response.status_code == 200
    assert len(routes) == 2
    assert all(route["destination"]["country"] == "United States" for route in routes)


def test_routes_filters_by_product_category() -> None:
    response = client.get("/routes", params={"product_category": "clothing"})

    routes = response.json()

    assert response.status_code == 200
    assert len(routes) == 2
    assert all(route["product_category"] == "clothing" for route in routes)


def test_routes_filters_by_carrier() -> None:
    response = client.get("/routes", params={"carrier": "MSC"})

    routes = response.json()

    assert response.status_code == 200
    assert len(routes) == 1
    assert routes[0]["carrier"] == "MSC"


def test_routes_returns_empty_list_for_no_matches() -> None:
    response = client.get("/routes", params={"origin_country": "Atlantis"})

    assert response.status_code == 200
    assert response.json() == []


def test_movement_status_calculation() -> None:
    response = client.get("/routes")

    routes_by_id = {route["route_id"]: route for route in response.json()}

    assert routes_by_id["RTE-001"]["pricing"]["movement_status"] == "increase"
    assert routes_by_id["RTE-001"]["pricing"]["price_change_pct"] == 13.6
    assert routes_by_id["RTE-002"]["pricing"]["movement_status"] == "decrease"
    assert routes_by_id["RTE-003"]["pricing"]["movement_status"] == "stable"
    assert routes_by_id["RTE-003"]["pricing"]["price_change_pct"] == 0.0
    assert routes_by_id["RTE-004"]["pricing"]["movement_status"] == "unknown"
    assert routes_by_id["RTE-004"]["pricing"]["price_change_pct"] is None
    assert routes_by_id["RTE-005"]["pricing"]["movement_status"] == "unknown"
    assert routes_by_id["RTE-005"]["pricing"]["price_change_pct"] is None
