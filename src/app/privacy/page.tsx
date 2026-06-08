import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="text-sm text-brand">→ דף הבית</Link>
      <h1 className="mt-3 text-2xl font-bold">מדיניות פרטיות</h1>
      <div className="mt-4 space-y-3 text-slate-700">
        <p>תגיד מיועד לשימוש חינוכי בבתי ספר, ומתוכנן עם פרטיות כברירת מחדל.</p>
        <ul className="list-disc space-y-2 pr-5">
          <li>תלמידים אינם נדרשים לכתובת אימייל או חשבון.</li>
          <li>נשמר שם תצוגה בלבד (כולל כינוי), ללא נתונים אישיים רגישים.</li>
          <li>זיהוי המשתתף נשמר באופן מקומי במכשיר (cookie) ומוגבל בזמן.</li>
          <li>המורה רואה תשובות לימודיות והתקדמות בלבד.</li>
          <li>נתונים מופרדים לפי בית ספר (school_id).</li>
          <li>אין אבחון פסיכולוגי אוטומטי. מדדי מעורבות מנוסחים באופן ניטרלי.</li>
          <li>ניתן למחוק נתוני משתתף או מפגש לפי בקשת בית הספר.</li>
        </ul>
        <p>לשאלות בנושא פרטיות יש לפנות למנהל/ת בית הספר.</p>
      </div>
    </main>
  );
}
