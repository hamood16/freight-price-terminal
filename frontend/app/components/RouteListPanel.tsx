import type { MovementStatus, ShippingRoute } from "../types/routes";

type RouteListPanelProps = {
  routes: ShippingRoute[];
};

const movementStyles: Record<MovementStatus, string> = {
  increase: "border-red-200 bg-red-50 text-red-700",
  decrease: "border-emerald-200 bg-emerald-50 text-emerald-700",
  stable: "border-zinc-200 bg-zinc-50 text-zinc-700",
  unknown: "border-zinc-200 bg-zinc-50 text-zinc-500",
};

const priceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function RouteListPanel({ routes }: RouteListPanelProps) {
  return (
    <aside className="flex h-[520px] min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm lg:h-full">
      <div className="min-w-0 border-b border-zinc-200 px-5 py-4">
        <p className="text-sm font-medium text-zinc-500">Live route sample</p>
        <h2 className="text-xl font-semibold text-zinc-950 break-words">
          {routes.length} shipping routes
        </h2>
      </div>

      <div className="min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-4">
        {routes.map((route) => (
          <article
            key={route.route_id}
            className="w-full min-w-0 rounded-lg border border-zinc-200 bg-white p-4"
          >
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="break-words text-base font-semibold text-zinc-950">
                  {route.carrier}
                </h3>
                <p className="mt-1 break-words text-sm text-zinc-500">
                  {route.product_category} | {route.container_type}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${movementStyles[route.pricing.movement_status]}`}
              >
                {route.pricing.movement_status}
              </span>
            </div>

            <div className="mt-4 grid min-w-0 gap-3 text-sm">
              <div className="min-w-0">
                <p className="break-words font-medium text-zinc-950">
                  {route.origin.port}, {route.origin.country}
                </p>
                <p className="break-words text-zinc-500">
                  to {route.destination.port}, {route.destination.country}
                </p>
              </div>

              <div className="grid min-w-0 gap-3 rounded-md bg-zinc-50 p-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase text-zinc-500">
                    Price/kg
                  </p>
                  <p className="mt-1 break-words font-semibold text-zinc-950">
                    {route.currency}{" "}
                    {priceFormatter.format(route.pricing.current_price_per_kg)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase text-zinc-500">
                    Transit
                  </p>
                  <p className="mt-1 break-words font-semibold text-zinc-950">
                    {route.transit_days} days
                  </p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
