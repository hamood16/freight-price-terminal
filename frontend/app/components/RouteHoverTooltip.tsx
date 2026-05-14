import type { ShippingRoute } from "../types/routes";

type RouteHoverTooltipProps = {
  left: number;
  route: ShippingRoute;
  top: number;
};

const priceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function RouteHoverTooltip({ left, route, top }: RouteHoverTooltipProps) {
  return (
    <div
      className="pointer-events-none absolute z-20 w-72 rounded-lg border border-zinc-200 bg-white/95 p-3 text-sm shadow-lg backdrop-blur"
      style={{
        left,
        top,
        transform: "translate(12px, -50%)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-zinc-950">{route.carrier}</p>
          <p className="mt-1 text-xs capitalize text-zinc-500">
            {route.pricing.movement_status}
          </p>
        </div>
        <p className="shrink-0 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
          {route.transit_days} days
        </p>
      </div>

      <div className="mt-3 space-y-2 text-xs text-zinc-600">
        <p>
          <span className="font-medium text-zinc-900">From:</span>{" "}
          {route.origin.port}, {route.origin.country}
        </p>
        <p>
          <span className="font-medium text-zinc-900">To:</span>{" "}
          {route.destination.port}, {route.destination.country}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-md bg-zinc-50 p-2 text-xs">
        <div>
          <p className="font-medium uppercase text-zinc-500">Category</p>
          <p className="mt-1 text-zinc-900">{route.product_category}</p>
        </div>
        <div>
          <p className="font-medium uppercase text-zinc-500">Container</p>
          <p className="mt-1 text-zinc-900">{route.container_type}</p>
        </div>
        <div className="col-span-2">
          <p className="font-medium uppercase text-zinc-500">Price/kg</p>
          <p className="mt-1 font-semibold text-zinc-950">
            {route.currency}{" "}
            {priceFormatter.format(route.pricing.current_price_per_kg)}
          </p>
        </div>
      </div>
    </div>
  );
}
