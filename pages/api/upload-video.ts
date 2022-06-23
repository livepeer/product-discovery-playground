import type { NextApiRequest, NextApiResponse } from "next";

import FormData from "form-data";
import formidable, { File, IncomingForm } from "formidable";
import fs from "fs";
import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: false,
  },
};

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
    // parse form with a Promise wrapper
    const data: { fields: formidable.Fields; files: formidable.Files } =
      await new Promise((resolve, reject) => {
        const form = new IncomingForm();

        form.parse(req, (err, fields, files) => {
          if (err) return reject(err);
          resolve({ fields, files });
        });
      });

    const file = data?.files?.file as unknown as File;

    const formData = new FormData();
    formData.append("file", fs.createReadStream(file?.filepath));

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
