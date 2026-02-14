# 🔧 Troubleshooting - Grievances Not Showing

## Issue: Grievances Not Listing in Student Dashboard

### Possible Causes & Solutions

#### 1. **Anonymous Grievances**
If you created grievances with "Submit anonymously" checked, they won't show in your dashboard because `studentId` is set to `null`.

**Solution:**
- Create new grievances without checking "Submit anonymously"
- Or check Firestore to see if grievances exist with `studentId: null`

#### 2. **Firestore Index Missing**
If you see an error about "index", you need to create a Firestore index.

**Solution:**
- Check browser console for error message
- Click the link in the error to create the index automatically
- Or go to Firestore → Indexes → Create index

#### 3. **User ID Mismatch**
The query looks for grievances where `studentId == user.uid`. Make sure they match.

**Check:**
- Open browser console (F12)
- In development mode, you'll see: "User ID: xxxxxxxx... | Found: X grievances"
- Verify the user ID matches

#### 4. **Security Rules**
If Firestore rules are too strict, queries might fail silently.

**Check:**
- Go to Firebase Console → Firestore → Rules
- Make sure rules allow reading grievances where `studentId == request.auth.uid`

#### 5. **Data Format Issues**
Grievances might exist but have wrong data format.

**Check in Firestore Console:**
1. Go to Firebase Console → Firestore Database
2. Open `grievances` collection
3. Check if documents have:
   - `studentId` field (should match your user ID)
   - `createdAt` field
   - Other required fields

## Quick Debug Steps

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors or logs
4. You should see: "Loaded grievances: X"

### Step 2: Check Firestore
1. Go to Firebase Console
2. Firestore Database
3. Check `grievances` collection
4. Verify documents exist with your `studentId`

### Step 3: Verify User ID
1. In dashboard, check the debug info (development mode)
2. Compare with `studentId` in Firestore documents
3. They should match exactly

### Step 4: Test Query
Try creating a new grievance:
1. Go to "Create Grievance"
2. Fill in the form
3. **Don't check "Submit anonymously"**
4. Submit
5. Go back to dashboard
6. It should appear

## Common Fixes

### Fix 1: Remove Anonymous Check
When creating grievances, make sure "Submit anonymously" is **unchecked**.

### Fix 2: Create Firestore Index
If you see index error:
1. Click the error link in console
2. Or go to Firestore → Indexes
3. Create index for: `grievances` collection, fields: `studentId` (Ascending), `createdAt` (Descending)

### Fix 3: Check Security Rules
Make sure your `firestore.rules` has:
```javascript
allow read: if isAuthenticated() && (
  resource.data.studentId == request.auth.uid ||
  resource.data.anonymous == false && resource.data.studentId == request.auth.uid
);
```

### Fix 4: Clear Cache & Reload
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Or clear browser cache
3. Try again

## Still Not Working?

1. **Check Network Tab:**
   - Open DevTools → Network
   - Look for Firestore requests
   - Check if they're successful (200 status)

2. **Check Firestore Console:**
   - Verify grievances exist
   - Check `studentId` field value
   - Make sure it's not `null`

3. **Create Test Grievance:**
   - Create a new grievance
   - Immediately check dashboard
   - If it appears, the issue was with old data

4. **Check User Authentication:**
   - Make sure you're logged in
   - Check if `user.uid` exists
   - Try logging out and back in

## Need More Help?

Check the browser console for specific error messages and share them for more targeted help.

