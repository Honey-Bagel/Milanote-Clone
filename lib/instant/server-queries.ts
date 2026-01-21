/**
 * Server-side InstantDB queries
 * These functions use the InstantDB Admin API for server-side data fetching
 */

const INSTANT_APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID!;
const INSTANT_ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN!;

if (!INSTANT_APP_ID || !INSTANT_ADMIN_TOKEN) {
  throw new Error("Missing InstantDB environment variables");
}

/**
 * Get a board by its public share token
 * Used for public board views
 */
export async function getBoardByShareToken(token: string) {
  try {
    const response = await fetch(
      `https://api.instantdb.com/admin/query?app_id=${INSTANT_APP_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${INSTANT_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          boards: {
            $: {
              where: {
                share_token: token,
                is_public: true,
              },
              limit: 1,
            },
          },
        }),
        cache: "no-store", // Don't cache as board data can change
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch board by share token:", response.statusText);
      return null;
    }

    const data = await response.json();
    return data.boards?.[0] || null;
  } catch (error) {
    console.error("Error fetching board by share token:", error);
    return null;
  }
}

/**
 * Get all boards for a user (server-side)
 * Used for server-side rendering of dashboard
 */
export async function getUserBoards(userId: string, limit?: number) {
  try {
    const response = await fetch(
      `https://api.instantdb.com/admin/query?app_id=${INSTANT_APP_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${INSTANT_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          boards: {
            $: {
              where: {
                owner_id: userId,
              },
              order: {
                updated_at: "desc",
              },
              ...(limit && { limit }),
            },
          },
        }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch user boards:", response.statusText);
      return [];
    }

    const data = await response.json();
    return data.boards || [];
  } catch (error) {
    console.error("Error fetching user boards:", error);
    return [];
  }
}
