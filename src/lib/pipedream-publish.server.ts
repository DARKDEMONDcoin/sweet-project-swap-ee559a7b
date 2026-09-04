/**
 * النشر الفعلي على المنصات الاجتماعية عبر إجراءات Pipedream الجاهزة.
 * يُستخدم من دالة الخادم (بطلب المستخدم) ومن الجدولة التلقائية بنفس المنطق.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { pipedreamApp } from "@/data/pipedream-apps";
import { pipedreamConfig, runAction, missingConfigError } from "./pipedream.server";

type Admin = SupabaseClient<Database>;

export type PublishResult = {
  provider: string;
  accountId: string;
  result: unknown;
};

export async function publishToPlatform(
  admin: Admin,
  params: { workspaceId: string; provider: string; text: string; imageUrl?: string },
): Promise<PublishResult> {
  const app = pipedreamApp(params.provider);
  const metaProxy = params.provider === "instagram" || params.provider === "facebook";
  if (!metaProxy && (!app?.publishComponent || !app.accountProp)) {
    throw new Error(`النشر المباشر غير متاح بعد على ${app?.label ?? params.provider}.`);
  }

  const config = await pipedreamConfig();
  if (!config) throw missingConfigError();

  const { data: account } = await admin
    .from("pipedream_accounts")
    .select("account_id")
    .eq("workspace_id", params.workspaceId)
    .eq("provider", params.provider)
    .eq("status", "connected")
    .maybeSingle();

  if (!account) throw new Error(`${app?.label ?? params.provider} غير مربوط بعد — اربطه من صفحة التكاملات.`);

  // ميتا (إنستجرام/فيسبوك): ننشر عبر Graph API مباشرة من خلال وكيل Pipedream،
  // لأن الإجراءات الجاهزة لا تدعم النص الكامل مع الصورة على إنستجرام.
  if (metaProxy) {
    const result = await publishMeta(
      config,
      params.workspaceId,
      account.account_id,
      params.provider as "instagram" | "facebook",
      params.text,
      params.imageUrl,
    );
    return { provider: params.provider, accountId: account.account_id, result };
  }
  if (!app?.publishComponent || !app.accountProp) {
    throw new Error(`النشر المباشر غير متاح بعد على ${params.provider}.`);
  }


  const props: Record<string, unknown> = {
    [app.accountProp]: { authProvisionId: account.account_id },
    ...textProps(params.provider, params.text),
  };
  if (params.imageUrl) Object.assign(props, imageProps(params.provider, params.imageUrl));

  const result = await runAction(config, {
    workspaceId: params.workspaceId,
    componentId: app.publishComponent,
    configuredProps: props,
  });

  return { provider: params.provider, accountId: account.account_id, result };
}

/** اسم حقل النص يختلف بين إجراءات كل منصة. */
function textProps(provider: string, text: string): Record<string, string> {
  switch (provider) {
    case "instagram":
      return { caption: text };
    case "x":
      return { text: text.slice(0, 280) };
    case "facebook":
      return { message: text };
    case "linkedin":
      return { text };
    case "slack":
      return { text };
    case "gmail":
      return { body: text };
    default:
      return { text };
  }
}

function imageProps(provider: string, imageUrl: string): Record<string, string> {
  switch (provider) {
    case "instagram":
      return { mediaType: "image", imageUrl };
    case "facebook":
      return { link: imageUrl };
    default:
      return { imageUrl };
  }
}
