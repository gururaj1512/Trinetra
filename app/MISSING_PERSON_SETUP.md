# Missing Person Feature Setup

## Firebase Setup

The missing person feature uses Firebase Firestore with the following collections:

### Collections
- `missingPersonReports` - Stores missing person reports

### Required Firebase Indexes
The app uses simple queries that don't require composite indexes, but if you want to use `orderBy` with `where` clauses, you'll need to create these indexes in Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `trinetra-12e7c`
3. Go to Firestore Database > Indexes
4. Create composite index for `missingPersonReports` collection:
   - Fields: `userId` (Ascending), `createdAt` (Descending)

## Cloudinary Setup

For image uploads, you need to set up Cloudinary:

### 1. Create Cloudinary Account
1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for a free account
3. Get your cloud name from the dashboard

### 2. Create Upload Preset
1. Go to Settings > Upload
2. Scroll down to "Upload presets"
3. Click "Add upload preset"
4. Set these values:
   - **Preset name**: `trinetra_missing_persons`
   - **Signing Mode**: `Unsigned` (for client-side uploads)
   - **Folder**: `missing-persons/` (optional)
   - **Access Mode**: `Public`
   - **Transformations**: None (or add if needed)

### 3. Update Configuration
Update the Cloudinary configuration in `app/(tabs)/missing-person.tsx`:

```typescript
const CLOUDINARY_UPLOAD_PRESET = 'trinetra_missing_persons'; // Your preset name
const CLOUDINARY_CLOUD_NAME = 'your-cloud-name'; // Your cloud name from dashboard
```

### 4. Test Image Upload
The app will log detailed information about image uploads to help debug any issues:
- Check console logs for "Cloudinary response:" messages
- If upload fails, the app will show specific error messages
- Images are optional - the form will work without them

## Features

### User Features
- ✅ Submit missing person reports with photos
- ✅ Track report status in real-time
- ✅ View admin notes and found locations
- ✅ Form validation and error handling

### Admin Features
- ✅ View all missing person reports
- ✅ Update report status (Finding, Found, Not Found)
- ✅ Add admin notes and found addresses
- ✅ Face detection analysis integration

### Status Types
- **Finding** (Yellow) - Search in progress
- **Found** (Green) - Person located with address
- **Not Found** (Red) - Search concluded without success

## Troubleshooting

### Firebase Index Error
If you see "The query requires an index" error:
- The app now uses client-side sorting instead of server-side ordering
- This avoids the need for composite indexes
- Reports are still sorted by creation date (newest first)

### Image Upload Issues
1. Check Cloudinary preset name and cloud name
2. Ensure upload preset is set to "Unsigned"
3. Check console logs for detailed error messages
4. Verify network connectivity

### Form Submission Issues
1. Ensure all required fields are filled
2. Check Firebase connection
3. Verify user authentication
4. Check console logs for error details
