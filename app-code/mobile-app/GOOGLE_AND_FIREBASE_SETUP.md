# VenQore app: Google sign-in and Firebase setup

What you do in the Google and Firebase consoles, and what to send back. Nothing here is a secret
except where marked. **Never paste the keystore, its passwords, or the service-account file into chat,
email or the repository.**

## 0. The facts you need

| Item | Value |
|---|---|
| App ID (package name) | `com.venqore.app` |
| Release keystore | `E:\VenQore-Signing\venqore-release.jks` (alias `venqore`) |
| Keystore passwords | `E:\VenQore-Signing\key.properties` (copy also in `app-code/mobile-app/android/key.properties`, ignored by git) |
| SHA-1 (release key) | `21:8C:2C:D5:8E:3B:F0:F8:E7:51:0A:95:45:C7:AA:CC:26:E3:15:A6` |
| SHA-256 (release key) | `5D:F5:99:81:F2:6A:95:0A:43:6C:25:39:A3:09:11:BF:D4:16:71:F9:59:8D:82:D8:05:2B:52:8B:8A:58:49:14` |
| Server base URL | `https://venqore.com` |

**Back up `E:\VenQore-Signing` today** (two places: an encrypted USB drive and a password manager or
private cloud folder). If this key is lost you cannot publish updates to the same Play Store app. The
fingerprints above are public and safe to share; the files are not.

## 1. Google sign-in (the account picker, no browser)

Use the same Google Cloud project your website's "Continue with Google" already uses.

1. Open <https://console.cloud.google.com> and pick that project from the project list at the top.
2. **APIs & Services > OAuth consent screen**
   - User type **External**. App name `VenQore`, support email, logo, and your privacy policy URL
     (`https://venqore.com/privacy`) and terms URL (`https://venqore.com/terms`).
   - Scopes: only `email`, `profile`, `openid`.
   - Click **Publish app** so the status is "In production". In "Testing" only listed test users can sign in.
3. **APIs & Services > Credentials**
   - Check there is a **Web application** client. This is the one whose ID is in the server's `.env` as
     `GOOGLE_CLIENT_ID`. Its authorised redirect URI must be `https://venqore.com/auth/google/callback`.
   - **Create credentials > OAuth client ID > Android**
     - Name: `VenQore Android (release)`
     - Package name: `com.venqore.app`
     - SHA-1 certificate fingerprint: the SHA-1 above
     - Create. (No file to download; the client only has to exist.)
   - If you will also test builds made on another computer, make a second Android client with the package
     name and that computer's debug SHA-1 (`keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android`).
4. **Google Play later:** if you use Play App Signing (you will), Google re-signs the app with its own key.
   After the first upload, open Play Console > Release > Setup > App signing, copy the **App signing key
   SHA-1**, and add one more Android client with that fingerprint. Without it Google sign-in works in the
   APK you install by hand but fails in the Play Store version.

Nothing else is needed on the server: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are already used by the web
flow, and the app reads the client ID from `https://venqore.com/api/mobile/config`.

**Check it works:** install the new APK, tap "Continue with Google". You should get the phone's account picker
(not a web page). If it falls back to a browser, the Android client above is missing or has the wrong package
name or SHA-1.

## 2. Firebase (push notifications for the app)

Firebase is only used to send notifications to the Android app. You do **not** use Firebase Authentication:
VenQore keeps its own accounts and Google sign-in as above.

1. Open <https://console.firebase.google.com> > **Add project**.
   - Choose **the same Google Cloud project** as in step 1 (select it from the list) so both live together.
   - Google Analytics: optional, you can turn it off.
2. In the project: **Add app > Android**
   - Android package name: `com.venqore.app`
   - App nickname: `VenQore`
   - Debug/release SHA-1: paste the release SHA-1 above (this also registers it for Google sign-in).
   - Register app > **Download `google-services.json`**.
   - You can skip the "add the SDK" steps; I do those.
3. **Project settings (gear) > Cloud Messaging**: make sure **Firebase Cloud Messaging API (V1)** shows
   **Enabled**. If it says disabled, click the three dots and open it in Google Cloud, then **Enable**.
4. **Project settings > Service accounts > Generate new private key**: this downloads a `.json` file.
   **This file is a secret.** It is how the server is allowed to send notifications.

### What to give me
- `google-services.json` (not secret; it goes into `app-code/mobile-app/android/app/`).
- Put the service-account `.json` on the server **outside the web folder**, for example
  `/home/venqore/secrets/fcm-service-account.json`, and tell me only the path. Do not send the file contents.
  I will read it from an environment variable (`FCM_SERVICE_ACCOUNT_PATH`).

### What I do after that
- Add `firebase_core` and `firebase_messaging` to the app; ask for the notification permission on Android 13+
  in plain words when a rider or manager first signs in.
- Server: a `device_tokens` table, endpoints to register and remove a phone, and an FCM sender wired into the
  existing rider-assigned alert (and, later, order alerts). Tokens are removed at sign-out and when a rider is
  deactivated.
- Alerts carry no customer address or phone on the lock screen.

## 3. Server settings to add (`.env`)

```
# Browser / installed-web-app alerts (run: php artisan webpush:keys, then paste the three lines)
WEBPUSH_VAPID_PUBLIC_KEY=
WEBPUSH_VAPID_PRIVATE_KEY=
WEBPUSH_VAPID_SUBJECT=mailto:support@venqore.com

# Already used by the web "Continue with Google" button; the app reads the ID from the server
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

After editing: `php artisan migrate` (adds the push subscriptions table), upload the new `vendor/`
(new package `minishlink/web-push`), then `php artisan config:clear`.

## 4. Order of work

1. Back up `E:\VenQore-Signing`.
2. Step 1 (Google Cloud): Android client + publish the consent screen.
3. Step 2 (Firebase): project, Android app, `google-services.json`, service-account file on the server.
4. Send me `google-services.json` and the server path. I add notifications, build the signed APK, and you
   test: Google sign-in, a rider alert with the app closed, and sign out.
5. Play Console: create the app `com.venqore.app`, upload the signed bundle, turn on Play App Signing, then
   add the Play signing SHA-1 as in step 1.4.
