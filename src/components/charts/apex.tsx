"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const PALETTE = ["#3463ff", "#ec4899", "#8b5cf6", "#f59e0b", "#10b981", "#0ea5e9", "#ef4444", "#14b8a6", "#64748b"];

interface Pt { name: string; value: number; color?: string }
interface Key { key: string; label: string; color: string }

// Premium base: smooth grow/morph animations, soft drop shadow, inherit font.
function base(type: string, height: number): ApexOptions["chart"] {
  return {
    type: type as any,
    height,
    fontFamily: "inherit",
    foreColor: "#65718c",
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: {
      enabled: true,
      speed: 850,
      animateGradually: { enabled: true, delay: 120 },
      dynamicAnimation: { enabled: true, speed: 400 },
    },
    dropShadow: { enabled: true, top: 3, left: 0, blur: 5, opacity: 0.12, color: "#1f2937" },
  };
}

const grid: ApexOptions["grid"] = {
  borderColor: "#eceef2",
  strokeDashArray: 4,
  xaxis: { lines: { show: false } },
  padding: { left: 4, right: 8, top: 0 },
};
const axis: ApexOptions["xaxis"] = { axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { fontSize: "11px" } } };
const tooltip: ApexOptions["tooltip"] = { theme: "light", style: { fontSize: "12px" } };
const noDL = { enabled: false } as const;

function Chart({ options, series, type, height = 240 }: { options: ApexOptions; series: any; type: string; height?: number }) {
  return (
    <div className="apex-wrap w-full">
      {/* @ts-expect-error react-apexcharts dynamic import typing */}
      <ReactApexChart options={options} series={series} type={type} height={height} width="100%" />
    </div>
  );
}

const colorsOf = (data: Pt[]) => data.map((d, i) => d.color || PALETTE[i % PALETTE.length]);

export function ApexBar({ data, height = 240 }: { data: Pt[]; height?: number }) {
  const options: ApexOptions = {
    chart: base("bar", height),
    colors: colorsOf(data),
    plotOptions: { bar: { distributed: true, borderRadius: 7, borderRadiusApplication: "end", columnWidth: "52%" } },
    fill: { type: "gradient", gradient: { shade: "light", type: "vertical", shadeIntensity: 0.25, opacityFrom: 1, opacityTo: 0.78, stops: [0, 100] } },
    dataLabels: noDL,
    legend: { show: false },
    xaxis: { ...axis, categories: data.map((d) => d.name) },
    yaxis: { labels: { formatter: (v) => `${Math.round(v)}` } },
    grid, tooltip,
    states: { hover: { filter: { type: "darken" } } },
  };
  return <Chart options={options} series={[{ name: "Value", data: data.map((d) => d.value) }]} type="bar" height={height} />;
}

export function ApexHBar({ data, height = 240, funnel = false }: { data: Pt[]; height?: number; funnel?: boolean }) {
  const rows = funnel ? [...data].sort((a, b) => b.value - a.value) : data;
  const options: ApexOptions = {
    chart: base("bar", height),
    colors: colorsOf(rows),
    plotOptions: {
      bar: {
        horizontal: true,
        distributed: true,
        borderRadius: 6,
        borderRadiusApplication: "end",
        barHeight: funnel ? "78%" : "58%",
        isFunnel: funnel,
        isFunnel3d: false,
      },
    },
    fill: { type: "gradient", gradient: { shade: "light", type: "horizontal", shadeIntensity: 0.25, opacityFrom: 1, opacityTo: 0.82, stops: [0, 100] } },
    dataLabels: funnel
      ? { enabled: true, formatter: (val: number, opt: any) => rows[opt.dataPointIndex].name, dropShadow: { enabled: true }, style: { fontSize: "12px", fontWeight: 600 } }
      : noDL,
    legend: { show: false },
    xaxis: { ...axis, categories: rows.map((d) => d.name) },
    grid, tooltip,
  };
  return <Chart options={options} series={[{ name: "Value", data: rows.map((d) => d.value) }]} type="bar" height={height} />;
}

export function ApexFunnel({ data, height = 260 }: { data: Pt[]; height?: number }) {
  return <ApexHBar data={data} height={height} funnel />;
}

export function ApexDonut({ data, height = 240, pie = false }: { data: Pt[]; height?: number; pie?: boolean }) {
  const options: ApexOptions = {
    chart: base(pie ? "pie" : "donut", height),
    colors: colorsOf(data),
    labels: data.map((d) => d.name),
    stroke: { width: 2, colors: ["#fff"] },
    legend: { position: "right", fontSize: "12px", markers: { size: 6 }, itemMargin: { vertical: 3 } },
    dataLabels: { enabled: true, style: { fontSize: "11px", fontWeight: 600 }, dropShadow: { enabled: false }, formatter: (v: number) => `${Math.round(v)}%` },
    plotOptions: pie ? {} : { pie: { donut: { size: "64%", labels: { show: true, total: { show: true, label: "Total", fontSize: "13px", color: "#65718c" } } } } },
    fill: { type: "gradient", gradient: { shade: "light", shadeIntensity: 0.2, opacityFrom: 1, opacityTo: 0.9 } },
    tooltip,
    responsive: [{ breakpoint: 640, options: { legend: { position: "bottom" } } }],
  };
  return <Chart options={options} series={data.map((d) => d.value)} type={pie ? "pie" : "donut"} height={height} />;
}

