"use server";

import { Sandbox } from "@e2b/desktop";
import { resolution } from "./tool";

export const getDesktop = async (id?: string) => {
  const apiKey = process.env.E2B_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      "E2B_API_KEY environment variable is not set. " +
      "Please add it to your .env.local file. " +
      "Get your API key from https://e2b.dev/docs"
    );
  }

  try {
    if (id) {
      const connected = await Sandbox.connect(id, { apiKey });
      const isRunning = await connected.isRunning();
      if (isRunning) {
        // await connected.stream.start();
        return connected;
      }
    }

    const desktop = await Sandbox.create({
      apiKey,
      resolution: [resolution.x, resolution.y], // Custom resolution
      timeoutMs: 300000, // Container timeout in milliseconds
    });
    await desktop.stream.start();
    return desktop;
  } catch (error) {
    console.error("Error in getDesktop:", error);
    throw error;
  }
};

export const getDesktopURL = async (id?: string) => {
  try {
    const desktop = await getDesktop(id);
    const streamUrl = desktop.stream.getUrl();

    return { streamUrl, id: desktop.sandboxId };
  } catch (error) {
    console.error("Error in getDesktopURL:", error);
    throw error;
  }
};

export const killDesktop = async (id: string = "desktop") => {
  const desktop = await getDesktop(id);
  await desktop.kill();
};
