import { NhostClient } from "@nhost/nextjs"

const subdomain = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || "ufqoblprovsdspfuviqa"
const region = process.env.NEXT_PUBLIC_NHOST_REGION || "ap-south-1"

console.log("[v0] Nhost config:", { subdomain, region })

export const nhost = new NhostClient({
  subdomain,
  region,
})
