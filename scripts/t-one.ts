import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { executeSkill } from "@/lib/nour-run.server";
const c = createClient<Database>(process.env["SUPABASE_URL"]!, process.env["SUPABASE_SERVICE_ROLE_KEY"]!, { auth:{persistSession:false} });
const { data: ws } = await c.from("workspaces").select("id").limit(1).single();
const o = await executeSkill(c, { workspaceId: ws!.id, employeeId:"sonny", skillId:"predict-performance", values:{
  draft:"عطرنا الجديد «ليل العُلا» وصل — اطلبه الآن.\n---\nثلاث علامات تكشف أن عودك مقلّد… الثالثة يغفلها الجميع.",
  platform:"إنستغرام", audience:"رجال ونساء ٢٥-٤٥ بالرياض ودبي، ذوق فاخر، يشترون من الجوال ليلاً",
}, origin:"فحص" });
console.log("len:", o.output.length, "| msg:", o.messageId, "| task:", o.taskId);
console.log(o.output.slice(0,1200));
