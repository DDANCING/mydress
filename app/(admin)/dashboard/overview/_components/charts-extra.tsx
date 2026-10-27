
interface CustomTooltipContentProps {
  active?: boolean;
  payload?: {
    dataKey?: string | number;
    value?: number;
    color?: string;
  }[];
  label?: string | number;
  colorMap?: Record<string, string>;
  labelMap?: Record<string, string>;
  dataKeys?: string[];
  valueFormatter?: (value: number) => string;
}

export function CustomTooltipContent({
  active,
  payload = [],
  label,
  colorMap = {},
  labelMap = {},
  dataKeys,
  valueFormatter = (value) => `$${value.toLocaleString()}`,
}: CustomTooltipContentProps) {
  if (!active || !payload.length) {
    return null;
  }

  const payloadMap = payload.reduce<Record<string, typeof payload[0]>>(
    (acc, item) => {
      const key = item.dataKey as string;
      acc[key] = item;
      return acc;
    },
    {}
  );

  const orderedPayload = dataKeys
    ? dataKeys.filter((key) => payloadMap[key]).map((key) => payloadMap[key])
    : payload;

  return (
    <div className="bg-popover text-popover-foreground grid min-w-32 items-start gap-1.5 rounded-lg border px-3 py-1.5 text-xs">
      <div className="font-medium">{label}</div>
      <div className="grid gap-1.5">
        {orderedPayload.map((entry, index) => {
          if (!entry) return null;

          const name = entry.dataKey as string;
          const value = entry.value ?? 0;
          const color = colorMap[name] || "var(--chart-1)";
          const displayLabel = labelMap[name] || name;

          return (
            <div
              key={`item-${index}`}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <div
                  className="size-2 rounded-xs"
                  style={{ backgroundColor: color }}
                />
                <span className="text-muted-foreground">{displayLabel}</span>
              </div>
              <span className="text-foreground font-mono font-medium tabular-nums">
                {valueFormatter(value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
