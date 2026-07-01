"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area, FunnelChart, Funnel, LabelList,
  LineChart, Line, Legend,
} from "recharts";

const AXIS = { fontSize: 11, fill: "#8590a8" };
const GRID = "#eceef2";

export function SimpleBar({
  data,
  dataKey = "value",
  xKey = "name",
  color = "#3463ff",
}: {
  data: any[];
  dataKey?: string;
  xKey?: string;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip cursor={{ fill: "#f6f7f9" }} contentStyle={tooltipStyle} />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} barSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MultiColorBar({ data }: { data: { name: string; value: number; color: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip cursor={{ fill: "#f6f7f9" }} contentStyle={tooltipStyle} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={28}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, innerRadius = 52 }: { data: { name: string; value: number; color: string }[]; innerRadius?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="50%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={innerRadius} outerRadius={80} paddingAngle={2}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex-1 space-y-1.5">
        {data.map((d) => (
          <li key={d.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-ink-600">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
              {d.name}
            </span>
            <span className="font-medium text-ink-900">
              {d.value}
              <span className="text-ink-400 text-xs ml-1">
                {total ? Math.round((d.value / total) * 100) : 0}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TrendArea({ data, color = "#3463ff" }: { data: any[]; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#g)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SalesFunnel({ data }: { data: { name: string; value: number; fill: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <FunnelChart>
        <Tooltip contentStyle={tooltipStyle} />
        <Funnel dataKey="value" data={data} isAnimationActive>
          <LabelList position="right" fill="#42495d" stroke="none" dataKey="name" fontSize={12} />
          <LabelList position="left" fill="#42495d" stroke="none" dataKey="value" fontSize={12} />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}

export function HBar({ data, height = 180, unit = "%" }: { data: { name: string; value: number; color: string }[]; height?: number; unit?: string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 28, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} unit={unit} />
        <YAxis type="category" dataKey="name" tick={AXIS} axisLine={false} tickLine={false} width={64} />
        <Tooltip cursor={{ fill: "#f6f7f9" }} contentStyle={tooltipStyle} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
          {data.map((d, i) => <Cell key={i} fill={d.color || "#3463ff"} />)}
          <LabelList dataKey="value" position="right" formatter={(v: any) => `${v}${unit}`} fontSize={11} fill="#42495d" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineTrend({ data, color = "#10b981", height = 220 }: { data: any[]; color?: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function GroupedBar({
  data, keys, height = 220,
}: {
  data: any[];
  keys: { key: string; label: string; color: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip cursor={{ fill: "#f6f7f9" }} contentStyle={tooltipStyle} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
        {keys.map((k) => (
          <Bar key={k.key} dataKey={k.key} name={k.label} fill={k.color} radius={[4, 4, 0, 0]} barSize={18} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StackedBar({
  data, keys, horizontal = false, height = 220,
}: {
  data: any[];
  keys: { key: string; label: string; color: string }[];
  horizontal?: boolean;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 8, right: 12, left: horizontal ? 8 : -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={AXIS} axisLine={false} tickLine={false} width={64} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
          </>
        )}
        <Tooltip cursor={{ fill: "#f6f7f9" }} contentStyle={tooltipStyle} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
        {keys.map((k) => (
          <Bar key={k.key} dataKey={k.key} name={k.label} stackId="a" fill={k.color} barSize={22} radius={[3, 3, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid #eceef2",
  boxShadow: "0 4px 16px -2px rgba(16,24,40,0.12)",
  fontSize: 12,
};
