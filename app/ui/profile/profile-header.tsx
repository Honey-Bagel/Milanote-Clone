"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditProfileDialog } from "./edit-profile-dialog";
import { Settings, Mail, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  profile: {
    id: string;
    display_name?: string;
    avatar_url?: string;
    created_at: number;
    last_active?: number;
  };
  email?: string;
  isOwnProfile: boolean;
  boardCount: number;
}

export function ProfileHeader({
  profile,
  email,
  isOwnProfile,
  boardCount,
}: ProfileHeaderProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Get initials from display name or email
  const getInitials = () => {
    if (profile.display_name) {
      return profile.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  // Calculate activity status
  const isActive = profile.last_active
    ? Date.now() - profile.last_active < 1000 * 60 * 30 // Active within 30 minutes
    : false;

  return (
    <>
      <div className="bg-card rounded-xl border border-border p-8 shadow-lg">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="size-24 border-4 border-primary/20">
              <AvatarImage src={profile.avatar_url} alt={profile.display_name || "User"} />
              <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            {isActive && (
              <div className="absolute bottom-2 right-2 size-4 bg-green-500 rounded-full border-2 border-card" />
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-foreground">
                {profile.display_name || "Anonymous User"}
              </h1>
              {isActive && (
                <Badge variant="default" className="bg-green-500">
                  Active
                </Badge>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
              {email && (
                <div className="flex items-center gap-2">
                  <Mail className="size-4" />
                  <span>{email}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="size-4" />
                <span>Joined {formatDate(profile.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {isOwnProfile && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="default"
                onClick={() => setIsEditDialogOpen(true)}
                className="gap-2"
              >
                <Settings className="size-4" />
                Edit Profile
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Dialog */}
      {isOwnProfile && (
        <EditProfileDialog
          profile={profile}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}
    </>
  );
}
