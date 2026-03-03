"use client"

import React, { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
    count: {
        label: "Penonton",
        color: "#ff8400ff", // YouTube Red
    },
} satisfies ChartConfig

interface LiveAnalyticsChartProps {
    data: { time: string; count: number }[]
}

export function LiveAnalyticsChart({ data }: LiveAnalyticsChartProps) {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    if (!data || data.length === 0) {
        return (
            <div className="flex h-[200px] w-full items-center justify-center text-sm text-muted-foreground border rounded-lg bg-muted/20">
                Menunggu data analitik...
            </div>
        )
    }

    return (
        <ChartContainer config={chartConfig} className="w-full h-[250px]">
            <AreaChart
                data={data}
                margin={{
                    top: 10,
                    right: 10,
                    left: isMobile ? 0 : 15,
                    bottom: 0,
                }}
            >
                <defs>
                    <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.1} />
                    </linearGradient>
                </defs>
                {!isMobile && (
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
                )}
                <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    hide={isMobile}
                    className="text-xs text-muted-foreground"
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                    hide={isMobile}
                    width={40}
                    className="text-xs text-muted-foreground"
                />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                />
                <Area
                    dataKey="count"
                    type="monotone"
                    fill="url(#fillCount)"
                    fillOpacity={0.4}
                    stroke="var(--color-count)"
                    strokeWidth={2}
                    activeDot={{ r: 6, fill: "var(--color-count)" }}
                    isAnimationActive={true}
                />
            </AreaChart>
        </ChartContainer>
    )
}
