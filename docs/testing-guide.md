# 🧪 End-to-End Testing Guide

Your entire system is now live and ready to test! Here's how to verify everything works.

## 🚀 Current Status

- ✅ Frontend running: http://localhost:5173/
- ✅ Firestore database live
- ✅ Cloud Functions deployed (with GitHub token + OpenAI API)
- ✅ GitHub integration active
- ✅ LLM draft generation ready

## 📋 Test Checklist

### 1. Test Feedback Submission & GitHub Issue Creation

**Steps:**
1. Open http://localhost:5173/ in your browser
2. In the feedback composer, type something like:
   ```
   The login button is not responsive on mobile devices. 
   When I tap it, nothing happens. It should trigger the login modal.
   ```
3. Click the "Generate draft" button (arrow icon)
4. You should see:
   - Type auto-detected (likely "bug")
   - Editable title
   - Editable description
   - Optional follow-up question
5. Click "Submit feedback"

**Expected Results:**
- ✅ Feedback saved to Firestore (check Firebase console)
- ✅ GitHub issue created in your repository
- ✅ Issue has labels: `cf:public`, `cf:type/bug`, `cf:status/new`
- ✅ Issue title and description match your submission

**Where to Verify:**
- **Firestore:** https://console.firebase.google.com/project/user-feature-pre/firestore/data
- **GitHub:** https://github.com/wictorstenseke/user-feat-preview/issues

---

### 2. Test Duplicate Detection

**Steps:**
1. Submit similar feedback (like the first one but slightly different wording)
2. After generating draft, you should see "Possible duplicates found"
3. Click "View" to see the original feedback
4. Click "Upvote" to upvote instead of creating new item

**Expected Results:**
- ✅ Shows top 5 similar items
- ✅ Can upvote instead of creating duplicate
- ✅ Vote count increases on original item
- ✅ No new item created

---

### 3. Test Voting

**Steps:**
1. From the feedback list, click the vote count (👍 number)
2. Vote count should increase
3. Vote button should show it's voted (disabled or highlighted)

**Expected Results:**
- ✅ Vote saves to Firestore
- ✅ Vote count updates instantly
- ✅ Only one vote per user per item
- ✅ Check `votes` collection in Firestore

---

### 4. Test Comments

**Steps:**
1. Click on a feedback item (opens detail modal)
2. Scroll to comments section
3. Type a comment
4. Click the send button (arrow)
5. Comment should appear in list

**Expected Results:**
- ✅ Comment appears instantly
- ✅ Comment saved to Firestore
- ✅ Comment count updates on list
- ✅ Check `comments` collection in Firestore

---

### 5. Test LLM Draft Generation

**Steps:**
1. Submit raw feedback:
   ```
   Our app crashes when trying to export large reports
   ```
2. Click "Generate draft"
3. Wait for AI to structure it (5-10 seconds)
4. You should see:
   - Title: "Clarified and concise"
   - Summary: "Well-structured"
   - For bug reports: Steps, expected behavior, actual behavior
   - Optional follow-up question

**Expected Results:**
- ✅ Title is clear and under 100 chars
- ✅ Summary captures the issue
- ✅ Bug details are structured
- ✅ Optional question asks for missing info

---

## 🔍 How to Verify Each Component

### Firestore Verification

1. Go to: https://console.firebase.google.com/project/user-feature-pre/firestore/data
2. Click each collection and verify:
   - **feedback**: Contains all submitted feedback
   - **votes**: Contains vote records (one per user per item)
   - **comments**: Contains all comments
   - **ratelimits**: Contains rate limit tracking

### GitHub Verification

1. Go to: https://github.com/wictorstenseke/user-feat-preview/issues
2. Verify:
   - Issues created for each submission
   - Labels: `cf:public`, `cf:type/feature` or `cf:type/bug`, `cf:status/new`
   - Issue body contains submission details

### Cloud Functions Logs

View what's happening in Cloud Functions:
```bash
firebase functions:log
```

---

## 📊 Test Data Expectations

### Successful Feedback Submission

**In Firestore (`feedback` collection):**
```json
{
  "id": "auto-generated",
  "title": "Login button unresponsive on mobile",
  "summary": "The login button...",
  "type": "bug",
  "status": "new",
  "votes": 0,
  "commentCount": 0,
  "githubIssueNumber": 123,
  "githubIssueUrl": "https://github.com/...",
  "createdAt": "2026-02-26T...",
  "updatedAt": "2026-02-26T..."
}
```

**In GitHub Issues:**
- Title: Extracted from AI draft
- Body: Full submission details
- Labels: `cf:public`, `cf:type/bug`, `cf:status/new`

---

## 🐛 Troubleshooting

### Issue: Feedback submitted but no GitHub issue created

**Possible causes:**
1. GitHub token expired or invalid
2. GitHub token doesn't have `repo` scope
3. Network error creating issue

**How to fix:**
1. Check GitHub token at https://github.com/settings/tokens
2. Ensure it has `repo` scope
3. Check Cloud Functions logs: `firebase functions:log`

### Issue: LLM not generating structured drafts

**Possible causes:**
1. OpenAI API key is invalid or missing
2. OpenAI account out of credits
3. Network timeout

**How to fix:**
1. Verify API key at https://platform.openai.com/account/api-keys
2. Check API usage and credits
3. Check Cloud Functions logs for errors

### Issue: Voting/comments not showing up

**Possible causes:**
1. Firestore rules blocking writes
2. Network error
3. Browser cache

**How to fix:**
1. Check Firestore security rules in Firebase console
2. Open browser DevTools (F12) → Network tab and check for errors
3. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. Check Firestore console to see if data is saved

---

## ✅ Full Test Scenario (5-10 minutes)

1. **Submit 3 different feedback items:**
   - Bug report
   - Feature request
   - Another bug (similar to first)

2. **Test duplicates:**
   - Submit similar bug → see duplicate suggestion
   - Upvote instead of creating new

3. **Test voting:**
   - Vote on 2-3 items
   - Verify vote counts increase

4. **Test comments:**
   - Add comments to 2 items
   - Verify they appear and save

5. **Verify GitHub:**
   - Check issues created
   - Verify labels correct
   - Check issue descriptions match

6. **Verify Firestore:**
   - Check feedback collection
   - Check votes collection
   - Check comments collection

---

## 🎯 Success Criteria

✅ Everything is working if:
- Feedback submissions create Firestore docs
- GitHub issues are created automatically
- Votes and comments save and update
- LLM provides intelligent draft suggestions
- Duplicate detection shows similar items
- Rate limiting prevents spam

---

## 📞 Getting Help

If something isn't working:

1. **Check Cloud Functions logs:**
   ```bash
   firebase functions:log
   ```

2. **Check browser console:**
   - Open DevTools (F12)
   - Look for error messages
   - Check Network tab for failed requests

3. **Check Firebase Console:**
   - https://console.firebase.google.com/project/user-feature-pre
   - Look at Firestore data
   - Check security rules

4. **Test individual functions:**
   - createFeedback: Submit feedback → check Firestore
   - generateDraft: Generate draft → check if AI structures it
   - updatePreviewUrl: (for PR workflow testing)

---

## 🚀 You're Ready!

The entire system is functional and ready for testing. Start with a simple feedback submission and work through the checklist above.

Enjoy! 🎉
