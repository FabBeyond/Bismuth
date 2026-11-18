import { api } from "./api";

let guildsPromise = null;

export function fetchGuilds() {
  if (guildsPromise) return guildsPromise;

  guildsPromise = api("/guilds").catch((err) => {
    guildsPromise = null;
    throw err;
  });

  return guildsPromise;
}

export function clearGuildsCache() {
  guildsPromise = null;
}
