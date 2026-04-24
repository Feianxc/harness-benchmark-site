import type { IncomingMessage, ServerResponse } from "node:http";

export const config = {
  maxDuration: 10,
};

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const { handleWebRequest } = await import("../apps/web/src/server.js");
  await handleWebRequest(request, response);
}
