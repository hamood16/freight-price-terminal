import { useState } from "react";

import type {
  MovementStatus,
  PortFilter,
  RouteFilters,
  ShippingRoute,
} from "../types/routes";

type RouteListPanelProps = {
  allRoutes: ShippingRoute[];
  filters: RouteFilters;
  isFiltering: boolean;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onFiltersChange: (filters: RouteFilters) => void;
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

const movementStatusOptions: MovementStatus[] = [
  "increase",
  "decrease",
  "stable",
  "unknown",
];

type SelectOption = string | { label: string; value: string };

export function RouteListPanel({
  allRoutes,
  filters,
  isFiltering,
  onApplyFilters,
  onClearFilters,
  onFiltersChange,
  routes,
}: RouteListPanelProps) {
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const carrierOptions = getUniqueOptions(allRoutes, (route) => route.carrier);
  const productCategoryOptions = getUniqueOptions(
    allRoutes,
    (route) => route.product_category,
  );
  const departurePortOptions = getPortOptions(
    allRoutes,
    (route) => route.origin,
  );
  const arrivalPortOptions = getPortOptions(
    allRoutes,
    (route) => route.destination,
  );
  const activeFilterCount = [
    filters.carrier,
    filters.product_category,
    filters.movement_status,
  ].filter(Boolean).length + filters.origin_ports.length + filters.destination_ports.length;

  function applyFilters() {
    onApplyFilters();
    setIsFilterPanelOpen(false);
  }

  function clearFilters() {
    onClearFilters();
    setIsFilterPanelOpen(false);
  }

  function addSelectedPort(portType: "origin" | "destination", value: string) {
    const selectedPort = parsePortOptionValue(value);

    if (!selectedPort.port || !selectedPort.country) {
      return;
    }

    const selectedPorts =
      portType === "origin" ? filters.origin_ports : filters.destination_ports;

    if (hasSelectedPort(selectedPorts, selectedPort)) {
      return;
    }

    if (portType === "origin") {
      onFiltersChange({
        ...filters,
        origin_ports: [...filters.origin_ports, selectedPort],
      });
      return;
    }

    onFiltersChange({
      ...filters,
      destination_ports: [...filters.destination_ports, selectedPort],
    });
  }

  function removeSelectedPort(
    portType: "origin" | "destination",
    selectedPort: PortFilter,
  ) {
    if (portType === "origin") {
      onFiltersChange({
        ...filters,
        origin_ports: filters.origin_ports.filter(
          (port) => !isSamePort(port, selectedPort),
        ),
      });
      return;
    }

    onFiltersChange({
      ...filters,
      destination_ports: filters.destination_ports.filter(
        (port) => !isSamePort(port, selectedPort),
      ),
    });
  }

  return (
    <aside className="flex h-[520px] min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm lg:h-full">
      <div className="flex min-w-0 items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-500">Live route sample</p>
          <h2 className="text-xl font-semibold text-zinc-950 break-words">
            {routes.length} shipping routes
          </h2>
        </div>
        <button
          className="shrink-0 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          onClick={() => setIsFilterPanelOpen((isOpen) => !isOpen)}
          type="button"
        >
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </button>
      </div>

      {isFilterPanelOpen ? (
        <form
          className="flex max-h-[min(420px,70vh)] min-h-0 flex-col overflow-hidden border-b border-zinc-200 bg-zinc-50"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters();
          }}
        >
          <div className="grid min-h-0 gap-3 overflow-y-auto overflow-x-hidden p-4">
            <FilterSelect
              label="Carrier"
              onChange={(value) => onFiltersChange({ ...filters, carrier: value })}
              options={carrierOptions}
              value={filters.carrier}
            />
            <FilterSelect
              label="Product category"
              onChange={(value) =>
                onFiltersChange({ ...filters, product_category: value })
              }
              options={productCategoryOptions}
              value={filters.product_category}
            />
            <FilterSelect
              label="Movement status"
              onChange={(value) =>
                onFiltersChange({
                  ...filters,
                  movement_status: value as MovementStatus | "",
                })
              }
              options={movementStatusOptions}
              value={filters.movement_status}
            />
            <FilterSelect
              label="Departure port"
              onChange={(value) => addSelectedPort("origin", value)}
              options={departurePortOptions}
              value=""
            />
            <SelectedPortPills
              onRemove={(port) => removeSelectedPort("origin", port)}
              ports={filters.origin_ports}
            />
            <FilterSelect
              label="Arrival port"
              onChange={(value) => addSelectedPort("destination", value)}
              options={arrivalPortOptions}
              value=""
            />
            <SelectedPortPills
              onRemove={(port) => removeSelectedPort("destination", port)}
              ports={filters.destination_ports}
            />
          </div>
          <div className="sticky bottom-0 grid grid-cols-2 gap-2 border-t border-zinc-200 bg-zinc-50 p-4 shadow-[0_-8px_16px_rgba(255,255,255,0.85)]">
            <button
              className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
              disabled={isFiltering}
              type="submit"
            >
              {isFiltering ? "Applying" : "Apply"}
            </button>
            <button
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-400"
              disabled={isFiltering}
              onClick={clearFilters}
              type="button"
            >
              Clear
            </button>
          </div>
        </form>
      ) : null}

      <div className="min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-4">
        {routes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-600">
            No routes match the selected filters.
          </div>
        ) : (
          routes.map((route) => (
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
          ))
        )}
      </div>
    </aside>
  );

}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  value: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      <select
        className="min-w-0 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={getSelectOptionValue(option)} value={getSelectOptionValue(option)}>
            {getSelectOptionLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function getSelectOptionLabel(option: SelectOption) {
  return typeof option === "string" ? option : option.label;
}

function getSelectOptionValue(option: SelectOption) {
  return typeof option === "string" ? option : option.value;
}

function getUniqueOptions(
  routes: ShippingRoute[],
  getValue: (route: ShippingRoute) => string,
) {
  return Array.from(new Set(routes.map(getValue))).sort((first, second) =>
    first.localeCompare(second),
  );
}

function getPortOptions(
  routes: ShippingRoute[],
  getPort: (route: ShippingRoute) => { port: string; country: string },
) {
  const optionByValue = new Map<string, { label: string; country: string; port: string }>();

  for (const route of routes) {
    const { country, port } = getPort(route);
    const value = getPortOptionValue(port, country);

    optionByValue.set(value, {
      country,
      label: `${port}, ${country}`,
      port,
    });
  }

  return Array.from(optionByValue.values())
    .sort((first, second) => {
      const countryComparison = first.country.localeCompare(second.country);

      if (countryComparison !== 0) {
        return countryComparison;
      }

      return first.port.localeCompare(second.port);
    })
    .map((option) => ({
      label: option.label,
      value: getPortOptionValue(option.port, option.country),
    }));
}

function getPortOptionValue(port: string, country: string) {
  return port && country ? `${port}|||${country}` : "";
}

function parsePortOptionValue(value: string) {
  const [port = "", country = ""] = value.split("|||");

  return { country, port };
}

function SelectedPortPills({
  onRemove,
  ports,
}: {
  onRemove: (port: PortFilter) => void;
  ports: PortFilter[];
}) {
  if (ports.length === 0) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-wrap gap-2">
      {ports.map((port) => (
        <button
          className="max-w-full rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-left text-xs font-medium text-emerald-800"
          key={getPortOptionValue(port.port, port.country)}
          onClick={() => onRemove(port)}
          type="button"
        >
          <span className="break-words">
            {port.port}, {port.country} x
          </span>
        </button>
      ))}
    </div>
  );
}

function hasSelectedPort(ports: PortFilter[], selectedPort: PortFilter) {
  return ports.some((port) => isSamePort(port, selectedPort));
}

function isSamePort(firstPort: PortFilter, secondPort: PortFilter) {
  return (
    firstPort.port === secondPort.port &&
    firstPort.country === secondPort.country
  );
}
