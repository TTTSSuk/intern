// pages/api/history-videos.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return (res as any).status(405).json({ message: "Method not allowed" });
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== "string") {
    return (res as any).status(400).json({ message: "Missing or invalid userId" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("login-form-app"); 

    const history = await db
      .collection("listfile")
      .find({ userId })
      .project({
        _id: 1,
        userId: 1,
        originalName: 1,
        status: 1,
        createdAt: 1,
        clips: 1,
        executionIdHistory: 1,
        folders: 1,
        extractPath: 1,
      })
      .sort({ createdAt: -1 })
      .toArray();

    console.log("DEBUG history fetched for user:", userId, history.length);
    (res as any).status(200).json(history);
  } catch (error) {
    console.error("Error fetching history videos:", error);
    (res as any).status(500).json({ message: "Internal server error" });
  }
}
