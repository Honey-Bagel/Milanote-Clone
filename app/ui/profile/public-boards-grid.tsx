"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Board {
  id: string;
  title: string;
  description?: string;
  created_at: number;
  updated_at?: number;
  is_public: boolean;
}

interface PublicBoardsGridProps {
  boards: Board[];
}

export function PublicBoardsGrid({ boards }: PublicBoardsGridProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {boards.map((board) => (
        <Card
          key={board.id}
          className={cn(
            "group transition-all duration-300",
            "hover:shadow-xl hover:scale-105 hover:border-primary/50",
            "bg-card hover:bg-card-hover"
          )}
        >
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-xl line-clamp-1 group-hover:text-primary transition-colors">
                {board.title}
              </CardTitle>
              <Badge variant="outline" className="shrink-0">
                <Users className="size-3 mr-1" />
                Public
              </Badge>
            </div>
            {board.description && (
              <CardDescription className="line-clamp-2">
                {board.description}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Created {formatDate(board.created_at)}</span>
              {board.updated_at && board.updated_at !== board.created_at && (
                <span>Updated {formatDate(board.updated_at)}</span>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            >
              <Link href={`/board/${board.id}`} className="gap-2">
                View Board
                <ExternalLink className="size-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
