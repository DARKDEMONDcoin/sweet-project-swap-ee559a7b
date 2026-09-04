import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { executeSkill } from "@/lib/nour-run.server";
const c = createClient<Database>(process.env["SUPABASE_URL"]!, process.env["SUPABASE_SERVICE_ROLE_KEY"]!, { auth:{persistSession:false} });
const { data: ws } = await c.from("workspaces").select("id").limit(1).single();
const cases: [string, Record<string,string>][] = [
  ["daily-ideas", { business:"متجر عطور فاخر في الرياض", platform:"إنستغرام", dialect:"خليجية (السعودية/الإمارات)", context:"وصلت شحنة عود كمبودي وأمس صار عندنا ٥ نجوم" }],
  ["predict-performance", { draft:"عطرنا الجديد وصل! اطلب الآن.\n---\nثلاث علامات إن عطرك مقلّد — الثالثة يغفلها الجميع.", platform:"إنستغرام", audience:"رجال ٢٥-٤٥ بالرياض" }],
  ["hashtag-lab", { topic:"عطر عود فاخر", platform:"إنستغرام", city:"الرياض", dialect:"خليجية (السعودية/الإمارات)" }],
  ["cross-post-pack", { idea:"كيف تعرف العود الأصلي من المقلّد في ٣٠ ثانية", platforms:"إنستغرام، تيك توك، لينكدإن، إكس", tone:"ودودة", dialect:"خليجية (السعودية/الإمارات)" }],
  ["monthly-social-report", { numbers:"إنستغرام: وصول ١٢٠ ألف، تفاعل ٤٢٠٠، متابعون +٦١٠\nتيك توك: مشاهدات ٣١٠ ألف، تفاعل ٩١٠٠", goal:"زيادة الطلبات", prev:"إنستغرام: وصول ٩٥ ألف، تفاعل ٣١٠٠" }],
  ["evergreen-recycle", { winners:"«٣ أخطاء بتحرق عطرك» وصول ٤٨ ألف تفاعل ٣٢٠٠", platform:"إنستغرام", dialect:"خليجية (السعودية/الإمارات)", gap:"٧ أشهر" }],
  ["ab-test-social", { post:"عطر العود الكمبودي وصل — كمية محدودة.", variable:"الهوك", platform:"إنستغرام", reach:"4000" }],
  ["video-avatar-script", { topic:"ثلاث علامات إن عطرك مقلّد", duration:"35", speaker:"المؤسس", dialect:"خليجية (السعودية/الإمارات)" }],
  ["link-in-bio", { business:"متجر عطور فاخر", links:"المتجر، واتساب، الفروع، الأسعار", goal:"طلب من المتجر", dialect:"خليجية (السعودية/الإمارات)" }],
  ["competitor-benchmark", { us:"متابعون ٨٤٠٠، ٤ منشورات أسبوعياً، متوسط تفاعل ٢١٠", rivals:"@a: ٣٢ ألف متابع ينشر يومياً متوسط تفاعل ٩٠٠\n@b: ١١ ألف متابع ٣ أسبوعياً متوسط ٤٠٠", platform:"إنستغرام" }],
];
const r = await Promise.all(cases.map(async ([skillId, values]) => {
  const t = Date.now();
  try { const o = await executeSkill(c, { workspaceId: ws!.id, employeeId:"sonny", skillId, values, origin:"اختبار سِراج" });
    return { skillId, ok:true, chars:o.output.length, task:Boolean(o.taskId), secs:+((Date.now()-t)/1000).toFixed(1) };
  } catch(e){ return { skillId, ok:false, err: e instanceof Error ? e.message : String(e) }; }
}));
console.log(JSON.stringify(r, null, 1));
