"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/instant/db";
import { ProfileHeader } from "@/app/ui/profile/profile-header";
import { ProfileStats } from "@/app/ui/profile/profile-stats";
import { PublicBoardsGrid } from "@/app/ui/profile/public-boards-grid";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = use(params);
  const { user: currentUser } = db.useAuth();

  // Fetch the user with their profile and public boards
  const { data, isLoading, error } = db.useQuery({
    $users: {
      $: {
        where: {
          id: userId,
        },
      },
      profile: {},
      owned_boards: {
        $: {
          where: {
            is_public: true,
          },
        },
      },
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="shimmer h-12 w-12 rounded-full mx-auto" />
          <div className="shimmer h-6 w-48 rounded-md" />
        </div>
      </div>
    );
  }

  if (error || !data?.$users || data.$users.length === 0) {
    notFound();
  }

  const userData = data.$users[0];
  const profile = userData.profile;
  const publicBoards = userData.owned_boards || [];
  const isOwnProfile = currentUser?.id === userId;

  // If user exists but has no profile, show not found
  if (!profile) {
    notFound();
  }

  return (
    <db.SignedIn>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Profile Header */}
          <ProfileHeader
            profile={profile}
            email={userData.email}
            isOwnProfile={isOwnProfile}
            boardCount={publicBoards.length}
          />

          {/* Profile Stats */}
          <ProfileStats
            profile={profile}
            boardCount={publicBoards.length}
          />

          {/* Public Boards Grid */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {isOwnProfile ? "Your Public Boards" : "Public Boards"}
            </h2>
            {publicBoards.length > 0 ? (
              <PublicBoardsGrid boards={publicBoards} />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {isOwnProfile
                    ? "You don't have any public boards yet. Create a board and make it public to share it with others!"
                    : "This user hasn't shared any public boards yet."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </db.SignedIn>
  );
}
