# Cloudinary Setup for Missing Person Images

## Quick Setup

1. **Go to Cloudinary Dashboard**: https://cloudinary.com/console
2. **Find your Cloud Name**: Look at the top of the dashboard (e.g., `dqxqjqjqj`)
3. **Create Upload Preset**:
   - Go to Settings > Upload
   - Scroll to "Upload presets"
   - Click "Add upload preset"
   - Set these values:
     - **Preset name**: `trinetra_missing_persons`
     - **Signing Mode**: `Unsigned` (important!)
     - **Access Mode**: `Public`
     - **Folder**: `missing-persons/` (optional)

## Update Configuration

In `app/(tabs)/missing-person.tsx`, update these lines:

```typescript
const CLOUDINARY_UPLOAD_PRESET = 'trinetra_missing_persons'; // Your preset name
const CLOUDINARY_CLOUD_NAME = 'dqxqjqjqj'; // Your cloud name from dashboard
```

## Test

1. Try adding a missing person report with a photo
2. Check console logs for:
   - "Cloudinary response:" - shows upload response
   - "✅ Image uploaded successfully:" - success message
   - "⚠️ Image upload failed" - fallback message (still works)

## Troubleshooting

- **403 Forbidden**: Check preset name and cloud name
- **400 Bad Request**: Ensure preset is set to "Unsigned"
- **Network Error**: Check internet connection

The app works even if image upload fails - it will just use the local image URI.
