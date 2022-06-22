import ethers from "ethers";
import { DOMAIN, TYPES } from "../constants/typedData";

async function handleRequest(request: Request): Promise<Response> {
  try {
    if (request.method !== "POST") {
      return new Response("hello");
    }
    const text = await request.text();
    const data = JSON.parse(atob(text));
    const addr = ethers.utils.verifyTypedData(
      DOMAIN,
      TYPES,
      data.message,
      data.signature
    );
    return new Response(addr);
  } catch (e: any) {
    return new Response(e.message, { status: 500 });
  }
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request as Request));
});
