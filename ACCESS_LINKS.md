# Agent Mary - Access Links

## 🚀 Quick Start

```bash
npm run dev
```

הפרויקט רץ על: `http://localhost:3000`

---

## 🔴 Admin Dashboards

**ניהול מלא של המערכת:**

```
http://localhost:3000/d/admin?k=ak_demo_admin_key_12345
http://localhost:3000/d/admin?k=ak_second_admin_key_77889
```

**מה אפשר לעשות:**
- ניהול מדריכים (הוספה/עריכה)
- יצירת access keys חדשים
- הגדרות מערכת
- Seed demo data / Clear all data

---

## 👤 Guide Dashboards

**דאשבורד Sarah Cohen:**
```
http://localhost:3000/d/guide/sarah?k=ak_sarah_guide_key_67890
```

**דאשבורד David Levi:**
```
http://localhost:3000/d/guide/david?k=ak_david_guide_key_11223
```

**מה אפשר לעשות:**
- לראות את כל הפוסטים של המדריך
- לאשר פוסטים (Approve)
- לסמן כ-Published
- פילטרים לפי סטטוס/מיקום

---

## 🏛️ Tourism Dashboard

**דאשבורד משרד התיירות:**
```
http://localhost:3000/d/tourism?k=ak_tourism_dash_key_44556
```

**מה אפשר לעשות:**
- לראות KPIs של כל המערכת
- גלריה של כל הפוסטים
- פילטרים לפי מדריך/מיקום/סטטוס
- לחיצה על תמונה = פרטי הפוסט

---

## 🌍 Tourist Pages (ציבוריות - ללא key)

**עמוד Sarah Cohen:**
```
http://localhost:3000/g/sarah
```

**עמוד David Levi:**
```
http://localhost:3000/g/david
```

**מה אפשר לעשות:**
- ללחוץ "Start Sharing"
- ליצור פוסט חדש עם תמונות
- לבחור Regular או Holy Land Edition
- לפרסם ולשתף (סימולציה)

---

## 📝 Flow מלא לבדיקה:

### 1. Tourist Flow (ללא key)
```
http://localhost:3000/g/sarah
→ Start Sharing
→ מלא טופס (שם, מיקום, תמונות, טקסט)
→ Generate Post
→ Publish to Guide Page
→ Share on My Page
```

### 2. Guide Approval
```
http://localhost:3000/d/guide/sarah?k=ak_sarah_guide_key_67890
→ לראות draft חדש
→ Approve
→ Mark Published
```

### 3. Tourism View
```
http://localhost:3000/d/tourism?k=ak_tourism_dash_key_44556
→ לראות בגלריה
→ לחץ על תמונה
→ פרטי פוסט מלאים
```

### 4. Admin Control
```
http://localhost:3000/d/admin?k=ak_demo_admin_key_12345
→ Guides: ליצור מדריך חדש
→ Access Keys: ליצור key חדש והעתיק לינק
→ Settings: לשנות hashtags
→ Seed Data: ליצור עוד demo data
```

---

## 🎨 Demo Data שקיים:

**Guides:**
- Sarah Cohen (sarah)
- David Levi (david)

**Posts:**
- 4 sample posts עם תמונות
- 2 published, 1 approved, 1 draft
- 2 Holy Land Edition posts עם פסוקים

**Locations:**
- Jerusalem, Tel Aviv, Dead Sea, Galilee, Haifa, Nazareth, Eilat

---

## 🔑 Access Keys Summary

| Role | Key | Link |
|------|-----|------|
| Admin | ak_demo_admin_key_12345 | /d/admin?k=... |
| Admin | ak_second_admin_key_77889 | /d/admin?k=... |
| Guide (Sarah) | ak_sarah_guide_key_67890 | /d/guide/sarah?k=... |
| Guide (David) | ak_david_guide_key_11223 | /d/guide/david?k=... |
| Tourism | ak_tourism_dash_key_44556 | /d/tourism?k=... |
| Tourist | (no key needed) | /g/sarah or /g/david |

---

## 💡 Tips:

- כל הדאשבורדים מוגנים ב-access key ב-URL
- Tourist pages פתוחות לכולם (ללא key)
- ליצור keys חדשים דרך Admin → Access Keys tab
- Seed Data יוצר עוד מדריכים ופוסטים אוטומטית
