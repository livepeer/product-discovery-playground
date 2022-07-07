import type { NextApiRequest, NextApiResponse } from "next";

import FormData from "form-data";
import fetch from "node-fetch";
import { SignaturePayload } from "./asset/create";

type IPFSUploadResponse = {
  Hash: string;
  Name: string;
  Size: string;
};

export type UploadResponse = {
  hash?: string;
  error?: string;
};

const requestHandler = async (
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>
) => {
  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const formData = new FormData();

    const indexFile = "./index.json";

    const payload: SignaturePayload = body;

    formData.append("file", JSON.stringify(payload));

    const response = await fetch(
      "https://ipfs.infura.io:5001/api/v0/add?pin=true",
      {
        method: "POST",
        body: formData,
      }
    );

    if (response.ok) {
      const json = (await response.json()) as IPFSUploadResponse;

      return res.status(200).json({
        hash: json?.Hash ?? "",
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
