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

echo.
echo [2/2] Compiling the Debug APK...
cd android
call gradlew assembleDebug

echo.
echo ===================================================
if exist "app\build\outputs\apk\debug\app-debug.apk" (
    echo  SUCCESS! APK built successfully.
    echo  Opening APK folder...
    explorer "app\build\outputs\apk\debug"
) else if exist "app\build\outputs\apk\release\app-release.apk" (
    echo  SUCCESS! Release APK built successfully.
    explorer "app\build\outputs\apk\release"
) else (
    echo  FAILED to build APK. Check errors above.
    pause
)
