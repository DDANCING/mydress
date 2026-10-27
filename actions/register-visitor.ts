"use server";

import { db } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";
import { headers } from "next/headers";
import { subDays, format } from "date-fns"

export async function registerVisitor() {
  const now = new Date();
  const start = startOfDay(now);
  const end = endOfDay(now);

  const userAgent = (await headers()).get("user-agent") || "";

  const isMobile = /mobile/i.test(userAgent);

  // Verifica se já existe registro para hoje
  const existing = await db.visitor.findFirst({
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
  });

  if (existing) {
    await db.visitor.update({
      where: { id: existing.id },
      data: {
        mobile: isMobile ? { increment: 1 } : undefined,
        web: !isMobile ? { increment: 1 } : undefined,
      },
    });
  } else {
    await db.visitor.create({
      data: {
        date: now,
        mobile: isMobile ? 1 : 0,
        web: isMobile ? 0 : 1,
      },
    });

    const ninetyDaysAgo = subDays(now, 90);
    await db.visitor.deleteMany({
      where: {
        date: {
          lt: ninetyDaysAgo,
        },
      },
    });
  }
}

type TimeRange = "7d" | "30d" | "90d"

export async function getVisitorsData(
  timeRange: TimeRange
): Promise<{ date: string; desktop: number; mobile: number }[]> {
  let days = 90
  if (timeRange === "30d") days = 30
  if (timeRange === "7d") days = 7

  const startDate = subDays(new Date(), days)

  const visitors = await db.visitor.findMany({
    where: {
      date: {
        gte: startDate,
      },
    },
    orderBy: {
      date: "asc",
    },
  })

  return visitors.map((entry) => ({
    date: format(entry.date, "yyyy-MM-dd"),
    desktop: entry.web,
    mobile: entry.mobile,
  }))
}
