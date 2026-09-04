/**
 * إدارة مفاتيح مزوّدي الذكاء الاصطناعي داخل قاعدة بيانات Supabase (جدول app_secrets).
 * Supabase هو المخزن الوحيد؛ لا خدمة أسرار خارجية ولا بوابات وسيطة.
 */
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const NAMES = ["GEMINI_API_KEY", "OPENROUTER_API_KEY"] as const;
type KeyName = (typeof NAMES)[number];

function mask(value: string): string {
  if (value.length <= 8) return "••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export const getAiKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("app_secrets")
      .select("name, value, updated_at")
      .in("name", NAMES as unknown as string[]);

    const rows = (data ?? []) as { name: string; value: string; updated_at: string }[];
    return NAMES.map((name) => {
      const row = rows.find((r) => r.name === name);
      return {
        name,
        configured: Boolean(row?.value),
        preview: row?.value ? mask(row.value) : "",
        updatedAt: row?.updated_at ?? null,
      };
    });
  });

export const saveAiKeys = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { gemini?: string; openrouter?: string }) => ({
    gemini: (input.gemini ?? "").trim(),
    openrouter: (input.openrouter ?? "").trim(),
  }))
  .handler(async ({ data }) => {
    const rows: { name: KeyName; value: string }[] = [];
    if (data.gemini) rows.push({ name: "GEMINI_API_KEY", value: data.gemini });
    if (data.openrouter) rows.push({ name: "OPENROUTER_API_KEY", value: data.openrouter });
    if (rows.length === 0) return { saved: 0 };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("app_secrets")
      .upsert(
        rows.map((r) => ({ ...r, updated_at: new Date().toISOString() })),
        { onConflict: "name" },
      );
    if (error) throw new Error("تعذّر حفظ المفاتيح في قاعدة البيانات.");

    const { resetProviderKeys } = await import("./provider-keys.server");
    resetProviderKeys();
    return { saved: rows.length };
  });

export const testAiKeys = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { resetProviderKeys, providerKeys } = await import("./provider-keys.server");
    resetProviderKeys();
    const keys = await providerKeys();
    if (!keys.gemini && !keys.openrouter) {
      return { ok: false, message: "لا يوجد مفتاح محفوظ بعد." };
    }
    try {
      const { freeChat } = await import("./nour-research.server");
      const reply = await freeChat("", [{ role: "user", content: "قل: تم" }], {
        maxTokens: 16,
        race: false,
      });
      return { ok: true, message: `المزوّد يعمل. الرد: ${reply.slice(0, 60)}` };
    } catch (error) {
      return { ok: false, message: (error as Error).message };
    }
  });
