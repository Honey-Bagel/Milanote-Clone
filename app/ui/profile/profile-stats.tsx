"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LayoutGrid, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileStatsProps {
  profile: {
    created_at: number;
    last_active?: number;
  };
  boardCount: number;
}

export function ProfileStats({ profile, boardCount }: ProfileStatsProps) {
  // Calculate days since joined
  const daysSinceJoined = Math.floor(
    (Date.now() - profile.created_at) / (1000 * 60 * 60 * 24)
  );

  // Format last active
  const formatLastActive = () => {
    if (!profile.last_active) return "Not recently";

    const minutesAgo = Math.floor((Date.now() - profile.last_active) / (1000 * 60));

    if (minutesAgo < 1) return "Just now";
    if (minutesAgo < 60) return `${minutesAgo}m ago`;

    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) return `${hoursAgo}h ago`;

    const daysAgo = Math.floor(hoursAgo / 24);
    if (daysAgo < 30) return `${daysAgo}d ago`;

    const monthsAgo = Math.floor(daysAgo / 30);
    return `${monthsAgo}mo ago`;
  };

  const stats = [
    {
      icon: LayoutGrid,
      label: "Public Boards",
      value: boardCount.toString(),
      color: "text-primary",
    },
    {
      icon: Calendar,
      label: "Days Active",
      value: daysSinceJoined.toString(),
      color: "text-accent",
    },
    {
      icon: Clock,
      label: "Last Seen",
      value: formatLastActive(),
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.label}
            className={cn(
              "transition-all duration-300",
              "hover:shadow-lg hover:scale-105 hover:border-primary/30"
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-lg bg-primary/10", stat.color)}>
                  <Icon className="size-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
