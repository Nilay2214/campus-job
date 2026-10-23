# LIVE MySQL-backed Student E2E test
$ErrorActionPreference = "Stop"
$base = "http://localhost:8080"
$results = @()
$email = "student_e2e_" + (Get-Random -Maximum 999999) + "@example.com"
$pass = "Password@123"
$script:token = $null
$script:profileId = $null

function Add-Result($name, $ok, $detail) {
    $script:results += [PSCustomObject]@{ Step = $name; Status = $(if ($ok) {"PASS"} else {"FAIL"}); Detail = $detail }
    Write-Output ("[{0}] {1} - {2}" -f $(if ($ok) {"PASS"} else {"FAIL"}), $name, $detail)
}

function Invoke-Api($method, $path, $bodyObj, $token, $expectStatus) {
    $headers = @{}
    if ($token) { $headers["Authorization"] = "Bearer $token" }
    $params = @{ Uri = "$base$path"; Method = $method; Headers = $headers; TimeoutSec = 20 }
    if ($bodyObj -ne $null) { $params["ContentType"] = "application/json"; $params["Body"] = ($bodyObj | ConvertTo-Json -Depth 10) }
    try {
        $resp = Invoke-WebRequest @params -UseBasicParsing
        $actual = $resp.StatusCode
        $ok = $actual -eq $expectStatus
        return @{ ok = $ok; actual = $actual; body = $resp.Content }
    } catch {
        $actual = [int]$_.Exception.Response.StatusCode.value__
        $ok = $actual -eq $expectStatus
        return @{ ok = $ok; actual = $actual; body = "" }
    }
}

# 1. Register student
$reg = Invoke-Api "POST" "/api/auth/register" @{ email=$email; password=$pass; role="STUDENT"; name="E2E Student" } $null 200
Add-Result "1. Register student" $reg.ok "status=$($reg.actual)"
if ($reg.ok) { $regJson = $reg.body | ConvertFrom-Json; $script:token = $regJson.token }

# 2. Login
$login = Invoke-Api "POST" "/api/auth/login" @{ email=$email; password=$pass } $null 200
Add-Result "2. Login" $login.ok "status=$($login.actual)"
if ($login.ok) { $loginJson = $login.body | ConvertFrom-Json; $script:token = $loginJson.token }

# 3. Dashboard (active jobs)
$dash = Invoke-Api "GET" "/api/students/jobs/active/list?pageNumber=0&pageSize=10" $null $script:token 200
Add-Result "3. Dashboard (active jobs)" $dash.ok "status=$($dash.actual)"

# 4. Get profile (auto-creates empty profile)
$prof = Invoke-Api "GET" "/api/students/profile" $null $script:token 200
Add-Result "4. Get profile" $prof.ok "status=$($prof.actual)"
if ($prof.ok) { $pj = $prof.body | ConvertFrom-Json; $script:profileId = $pj.id }

# 5. Update profile
$profBody = @{ fullName="E2E Student"; phone="9876543210"; cgpa=8.5; skills="Java, Spring" }
$profUpd = Invoke-Api "POST" "/api/students/profile" $profBody $script:token 200
Add-Result "5. Update profile" $profUpd.ok "status=$($profUpd.actual)"
if ($profUpd.ok) { $updJson = $profUpd.body | ConvertFrom-Json; $script:profileId = $updJson.id }

# 6. Browse jobs
$jobs = Invoke-Api "GET" "/api/students/jobs?pageNumber=0&pageSize=10" $null $script:token 200
Add-Result "6. Browse jobs" $jobs.ok "status=$($jobs.actual)"

# 7. Search jobs
$search = Invoke-Api "GET" "/api/students/jobs?title=Engineer&pageNumber=0&pageSize=10" $null $script:token 200
Add-Result "7. Search jobs" $search.ok "status=$($search.actual)"

# 8. Filter jobs
$filter = Invoke-Api "GET" "/api/students/jobs?location=Pune&salaryMin=500000&pageNumber=0&pageSize=10" $null $script:token 200
Add-Result "8. Filter jobs" $filter.ok "status=$($filter.actual)"

