@echo off
echo ===================================================
echo   Building Canteen Feedback APK for Android
echo ===================================================
echo.
echo Please wait. This process may take a few minutes as
echo it downloads Android build tools and compiles the app.
echo.

cd "%~dp0mobile-app"
call nvm use 18.20.8 >nul 2>nul
set PATH=%LOCALAPPDATA%\nvm\v18.20.8;%PATH%
set CI=1

echo [1/2] Generating Android Native Code...

:: Kill any gradle daemon that might be locking the android folder
echo   Stopping any running Gradle daemons...
if exist "android\gradlew.bat" (
    cd android
    call gradlew --stop >nul 2>nul
    cd ..
)

:: Force remove locked android folder
if exist "android" (
    echo   Cleaning previous android folder...
    rmdir /S /Q "android" >nul 2>nul
    if exist "android" (
        echo   WARNING: Could not fully remove android folder. Retrying...
        timeout /t 3 >nul
        rmdir /S /Q "android" >nul 2>nul
    )
)

set EXPO_NO_GIT_STATUS=1
set EXPO_NO_TELEMETRY=1
call npx expo prebuild -p android --clean

:: Patch Expo / React Native build.gradle incompatibility
echo   Patching build configs...
if exist "android\app\build.gradle" (
    findstr /V "enableBundleCompression" android\app\build.gradle > android\app\build.gradle.tmp
    move /Y android\app\build.gradle.tmp android\app\build.gradle >nul
)

:: Ensure cleartext traffic is permitted
powershell -Command "$m = Get-Content 'android\app\src\main\AndroidManifest.xml' -Raw; if ($m -notmatch 'usesCleartextTraffic') { $m = $m -replace '<application ', '<application android:usesCleartextTraffic=\"true\" '; Set-Content 'android\app\src\main\AndroidManifest.xml' $m }"


:: ── STEP 2: CONFIGURE SIGNING ──────────────────────────────
echo.
echo [2/4] Configuring release signing...

:: Copy keystore into android/app/
copy /Y "canteen-release.keystore" "android\app\canteen-release.keystore" >nul

:: Write keystore properties file
(
    echo storeFile=canteen-release.keystore
    echo storePassword=canteen123
    echo keyAlias=canteen
    echo keyPassword=canteen123
) > "android\keystore.properties"

:: Inject signing config into build.gradle
powershell -Command ^
    "$content = Get-Content 'android\app\build.gradle' -Raw;" ^
    "$signingBlock = @'" ^
    "def keystoreProps = new Properties()" ^
    "def keystoreFile = rootProject.file('../keystore.properties')" ^
    "if (keystoreFile.exists()) { keystoreFile.withInputStream { keystoreProps.load(it) } }" ^
    "'@;" ^
    "$releaseSigningConfig = @'" ^
    "        release {" ^
    "            storeFile file(keystoreProps['storeFile'])" ^
    "            storePassword keystoreProps['storePassword']" ^
    "            keyAlias keystoreProps['keyAlias']" ^
    "            keyPassword keystoreProps['keyPassword']" ^
    "        }" ^
    "'@;" ^
    "if ($content -notmatch 'storeFile') {" ^
    "    $content = $content -replace 'android \{', \"$signingBlock`nandroid {\";" ^
    "    $content = $content -replace 'debug \{', \"$releaseSigningConfig`n        debug {\";" ^
    "    $content = $content -replace 'buildTypes \{', 'buildTypes {`n        release { signingConfig signingConfigs.release }';" ^
    "    Set-Content 'android\app\build.gradle' $content" ^
    "}"

:: ── STEP 3: BUNDLE JS ──────────────────────────────────────
echo.
echo [3/4] Bundling JavaScript (release mode)...

if not exist "android\app\src\main\assets" mkdir "android\app\src\main\assets"

call npx react-native bundle ^
    --platform android ^
    --dev false ^
    --entry-file node_modules/expo/AppEntry.js ^
    --bundle-output android/app/src/main/assets/index.android.bundle ^
    --assets-dest android/app/src/main/res/ ^
    --config metro.config.js ^
    --minify true

if errorlevel 1 (
    echo  ERROR: JS bundle step failed!
    pause
    exit /b 1
)
echo  JS bundle complete.

:: ── STEP 4: BUILD RELEASE APK ──────────────────────────────
echo.
echo [4/4] Compiling signed Release APK...
cd android
call gradlew assembleRelease

echo.
echo ===================================================
set APK=app\build\outputs\apk\release\app-release.apk
if exist "%APK%" (
    echo  SUCCESS! Signed Release APK built successfully.
    echo  Opening APK folder...
    explorer "app\build\outputs\apk\release"
) else (
    echo  FAILED to build APK. Check errors above.
    pause
)
