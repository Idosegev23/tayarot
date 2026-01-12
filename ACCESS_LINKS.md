# Agent Mary - Access Links

## 🌐 Production URL
**https://tayarot-865pmy6zt-idosegev23s-projects.vercel.app**

---

## 🔴 Super Admin Dashboard (Full Control)

### Admin 1
**Access Key:** `ak_demo_admin_key_12345`

**Link:** https://tayarot-865pmy6zt-idosegev23s-projects.vercel.app/d/admin?k=ak_demo_admin_key_12345

### Admin 2
**Access Key:** `ak_second_admin_key_77889`

**Link:** https://tayarot-865pmy6zt-idosegev23s-projects.vercel.app/d/admin?k=ak_second_admin_key_77889

**יכולות:**
- ניהול כל הפוסטים של כל המדריכים
- אישור/דחייה/פרסום פוסטים
- צפייה בסטטיסטיקות כלליות
- ניהול מערכת

---

## 👥 Guide Dashboards (Specific Guide Management)

### Sarah Cohen
**Slug:** `sarah`
**Access Key:** `ak_sarah_guide_key_67890`

**Link:** https://tayarot-865pmy6zt-idosegev23s-projects.vercel.app/d/guide/sarah?k=ak_sarah_guide_key_67890

### David Levi
**Slug:** `david`
**Access Key:** `ak_david_guide_key_11223`

**Link:** https://tayarot-865pmy6zt-idosegev23s-projects.vercel.app/d/guide/david?k=ak_david_guide_key_11223

**יכולות:**
- ניהול פוסטים של הקבוצה שלו
- אישור/דחייה פוסטים
- שיתוף פוסטים לפייסבוק
- צפייה בסטטיסטיקות שלו

---

## 🏛️ Ministry of Tourism Dashboard (Aggregated View)

**Access Key:** `ak_tourism_dash_key_44556`

**Link:** https://tayarot-865pmy6zt-idosegev23s-projects.vercel.app/d/tourism?k=ak_tourism_dash_key_44556

**יכולות:**
- צפייה בכל הפוסטים (read-only)
- סטטיסטיקות מצרפיות
- ניתוח מגמות
- דוחות

---

## 🌍 Public Tourist Pages (No Key Required)

### Sarah Cohen's Group
**Link:** https://tayarot-865pmy6zt-idosegev23s-projects.vercel.app/g/sarah

### David Levi's Group
**Link:** https://tayarot-865pmy6zt-idosegev23s-projects.vercel.app/g/david

**תכונות:**
- צ'אט עם Agent Mary (GPT-5-nano)
- שאלות על מיקומים ומסלולים
- העלאת תמונות וחוויות
- יצירת פוסטים מעוצבים עם AI

---

## 📝 How to Use

### For Tourists:
1. Click on your guide's link (Sarah or David)
2. Chat with Mary about your journey
3. Click the floating camera button 📷 to share photos
4. Follow the step-by-step process to create a post

### For Guides:
1. Use your dashboard link with the access key
2. Review posts from your group
3. Approve or reject posts
4. Share approved posts to Facebook

### For Admin:
1. Use the admin link with the access key
2. Monitor all posts across all guides
3. Manage the entire system
4. View comprehensive statistics

### For Tourism Ministry:
1. Use the tourism dashboard link
2. View all posts (read-only)
3. Generate reports and analytics

---

## 🔧 Local Development

If running locally, replace the production URL with:
```
http://localhost:3000
```

Example:
```
http://localhost:3000/g/sarah
http://localhost:3000/d/guide/sarah?k=ak_sarah_guide_key_67890
```

---

## ⚠️ Important Notes

- **Access Keys:** Keep these keys secure! They provide access to dashboards
- **Tourist Pages:** No key required - safe to share publicly
- **Environment Variables:** Make sure to set up API keys in Vercel for full functionality:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `OPENAI_API_KEY`
  - `GEMINI_API_KEY`

---

## 📚 Additional Resources

- **User Guide:** See `USER_GUIDE.md` for detailed instructions in Hebrew
- **Setup Guide:** See `SETUP_GUIDE.md` for technical setup instructions
- **Demo Flow:** Try the tourist flow → guide approval → admin monitoring

---

**Created with ❤️ by Agent Mary Team**