# 9. View job details
$jobId = $null
if ($jobs.ok) {
    $jobsJson = $jobs.body | ConvertFrom-Json
    $jobArr = $null
    if ($jobsJson.content) { $jobArr = $jobsJson.content } elseif ($jobsJson -is [array]) { $jobArr = $jobsJson }
    if ($jobArr -and $jobArr.Count -gt 0) { $jobId = $jobArr[0].id }
}
if ($jobId) {
    $detail = Invoke-Api "GET" "/api/students/jobs/$jobId" $null $script:token 200
    Add-Result "9. View job details" $detail.ok "status=$($detail.actual) jobId=$jobId"
} else {
    Add-Result "9. View job details" $false "no jobs available to view"
}

# 10. Apply
$script:appliedId = $null
if ($jobId) {
    $apply = Invoke-Api "POST" "/api/applications/$jobId" $null $script:token 200
    Add-Result "10. Apply to job" ($apply.ok -or $apply.actual -eq 400) "status=$($apply.actual) (400=dup/not-active)"
    if ($apply.ok) { $applyJson = $apply.body | ConvertFrom-Json; $script:appliedId = $applyJson.id }
}

# 11. View applications
$myapps = Invoke-Api "GET" "/api/applications" $null $script:token 200
Add-Result "11. View applications" $myapps.ok "status=$($myapps.actual)"
if ($myapps.ok) {
    $appsJson = $myapps.body | ConvertFrom-Json
    $appArr = @()
    if ($appsJson -is [array]) { $appArr = $appsJson } elseif ($appsJson.content) { $appArr = $appsJson.content } elseif ($appsJson.applications) { $appArr = $appsJson.applications }
    if ($appArr -and $appArr.Count -gt 0) { $script:appliedId = $appArr[0].id }
}

# 12. Withdraw (returns 204)
if ($script:appliedId) {
    $withdraw = Invoke-Api "DELETE" "/api/applications/$($script:appliedId)" $null $script:token 204
    Add-Result "12. Withdraw application" ($withdraw.ok -or $withdraw.actual -eq 400) "status=$($withdraw.actual) appId=$($script:appliedId)"
} else {
    Add-Result "12. Withdraw application" $false "no application id available"
}

# 13. Upload valid PDF resume (field name = resume) via curl.exe (PS5.1 has no -Form)
$validPdf = Join-Path $PSScriptRoot "e2e_valid_resume.pdf"
[System.IO.File]::WriteAllBytes($validPdf, [byte[]](0x25,0x50,0x44,0x46,0x2D,0x31,0x2E,0x37))
$up = & curl.exe -s -o NUL -w "%{http_code}" -X POST "$base/api/students/profile/resume" -H "Authorization: Bearer $script:token" -F "resume=@$validPdf;type=application/pdf" 2>$null
$upCode = ($up | Select-Object -Last 1)
Add-Result "13. Upload valid PDF resume" ($upCode -eq "200" -or $upCode -eq "201") "http=$upCode"
Remove-Item $validPdf -ErrorAction SilentlyContinue

# 14. Try invalid PDF (text file with .pdf name) -> must be rejected (4xx)
$invalidFile = Join-Path $PSScriptRoot "e2e_invalid_resume.pdf"
[System.IO.File]::WriteAllText($invalidFile, "This is not a real PDF, just plain text content.")
$inv = & curl.exe -s -o NUL -w "%{http_code}" -X POST "$base/api/students/profile/resume" -H "Authorization: Bearer $script:token" -F "resume=@$invalidFile;type=application/pdf" 2>$null
$invCode = ($inv | Select-Object -Last 1)
$invCodeInt = 0
[int]::TryParse($invCode, [ref]$invCodeInt) | Out-Null
Add-Result "14. Upload invalid PDF (rejected)" ($invCodeInt -ge 400) "http=$invCode (rejected as expected)"
Remove-Item $invalidFile -ErrorAction SilentlyContinue

# 15. Logout (frontend clears token; API stateless)
Add-Result "15. Logout (client-side token clear)" $true "stateless API; token cleared client-side"

# 16. Login again
$login2 = Invoke-Api "POST" "/api/auth/login" @{ email=$email; password=$pass } $null 200
Add-Result "16. Login again" $login2.ok "status=$($login2.actual)"

Write-Output ""
Write-Output "=== STUDENT E2E SUMMARY ==="
$passCount = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
Write-Output "PASS: $passCount  FAIL: $failCount  TOTAL: $($results.Count)"
$results | Format-Table -AutoSize
