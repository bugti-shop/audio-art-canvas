# Android Setup Guide for Npd

---

## Complete AndroidManifest.xml

**File:** `android/app/src/main/AndroidManifest.xml`

```xml
 
    
    <!-- Internet & Network -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    
    <!-- Push & Local Notifications -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.USE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    
    
    <!-- Foreground Service (for notifications) -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    
    <!-- Microphone (for voice notes/recording) -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-feature android:name="android.hardware.microphone" android:required="false" />
    
    <!-- Camera (for scanning/photos) -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
    
    
    <!-- Biometric (for app lock) -->
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    <uses-permission android:name="android.permission.USE_FINGERPRINT" />
    
    <!-- Calendar (for system calendar sync) -->
    <uses-permission android:name="android.permission.READ_CALENDAR" />
    <uses-permission android:name="android.permission.WRITE_CALENDAR" />
    
    <!-- Google Advertising ID for analytics & ads -->
    <uses-permission android:name="com.google.android.gms.permission.AD_ID" />

    <!-- ==================== APPLICATION ==================== -->
    
     
```

---

## Complete MainActivity.java (Google Sign-In + Optimized Splash Screen)

**File:** `android/app/src/main/java/nota/npd/com/MainActivity.java`

```java
package nota.npd.com;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginHandle;

import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;

import nota.npd.com.DynamicIconPlugin;

/**
 * Main Activity for Npd App
 * 
 * Handles:
 * 1. Google Sign-In via Capgo Social Login plugin
 * 2. Dynamic launcher icon (retention feature)
 */
public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {
    
    private static final String TAG = "MainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Register custom native plugins
        registerPlugin(DynamicIconPlugin.class);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        Log.d(TAG, "onActivityResult: requestCode=" + requestCode);
        
        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN && 
            requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
            PluginHandle pluginHandle = getBridge().getPlugin("SocialLogin");
            if (pluginHandle != null) {
                SocialLoginPlugin plugin = (SocialLoginPlugin) pluginHandle.getInstance();
                if (plugin != null) {
                    plugin.handleGoogleLoginIntent(requestCode, data);
                }
            }
        }
        
        super.onActivityResult(requestCode, resultCode, data);
    }
    
    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}
}
```


## Splash Screen Setup (Android 12+ API)

### styles.xml

**File:** `android/app/src/main/res/values/styles.xml`

Add the splash screen theme to your launch theme:

```xml
<style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
    <!-- Splash background color -->
    <item name="windowSplashScreenBackground">#3b78ed</item>
</style>
```

---

## Billing & Splash Screen Dependencies

Add these to your `android/app/build.gradle`:

```gradle

    // Google Play Billing
    implementation "com.android.billingclient:billing:7.1.1"
    
    // Android 12+ SplashScreen API (backward compatible to API 21)
    implementation "androidx.core:core-splashscreen:1.0.1"

```

---

## strings.xml

**File:** `android/app/src/main/res/values/strings.xml`

```xml
    <!-- Google Sign-In Web Client ID -->
    <string name="server_client_id">52777395492-vnlk2hkr3pv15dtpgp2m51p7418vll90.apps.googleusercontent.com</string>
```

---

## Dynamic Launcher Icon (Retention Feature)

This feature changes the app's home screen icon based on how long the user has been away:
- **Default**: Normal pencil icon
- **1 day away**: Sad pencil icon
- **2+ days away**: Angry pencil icon

### Step 1: Add Icon Assets

Place your icon variants in the Android mipmap folders:

```
android/app/src/main/res/
├── mipmap-hdpi/
│   ├── ic_launcher.png          (default)
│   ├── ic_launcher_sad.png      (sad variant)
│   └── ic_launcher_angry.png    (angry variant)
├── mipmap-mdpi/
│   └── ... (same 3 files)
├── mipmap-xhdpi/
│   └── ... (same 3 files)
├── mipmap-xxhdpi/
│   └── ... (same 3 files)
└── mipmap-xxxhdpi/
    └── ... (same 3 files)
```

Generate icons from your PNG sources using Android Studio → **Image Asset** tool, or use https://icon.kitchen.

### Step 2: AndroidManifest.xml — Activity Aliases

Add these **after** your `</activity>` closing tag, inside `<application>`:

```xml
<!-- Default Icon (enabled by default) -->
<activity-alias
    android:name=".DefaultIcon"
    android:targetActivity=".MainActivity"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:label="Npd"
    android:enabled="true"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity-alias>

<!-- Sad Icon (1 day away) -->
<activity-alias
    android:name=".SadIcon"
    android:targetActivity=".MainActivity"
    android:icon="@mipmap/ic_launcher_sad"
    android:roundIcon="@mipmap/ic_launcher_sad_round"
    android:label="Npd"
    android:enabled="false"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity-alias>

<!-- Angry Icon (2+ days away) -->
<activity-alias
    android:name=".AngryIcon"
    android:targetActivity=".MainActivity"
    android:icon="@mipmap/ic_launcher_angry"
    android:roundIcon="@mipmap/ic_launcher_angry_round"
    android:label="Npd"
    android:enabled="false"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity-alias>
```

**IMPORTANT:** Remove the `<intent-filter>` with `MAIN/LAUNCHER` from your original `<activity>` tag — the aliases handle it now.

### Step 3: Create the Native Plugin

**File:** `android/app/src/main/java/nota/npd/com/DynamicIconPlugin.java`

```java
package nota.npd.com;

import android.content.ComponentName;
import android.content.pm.PackageManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DynamicIcon")
public class DynamicIconPlugin extends Plugin {

    private static final String TAG = "DynamicIcon";
    
    private static final String[] ALIASES = {
        "nota.npd.com.DefaultIcon",
        "nota.npd.com.SadIcon",
        "nota.npd.com.AngryIcon"
    };

    @PluginMethod()
    public void setIcon(PluginCall call) {
        String iconName = call.getString("name", "default");
        
        int enableIndex;
        switch (iconName) {
            case "sad":
                enableIndex = 1;
                break;
            case "angry":
                enableIndex = 2;
                break;
            default:
                enableIndex = 0;
                break;
        }

        PackageManager pm = getContext().getPackageManager();

        for (int i = 0; i < ALIASES.length; i++) {
            int state = (i == enableIndex)
                ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED
                : PackageManager.COMPONENT_ENABLED_STATE_DISABLED;

            pm.setComponentEnabledSetting(
                new ComponentName(getContext(), ALIASES[i]),
                state,
                PackageManager.DONT_KILL_APP
            );
        }

        call.resolve();
    }

    @PluginMethod()
    public void getIcon(PluginCall call) {
        PackageManager pm = getContext().getPackageManager();
        String current = "default";

        for (int i = 0; i < ALIASES.length; i++) {
            int state = pm.getComponentEnabledSetting(
                new ComponentName(getContext(), ALIASES[i])
            );
            if (state == PackageManager.COMPONENT_ENABLED_STATE_ENABLED) {
                switch (i) {
                    case 1: current = "sad"; break;
                    case 2: current = "angry"; break;
                    default: current = "default"; break;
                }
                break;
            }
        }

        call.resolve(new com.getcapacitor.JSObject().put("name", current));
    }
}
```

### Step 4: JS Integration

The web-side code is in `src/utils/dynamicIcon.ts` — it calls the native plugin and falls back gracefully on web.

### Notes

- Icon change takes **1-2 seconds** to reflect on home screen
- Some launchers may show a brief "app info changed" toast
- The `DONT_KILL_APP` flag prevents the app from being killed during the switch
- On web/PWA this feature is a no-op (graceful fallback)

