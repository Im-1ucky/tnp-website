import "dotenv/config";

const { INSTAGRAM_ACCESS_TOKEN } = process.env;

if (!INSTAGRAM_ACCESS_TOKEN) {
  throw new Error("INSTAGRAM_ACCESS_TOKEN is not set");
}

export { INSTAGRAM_ACCESS_TOKEN };
