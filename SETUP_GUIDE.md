# 🚀 Agent Mary - מדריך הגדרה והפעלה

## 📋 תוכן עניינים

1. [סקירה כללית](#סקירה-כללית)
2. [דרישות מקדימות](#דרישות-מקדימות)
3. [הגדרת Supabase](#הגדרת-supabase)
4. [הגדרת API Keys](#הגדרת-api-keys)
5. [הרצה מקומית](#הרצה-מקומית)
6. [גישה לאפליקציה](#גישה-לאפליקציה)
7. [שימוש ב-Agent Mary](#שימוש-ב-agent-mary)
8. [פתרון בעיות](#פתרון-בעיות)

---

## 🎯 סקירה כללית

**Agent Mary** היא פלטפורמת AI חכמה לניהול חוויות תיירים בארץ הקודש. המערכת כוללת:

- 💬 **צ'אט AI** עם GPT-5-nano למענה על שאלות תיירים
- 🎨 **יצירת תמונות מעוצבות** עם Gemini Nano Banana Pro
- 📖 **פסוקים מקראיים** רלוונטיים לכל מיקום (תנ"ך בלבד)
- 📱 **ממשק מובייל-first** עם עיצוב מודרני
- 👥 **דשבורדים** למדריכים, משרד התיירות, ואדמין

---

## 🔧 דרישות מקדימות

לפני שמתחילים, ודא שיש לך:

- [x] חשבון Supabase (https://supabase.com)
- [x] חשבון OpenAI עם API key (https://platform.openai.com)
- [x] חשבון Google AI עם Gemini API key (https://aistudio.google.com/apikey)
- [x] Node.js 18+ מותקן
- [x] Git מותקן
- [x] חשבון Vercel (אופציונלי, לפריסה)

---

## 📊 הגדרת Supabase

### שלב 1: יצירת פרויקט

1. היכנס ל-Supabase Dashboard
2. לחץ על **"New Project"**
3. מלא את הפרטים:
   - **Name:** `agent-mary`
   - **Database Password:** שמור סיסמה חזקה
   - **Region:** בחר אזור קרוב לישראל (Europe West)
4. לחץ **"Create new project"** והמתן כמה דקות

### שלב 2: הרצת Migration

1. פתח את **SQL Editor** בתפריט הצדדי
2. העתק את כל התוכן מקובץ `migrations/001_init.sql`
3. הדבק והרץ את הסקריפט
4. וודא שלא היו שגיאות

הסקריפט יוצר:
- טבלאות: `guides`, `posts`, `access_keys`, `app_settings`
- נתוני דמו: 2 מדריכים (Sarah, David)
- מפתחות גישה לכל התפקידים

### שלב 3: הגדרת Storage Bucket

1. עבור ל-**Storage** בתפריט הצדדי
2. לחץ **"Create a new bucket"**
3. הגדר:
   - **Name:** `agent-mary`
   - **Public bucket:** ✅ (מסמן)
   - **File size limit:** 50 MB
   - **Allowed MIME types:** 
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `image/webp`
4. לחץ **"Create bucket"**

### שלב 4: הגדרת Policies

לחץ על ה-bucket `agent-mary` ועבור ל-**Policies**:

1. **Policy 1 - Allow Public Uploads:**
```sql
CREATE POLICY "Allow public uploads to agent-mary"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'agent-mary');
```

2. **Policy 2 - Allow Public Access:**
```sql
CREATE POLICY "Allow public access to agent-mary"
ON storage.objects FOR SELECT
USING (bucket_id = 'agent-mary');
```

3. **Policy 3 - Allow Public Delete:**
```sql
CREATE POLICY "Allow public delete from agent-mary"
ON storage.objects FOR DELETE
USING (bucket_id = 'agent-mary');
```

---

## 🔑 הגדרת API Keys

### שלב 1: Supabase Keys

1. ב-Supabase Dashboard, עבור ל-**Project Settings** > **API**
2. העתק:
   - **Project URL** (תחת Project URL)
   - **anon public** key (תחת Project API keys)

### שלב 2: OpenAI API Key

1. היכנס ל-https://platform.openai.com/api-keys
2. לחץ **"Create new secret key"**
3. שם: `Agent Mary - Production`
4. העתק את המפתח (תראה אותו רק פעם אחת!)

### שלב 3: Gemini API Key

1. היכנס ל-https://aistudio.google.com/apikey
2. לחץ **"Create API key"**
3. בחר פרויקט או צור חדש
4. העתק את המפתח

### שלב 4: יצירת קובץ Environment Variables

צור קובץ `.env.local` בשורש הפרויקט:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenAI (GPT-5-nano for chat)
OPENAI_API_KEY=sk-your-openai-api-key

# Google Gemini (Nano Banana Pro for images)
GEMINI_API_KEY=your-gemini-api-key
```

**⚠️ חשוב:** אל תשתף את המפתחות האלה! הוסף את `.env.local` ל-`.gitignore`

---

## 💻 הרצה מקומית

### שלב 1: התקנת Dependencies

```bash
cd /Users/idosegev/Downloads/TriRoars/Leaders/tayarot
npm install
```

### שלב 2: וידוא Environment Variables

```bash
# בדוק שהקובץ קיים
cat .env.local

# אם אין, צור אותו עם המפתחות מהשלב הקודם
```

### שלב 3: הרצת Dev Server

```bash
npm run dev
```

האפליקציה תרוץ ב-http://localhost:3000

### שלב 4: Build לבדיקה

```bash
npm run build
npm start
```

---

## 🌐 גישה לאפליקציה

### Vercel Deployment (כבר פרוס!)

**Production URL:** https://tayarot-865pmy6zt-idosegev23s-projects.vercel.app

### הגדרת Environment Variables בVercel

1. עבור ל-Vercel Dashboard > Project Settings > Environment Variables
2. הוסף את כל המשתנים מ-`.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - `GEMINI_API_KEY`
3. לחץ **"Redeploy"** לאחר הוספת המשתנים

---

## 🎮 שימוש ב-Agent Mary

### לינקים לגישה (מקומי או Vercel)

החלף `YOUR_DOMAIN` ב:
- מקומי: `http://localhost:3000`
- Vercel: `https://tayarot-865pmy6zt-idosegev23s-projects.vercel.app`

---

### 🔴 Super Admin Dashboard

**מפתח גישה:** `ak_demo_admin_key_12345`

**קישור:**
```
YOUR_DOMAIN/d/admin?k=ak_demo_admin_key_12345
```

**יכולות:**
- ניהול כל הפוסטים של כל המדריכים
- אישור/דחייה/פרסום פוסטים
- צפייה בסטטיסטיקות
- ניהול מערכת

---

### 👥 Guide Dashboards (דשבורד מדריך)

#### Sarah Cohen
**מפתח גישה:** `ak_sarah_guide_key_67890`

**קישור:**
```
YOUR_DOMAIN/d/guide/sarah?k=ak_sarah_guide_key_67890
```

#### David Levi
**מפתח גישה:** `ak_david_guide_key_11223`

**קישור:**
```
YOUR_DOMAIN/d/guide/david?k=ak_david_guide_key_11223
```

**יכולות:**
- ניהול פוסטים של הקבוצה שלו
- אישור/דחייה פוסטים
- שיתוף פוסטים לפייסבוק
- צפייה בסטטיסטיקות שלו

---

### 🏛️ Ministry of Tourism Dashboard

**מפתח גישה:** `ak_tourism_dash_key_44556`

**קישור:**
```
YOUR_DOMAIN/d/tourism?k=ak_tourism_dash_key_44556
```

**יכולות:**
- צפייה בכל הפוסטים (read-only)
- סטטיסטיקות מצרפיות
- ניתוח מגמות
- דוחות

---

### 🌍 Tourist Pages (דפים ציבוריים)

**ללא צורך במפתח גישה!**

#### Sarah's Group
```
YOUR_DOMAIN/g/sarah
```

#### David's Group
```
YOUR_DOMAIN/g/david
```

**תכונות:**
- צ'אט עם Agent Mary (GPT-5-nano)
- שאלות על מיקומים ומסלולים
- העלאת תמונות וחוויות
- יצירת פוסטים מעוצבים עם AI

---

## 🎨 תהליך יצירת פוסט (Tourist Flow)

### שלב 1: פתיחת הצ'אט
תייר נכנס לדף המדריך שלו ורואה את Mary:

```
Mary: "Hi! 👋 I'm Mary, your virtual Israel guide. 
       I'm here to help you get the most out of your journey."
```

### שלב 2: שיחה חופשית
תייר יכול לשאול כל שאלה:
- "What's special about Jerusalem?"
- "What's on today's route?"
- או ללחוץ על הכפתור הצף 📷

### שלב 3: העלאת תמונות
```
Mary: "Share photos from today?"
```
תייר מעלה 1-5 תמונות מהיום שלו

### שלב 4: בחירת מיקום ותיאור
```
Mary: "Beautiful! Tell me what this moment meant to you."
```
- בחירת מיקום מרשימה
- כתיבת 1-2 שורות על החוויה

### שלב 5: סגנון (אופציונלי)
```
Mary: "✨ Add a biblical quote that connects to Jerusalem?"
```

אם התייר בוחר **"Yes, create with AI"**:
1. **GPT-5-nano** מציע פסוק מתאים מהתנ"ך
2. **Nano Banana Pro** לוקח את התמונה שהועלתה
3. מוסיף עליה overlay מקצועי:
   - כותרת מיקום (למעלה)
   - תיאור החוויה (באמצע)
   - פסוק מקראי בזהב (למטה)

### שלב 6: תוצאה
```
Mary: "All set! ✅ Thank you for being part of this journey 🙏"
```

הפוסט נשמר כ-**Draft** ומועבר לאישור המדריך.

---

## 🎭 תרחישי שימוש לדמו

### תרחיש 1: התייר המתלהב 🤩
```
1. כנס לדף Sarah: YOUR_DOMAIN/g/sarah
2. לחץ על כפתור המצלמה הצף 📷
3. העלה תמונה מירושלים
4. בחר מיקום: "Jerusalem"
5. כתוב: "Standing at the Western Wall was an overwhelming spiritual experience"
6. לחץ "Yes, create with AI" ✨
7. צפה ב-AI יוצר פסוק ותמונה מעוצבת!
```

### תרחיש 2: המדריך מאשר 👨‍🏫
```
1. כנס לדשבורד Sarah: YOUR_DOMAIN/d/guide/sarah?k=ak_sarah_guide_key_67890
2. צפה בפוסט החדש בסטטוס "Draft"
3. לחץ "Approve" ✅
4. לחץ "Share to Facebook" (מדומה)
5. הפוסט עובר ל-"Published"
```

### תרחיש 3: האדמין עוקב 👑
```
1. כנס לדשבורד Admin: YOUR_DOMAIN/d/admin?k=ak_demo_admin_key_12345
2. צפה בכל הפוסטים של כל המדריכים
3. ראה סטטיסטיקות: X posts, Y approved, Z published
4. נהל את כל המערכת
```

### תרחיש 4: משרד התיירות צופה 🏛️
```
1. כנס לדשבורד Tourism: YOUR_DOMAIN/d/tourism?k=ak_tourism_dash_key_44556
2. צפה באגרגציה של כל הפעילות
3. ראה מגמות ודוחות
4. (Read-only - אין אפשרות לערוך)
```

---

## 🔧 פתרון בעיות

### בעיה: "Your project's URL and Key are required"

**פתרון:**
1. וודא שקובץ `.env.local` קיים
2. בדוק שהמפתחות נכונים
3. הרץ מחדש את `npm run dev`

---

### בעיה: "Failed to upload image"

**פתרון:**
1. וודא שה-bucket `agent-mary` קיים ב-Supabase
2. בדוק שה-bucket מוגדר כ-Public
3. וודא שה-Policies מוגדרות נכון

---

### בעיה: "OpenAI API Error" / "Gemini API Error"

**פתרון:**
1. וודא שהמפתחות תקינים ב-`.env.local`
2. בדוק שיש לך קרדיט ב-OpenAI/Google
3. וודא שה-API keys לא expired

---

### בעיה: תמונה מעוצבת לא נוצרת

**פתרון:**
1. וודא שיש חיבור ל-Gemini API
2. בדוק שהתמונה המקורית נטענה בהצלחה
3. בדוק שיש מספיק quota ב-Google AI

---

### בעיה: "Access Denied" בדשבורד

**פתרון:**
1. וודא שה-URL כולל את פרמטר `?k=ACCESS_KEY`
2. בדוק שהמפתח נכון (ראה `ACCESS_LINKS.md`)
3. נסה להריץ מחדש את migration אם הטבלאות ריקות

---

## 📱 תכונות נוספות

### כפתור צף להעלאת פוסט
בכל דף תייר יש כפתור צף (FAB) למטה מימין שמאפשר העלאת פוסט בכל שלב של השיחה.

### לוגו מותאם
הלוגו שלך ב-`public/Logo.png` מופיע בכל האפליקציה:
- Header עליון
- אווטר של Mary בצ'אט
- כל הדשבורדים

### פסוקים רק מהתנ"ך
המערכת מוגדרת להציע רק פסוקים מהתנ"ך העברי (תורה, נביאים, כתובים) - **לא ברית חדשה**.

---

## 🎯 סיכום טכני

### Stack:
- **Frontend:** Next.js 16 (App Router) + React + TypeScript
- **Styling:** TailwindCSS
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **AI Chat:** OpenAI GPT-5-nano
- **Image AI:** Google Gemini Nano Banana Pro
- **Deployment:** Vercel

### תכונות AI:
- צ'אט חכם עם הקשר מלא
- הצעת פסוקים מקראיים רלוונטיים
- עיבוד תמונות עם overlay טקסט מקצועי
- שמירה על התמונה המקורית של התייר

---

## 📞 תמיכה

אם יש בעיות:
1. בדוק את הלוגים בקונסול
2. וודא שכל ה-Environment Variables מוגדרות
3. בדוק שה-Supabase migration רץ בהצלחה
4. וודא שיש חיבור אינטרנט ל-API calls

---

## 🎉 מוכן לדמו!

עכשיו יש לך מערכת מלאה ופועלת של Agent Mary!

**קישורים מהירים:**
- 🌍 Tourist Page: `YOUR_DOMAIN/g/sarah`
- 👨‍🏫 Guide Dashboard: `YOUR_DOMAIN/d/guide/sarah?k=ak_sarah_guide_key_67890`
- 👑 Admin Dashboard: `YOUR_DOMAIN/d/admin?k=ak_demo_admin_key_12345`

---

**נוצר עם ❤️ על ידי Agent Mary Team**
