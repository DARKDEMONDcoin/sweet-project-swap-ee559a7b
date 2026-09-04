import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { executeSkill } from "@/lib/nour-run.server";
import { skillsFor } from "@/data/skills";
const c = createClient<Database>(process.env["SUPABASE_URL"]!, process.env["SUPABASE_SERVICE_ROLE_KEY"]!, { auth:{persistSession:false} });
const { data: ws } = await c.from("workspaces").select("id").limit(1).single();
// أصعب طلب شامل: علامة عطور فاخرة تطلق خطاً جديداً في رمضان على ٥ منصات
const HARD = `إطلاق خط عطور «ليل العُلا» لمتجر أثير الفاخر (الرياض + دبي، شحن للخليج) قبل رمضان بأسبوعين: خطة ٣٠ يوماً على إنستغرام وتيك توك وإكس ولينكدإن ويوتيوب شورتس، ٣ منشورات يومياً، ميزانية إعلانات ٤٥ ألف ريال، هدف ١٢٠٠ طلب و٢٥٠٠ متابع جديد ومعدل تفاعل ≥٤٫٥٪، جمهور رجال ونساء ٢٥-٤٥ ذوق فاخر يشترون من الجوال ليلاً، لهجة خليجية راقية بلا مبالغة، الالتزام بضوابط الإعلان السعودية، منافسون: @oud.house (٣٢ ألف متابع ينشر يومياً تفاعل ٩٠٠) و@attar.dubai (١١ ألف، ٣ أسبوعياً، تفاعل ٤٠٠)، وأرقامنا الحالية: ٨٤٠٠ متابع، ٤ منشورات أسبوعياً، متوسط تفاعل ٢١٠، وصول ٩٥ ألف، مبيعات ٣١٠ طلب/شهر`;
const skills = skillsFor("sonny");
const fill = (s: (typeof skills)[number]) => Object.fromEntries(s.fields.map((f) => {
  const label = `${f.label} ${f.placeholder ?? ""}`;
  let v = HARD;
  if (f.type === "select" && f.options?.length) v = String(f.options[0]);
  else if (/عدد|count|كم/.test(label) && f.type !== "textarea") v = "3";
  else if (/رابط|url|link/i.test(label)) v = "https://atheer.example.com/leil-alula";
  return [f.id, v];
}));
const r = await Promise.all(skills.map(async (s) => {
  const t = Date.now();
  try { const o = await executeSkill(c, { workspaceId: ws!.id, employeeId:"sonny", skillId: s.id, values: fill(s), origin:"اختبار شامل" });
    return { id: s.id, title: s.title, ok:true, chars:o.output.length, task:Boolean(o.taskId), secs:+((Date.now()-t)/1000).toFixed(1) };
  } catch(e){ return { id: s.id, title: s.title, ok:false, err: (e instanceof Error ? e.message : String(e)).slice(0,140), secs:+((Date.now()-t)/1000).toFixed(1) }; }
}));
console.log(JSON.stringify(r.map(x=>x.ok?`✅ ${x.title} · ${x.chars} حرف · ${x.secs}ث`:`❌ ${x.title} · ${(x as any).err}`), null, 1));
console.log("نجاح:", r.filter(x=>x.ok).length, "/", r.length);
const sample = await executeSkill(c, { workspaceId: ws!.id, employeeId:"sonny", skillId:"social-daily-ideas", values: fill(skills.find(s=>s.id==="social-daily-ideas")!), origin:"عيّنة" });
console.log("\n--- عيّنة مخرجات ---\n", sample.output.slice(0,1500));
