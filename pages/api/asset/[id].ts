import type { NextApiRequest, NextApiResponse } from "next";

import fetch from "node-fetch";

const LIVEPEER_API_KEY = process.env.LIVEPEER_API_KEY ?? null;

if (!LIVEPEER_API_KEY) {
  throw new Error("LIVEPEER_API_KEY not defined");
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export type Hash = {
  hash: string;
  algorithm: string;
};

export type Track = {
  fps: number;
  type: string;
  codec: string;
  width: number;
  height: number;
  bitrate: number;
  duration: number;
  pixelFormat: string;
  channels?: number;
  sampleRate?: number;
};

export type VideoSpec = {
  format: string;
  tracks: Track[];
  duration: number;
};

export type LivepeerApiResponse = {
  id?: string;
  hash?: Hash[];
  name?: string;
  size?: number;
  status?: string | { phase: string };
  userId?: string;
  createdAt?: number;
  updatedAt?: number;
  videoSpec?: VideoSpec;
  playbackId?: string;
  playbackUrl?: string;
  downloadUrl?: string;

  error?: string;
};

const requestHandler = async (
  req: NextApiRequest,
  res: NextApiResponse<LivepeerApiResponse>
) => {
  if (req.method === "GET") {
    const { id } = req.query;

    const response = await fetch(`https://livepeer.studio/api/asset/${id}`, {
      method: "GET",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${LIVEPEER_API_KEY}`,
      },
    });
    if (response.status === 200) {
      const json = await response.json();

      return res.status(200).json(json as LivepeerApiResponse);
    } else {
      console.error(response.statusText);
    }
  } else {
    // Handle any other HTTP method
    return res
      .status(405)
      .json({ error: `Method '${req.method}' Not Allowed` });
  }

  return res.status(500).json({ error: `An error occurred.` });
};

export default requestHandler;
