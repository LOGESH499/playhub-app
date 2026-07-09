/**
 * Fixed UUIDs from supabase/seed.sql for reproducible local development.
 */
export const DEMO_IDS = {
  tenant: "11111111-1111-1111-1111-111111111111",
  venues: {
    smashArena: "22222222-2222-2222-2222-222222222221",
    aquaSports: "22222222-2222-2222-2222-222222222222",
    greenField: "22222222-2222-2222-2222-222222222223",
  },
  academy: {
    footballProgram: "55555555-5555-5555-5555-555555555551",
    u10Batch: "66666666-6666-6666-6666-666666666661",
  },
  promo: {
    playhub10: "77777777-7777-7777-7777-777777777771",
  },
} as const;