export function ApexPie({ data, height = 240 }: { data: Pt[]; height?: number }) {
  return <ApexDonut data={data} height={height} pie />;
}

export function ApexLine({ data, height = 240, color = "#10b981" }: { data: Pt[]; height?: number; color?: string }) {
  const options: ApexOptions = {
    chart: base("line", height),
    colors: [color],
    stroke: { curve: "smooth", width: 3, lineCap: "round" },
    markers: { size: 0, strokeWidth: 0, hover: { size: 6 } },
    dataLabels: noDL,
    xaxis: { ...axis, categories: data.map((d) => d.name), tickAmount: 6 },
    grid, tooltip,
    fill: { type: "gradient", gradient: { shade: "dark", gradientToColors: [color], shadeIntensity: 1, type: "horizontal", opacityFrom: 1, opacityTo: 1, stops: [0, 100] } },
  };
  return <Chart options={options} series={[{ name: "Value", data: data.map((d) => d.value) }]} type="line" height={height} />;
}

export function ApexArea({ data, height = 240, color = "#3463ff" }: { data: Pt[]; height?: number; color?: string }) {
  const options: ApexOptions = {
    chart: base("area", height),
    colors: [color],
    stroke: { curve: "smooth", width: 2.5 },
    dataLabels: noDL,
    xaxis: { ...axis, categories: data.map((d) => d.name), tickAmount: 6 },
    grid, tooltip,
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.04, stops: [0, 95] } },
  };
  return <Chart options={options} series={[{ name: "Value", data: data.map((d) => d.value) }]} type="area" height={height} />;
}

export function ApexHeatmap({ data, height = 240 }: { data: Pt[]; height?: number }) {
  const options: ApexOptions = {
    chart: { ...base("heatmap", height), dropShadow: { enabled: false } },
    colors: ["#3463ff"],
    dataLabels: { enabled: true, style: { colors: ["#fff"], fontWeight: 600 } },
    plotOptions: { heatmap: { radius: 6, enableShades: true, shadeIntensity: 0.55, colorScale: { inverse: false } } },
    stroke: { width: 3, colors: ["#fff"] },
    xaxis: { ...axis },
    tooltip,
  };
  return <Chart options={options} series={[{ name: "Value", data: data.map((d) => ({ x: d.name, y: d.value })) }]} type="heatmap" height={height} />;
}

export function ApexTreemap({ data, height = 240 }: { data: Pt[]; height?: number }) {
  const options: ApexOptions = {
    chart: { ...base("treemap", height), dropShadow: { enabled: false } },
    colors: colorsOf(data),
    dataLabels: { enabled: true, style: { fontSize: "12px", fontWeight: 700 } },
    plotOptions: { treemap: { distributed: true, enableShades: false } },
    legend: { show: false },
    tooltip,
  };
  return <Chart options={options} series={[{ name: "Value", data: data.map((d) => ({ x: d.name, y: d.value })) }]} type="treemap" height={height} />;
}

export function ApexRadialBar({ data, height = 240 }: { data: Pt[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const series = data.map((d) => Math.round((d.value / max) * 100));
  const options: ApexOptions = {
    chart: base("radialBar", height),
    colors: colorsOf(data),
    labels: data.map((d) => d.name),
    legend: { show: true, position: "bottom", fontSize: "11px", markers: { size: 6 } },
    plotOptions: {
      radialBar: {
        hollow: { size: "34%" },
        track: { background: "#eef2f7" },
        dataLabels: {
          name: { fontSize: "12px" },
          value: { fontSize: "18px", fontWeight: 700, formatter: (v) => `${Math.round(Number(v))}%` },
          total: { show: true, label: "Scale", formatter: () => "Max" },
        },
      },
    },
    stroke: { lineCap: "round" },
    tooltip: { ...tooltip, y: { formatter: (_v, opts) => String(data[opts.seriesIndex]?.value ?? 0) } },
  };
  return <Chart options={options} series={series} type="radialBar" height={height} />;
}

export function ApexGrouped({ data, keys, height = 240, stacked = false }: { data: any[]; keys: Key[]; height?: number; stacked?: boolean }) {
  const options: ApexOptions = {
    chart: { ...base("bar", height), stacked },
    colors: keys.map((k) => k.color),
    plotOptions: { bar: { borderRadius: 6, borderRadiusApplication: "end", columnWidth: "58%", ...(stacked ? {} : { dataLabels: { position: "top" } }) } },
    fill: { type: "gradient", gradient: { shade: "light", type: "vertical", shadeIntensity: 0.2, opacityFrom: 1, opacityTo: 0.8 } },
    dataLabels: noDL,
    legend: { position: "top", horizontalAlign: "right", markers: { size: 6 }, fontSize: "11px" },
    xaxis: { ...axis, categories: data.map((d) => d.name) },
    grid, tooltip,
  };
  const series = keys.map((k) => ({ name: k.label, data: data.map((d) => d[k.key] ?? 0) }));
  return <Chart options={options} series={series} type="bar" height={height} />;
}
