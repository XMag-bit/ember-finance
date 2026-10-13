$ErrorActionPreference = "Continue"
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
Set-Location "D:\App\ember-finance"

Write-Output "=== building release ==="
& .\android\gradlew.bat assembleRelease 2>&1 | Select-String -Pattern "BUILD|FAILED" | Select-Object -Last 2

Write-Output "=== waiting for emulator boot ==="
& $adb wait-for-device
$boot = ""
$deadline = (Get-Date).AddMinutes(9)
while ((Get-Date) -lt $deadline) {
  $boot = (& $adb shell getprop sys.boot_completed 2>$null) -join ""
  $boot = $boot.Trim()
  if ($boot -eq "1") { break }
  Start-Sleep -Seconds 10
}
Write-Output "boot_completed=$boot"
if ($boot -ne "1") { Write-Output "BOOT TIMEOUT"; exit 1 }

Write-Output "=== installing ==="
& $adb install -r android/app/build/outputs/apk/release/app-x86_64-release.apk 2>&1 | Select-Object -Last 2

Write-Output "=== launching ==="
& $adb shell monkey -p com.ember.finance -c android.intent.category.LAUNCHER 1 2>&1 | Select-Object -Last 2
Start-Sleep -Seconds 6

Write-Output "=== screenshot ==="
& $adb shell screencap -p /sdcard/shot_onboard.png
& $adb pull /sdcard/shot_onboard.png shot_onboard.png 2>&1 | Select-Object -Last 1
Write-Output "DONE"
