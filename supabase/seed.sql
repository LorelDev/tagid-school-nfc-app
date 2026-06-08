-- ===========================================================================
-- תגיד – minimal SQL seed (global template only)
--
-- The full demo (school, teacher auth user, tags, activity, live session,
-- groups) requires creating an auth user, which the SQL editor cannot do.
-- Use the programmatic seeder instead:
--
--     node scripts/seed.mjs
--
-- This file just adds a reusable GLOBAL activity template so the
-- "תבניות" screen has content even without running the seeder.
-- ===========================================================================

insert into public.activity_templates (title, description, mode, is_global, template_json)
values (
  'מסע היכרות עם בית הספר',
  'תבנית מוכנה להיכרות תלמידים חדשים עם המרחב הבית-ספרי.',
  'station_race',
  true,
  '{
    "stations": [
      {"title":"שער הכניסה","location_hint":"ליד הכניסה הראשית","points":10,
       "missions":[{"mission_type":"open_text","prompt":"מה הדבר הראשון שגורם לכם להרגיש שייכים במקום חדש?","points":10}]},
      {"title":"הספרייה","location_hint":"בכניסה לספרייה","points":15,
       "missions":[{"mission_type":"multiple_choice","prompt":"למי תפנו אם תצטרכו עזרה בלמידה?","answer_options":["מחנכת","ספרנית","חבר","כל התשובות נכונות"],"correct_answer":"כל התשובות נכונות","points":15}]},
      {"title":"החצר","location_hint":"ליד הספסלים בחצר","points":20,
       "missions":[{"mission_type":"group_reflection","prompt":"כתבו פעולה אחת שיכולה לעזור לתלמיד שמרגיש לבד בהפסקה.","points":20}]},
      {"title":"חדר המחשבים","location_hint":"במעבדת המחשבים","points":20,
       "missions":[{"mission_type":"open_text","prompt":"מצאו רעיון טכנולוגי קטן שיכול לשפר את בית הספר.","points":20}]},
      {"title":"תחנת סיום","location_hint":"ליד חדר הייעוץ","points":30,
       "missions":[{"mission_type":"final_answer","prompt":"חברו את כל התשובות שלכם למשפט אחד: בית ספר טוב הוא מקום שבו...","points":30}]}
    ]
  }'::jsonb
)
on conflict do nothing;
