import type { NextApiRequest, NextApiResponse } from "next";

import fetch from "node-fetch";

export type VideoAttributes = {
  /**
   * Identifier with URL prefix associated with protocol
   */
  contentID: string;
  /**
   * Block hash on Ethereum when payload was signed
   */
  creationBlockHash?: string;
  /**
   * Arbitrary metadata defined by the user.
   */
  metadata?: { [key: string]: any };
};

export type SignedVideo = {
  /**
   * The signed content
   */
  body: VideoAttributes;
  /**
   * The signature over the message body hash
   */
  signature: string;
  /**
   * EOA which signed the payload
   */
  signer: string;
  /**
   * EIP-712 types for the signed payload
   */
  signatureTypes: { [key: string]: any };
};

const LIVEPEER_API_KEY = process.env.LIVEPEER_API_KEY ?? null;

if (!LIVEPEER_API_KEY) {
  throw new Error("LIVEPEER_API_KEY not defined");
}

export type Status = {
  phase: string;
  updatedAt: number;
};

export type Asset = {
  id: string;
  playbackId: string;
  userId: string;
  createdAt: number;
  status: Status;
  name: string;
};

export type Import = {
  url: string;
};

export type Params = {
  import: Import;
};

export type Status2 = {
  phase: string;
  updatedAt: number;
};

export type Task = {
  id: string;
  createdAt: number;
  type: string;
  outputAssetId: string;
  userId: string;
  params: Params;
  status: Status2;
};

export type LivepeerApiResponse = {
  asset: Asset;
  task: Task;
};

export type CreateResponse = {
  hash?: string;
  url?: string;
  outputAssetId?: string;
  signedVideo?: SignedVideo;
  error?: string;
};

export type CreateAssetRequest = {
  hash: string;
};

export const config = {
  api: {
    bodyParser: true,
  },
};

const requestHandler = async (
  req: NextApiRequest,
  res: NextApiResponse<CreateResponse>
) => {
  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const ipfsHash = body.hash;
    const INFURA_IPFS_ID = process.env.INFURA_IPFS_ID;
    const INFURA_IPFS_SECRET = process.env.INFURA_IPFS_SECRET;

    if (!INFURA_IPFS_ID || !INFURA_IPFS_SECRET) {
      throw new Error("Missing INFURA_IPFS_ID and INFURA_IPFS_SECRET");
    }

    if (!ipfsHash) {
      return res.status(500).json({ error: `Bad IPFS hash.` });
    }

    const responseInfura = await fetch(
      `https://ipfs.infura.io:5001/api/v0/cat?arg=${ipfsHash}`,
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " + btoa(INFURA_IPFS_ID + ":" + INFURA_IPFS_SECRET),
        },
      }
    );

    const metadataJson = (await responseInfura.json()) as SignedVideo;

    const ipfsUrl = `https://infura-ipfs.io/ipfs/${metadataJson.body.contentID.replace(
      "ipfs://",
      ""
    )}`;

    const response = await fetch("https://livepeer.studio/api/asset/import", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${LIVEPEER_API_KEY}`,
      },
      body: JSON.stringify({
        name: metadataJson.body.contentID,
        url: ipfsUrl,
      }),
    });

    if (response.ok) {
      const json2 = (await response.json()) as LivepeerApiResponse;

      return res.status(200).json({
        hash: ipfsHash ?? "",
        url: ipfsUrl ?? "",
        outputAssetId: json2?.task?.outputAssetId ?? "",
        signedVideo: metadataJson,
      });
    } else {
      console.error(response);
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
