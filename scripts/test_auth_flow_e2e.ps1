$ErrorActionPreference = "Stop"

function Test-Step {
    param([string]$name, [scriptblock]$script)
    Write-Host "=========================================="
    Write-Host "RUNNING: $name" -ForegroundColor Cyan
    try {
        & $script
        Write-Host "RESULT: PASS" -ForegroundColor Green
    } catch {
        Write-Host "RESULT: FAIL - $($_.Exception.Message)" -ForegroundColor Red
        throw $_
    }
}

function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Url,
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )
    $params = @{
        Uri = $Url
        Method = $Method
        Headers = $Headers
        UseBasicParsing = $true
        TimeoutSec = 15
    }
    if ($Body -ne $null) {
        $params["ContentType"] = "application/json"
        $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
    }
    try {
        $resp = Invoke-WebRequest @params
        $jsonObj = $null
        try { $jsonObj = $resp.Content | ConvertFrom-Json } catch { }
        return [PSCustomObject]@{
            StatusCode = [int]$resp.StatusCode
            Content = $resp.Content
            Json = $jsonObj
        }
    } catch {
        if ($_.Exception.Response) {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $errContent = $reader.ReadToEnd()
            $errJson = $null
            try { $errJson = $errContent | ConvertFrom-Json } catch { }
            return [PSCustomObject]@{
                StatusCode = [int]$_.Exception.Response.StatusCode
                Content = $errContent
                Json = $errJson
            }
        }
        throw $_
    }
}

$baseUrl = "http://localhost:8080"
$frontUrl = "http://localhost:3000"

# 1. Frontend Server check
Test-Step "Frontend Dev Server responds with 200" {
    $res = Invoke-ApiRequest -Method "GET" -Url $frontUrl
    if ($res.StatusCode -ne 200) { throw "Expected 200, got $($res.StatusCode)" }
    if ($res.Content -notmatch "Campus Job") { throw "Page missing Campus Job title" }
    Write-Host "  -> Port 3000 online with title Campus Job" -ForegroundColor Gray
}

# 2. Student Registration & Login Test
$studentEmail = "student_login_test_" + (Get-Random -Maximum 999999) + "@example.com"
$studentPass = "Password@123"

Test-Step "Student Register and Login" {
    $reg = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/api/auth/register" -Body @{
        fullName = "Test Student"
        email = $studentEmail
        password = $studentPass
        role = "STUDENT"
    }
    if ($reg.StatusCode -ne 200 -or -not $reg.Json.token) { throw "Student registration failed" }
    
    $login = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/api/auth/login" -Body @{
        email = $studentEmail
        password = $studentPass
    }
    if ($login.StatusCode -ne 200 -or -not $login.Json.token) { throw "Student login failed" }
    if ($login.Json.role -ne "STUDENT") { throw "Expected role STUDENT, got $($login.Json.role)" }
    
    $prof = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/api/students/profile" -Headers @{
        Authorization = "Bearer $($login.Json.token)"
    }
    if ($prof.StatusCode -ne 200 -or -not $prof.Json.id) { throw "Student profile check failed" }
    Write-Host "  -> Student login verified: Token OK, Role=STUDENT, Profile ID=$($prof.Json.id)" -ForegroundColor Gray
}

# 3. Recruiter Registration & Login Test
$recruiterEmail = "recruiter_login_test_" + (Get-Random -Maximum 999999) + "@example.com"
$recruiterPass = "Password@123"

Test-Step "Recruiter Register and Login" {
    $reg = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/api/auth/register" -Body @{
        fullName = "Test Recruiter"
        email = $recruiterEmail
        password = $recruiterPass
        role = "RECRUITER"
    }
    if ($reg.StatusCode -ne 200 -or -not $reg.Json.token) { throw "Recruiter registration failed" }
    
    $login = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/api/auth/login" -Body @{
        email = $recruiterEmail
        password = $recruiterPass
    }
    if ($login.StatusCode -ne 200 -or -not $login.Json.token) { throw "Recruiter login failed" }
    if ($login.Json.role -ne "RECRUITER") { throw "Expected role RECRUITER, got $($login.Json.role)" }
    
    $jobs = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/api/recruiters/jobs" -Headers @{
        Authorization = "Bearer $($login.Json.token)"
    }
    if ($jobs.StatusCode -ne 200) { throw "Recruiter jobs check failed" }
    Write-Host "  -> Recruiter login verified: Token OK, Role=RECRUITER, Jobs API accessible" -ForegroundColor Gray
}

# 4. Admin Login Test
Test-Step "Admin Login (Valid Credentials)" {
    $login = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/api/auth/login" -Body @{
        email = "admin@placement.com"
        password = "admin123"
    }
    if ($login.StatusCode -ne 200 -or -not $login.Json.token) { throw "Admin login failed" }
    if ($login.Json.role -ne "ADMIN") { throw "Expected role ADMIN, got $($login.Json.role)" }
    
    $users = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/api/admin/users" -Headers @{
        Authorization = "Bearer $($login.Json.token)"
    }
    if ($users.StatusCode -ne 200) { throw "Admin users check failed" }
    Write-Host "  -> Admin login verified: Token OK, Role=ADMIN, Admin Users API accessible" -ForegroundColor Gray
}

# 5. Invalid Password Rejection Test (401)
Test-Step "Invalid Password Rejection (401)" {
    $login = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/api/auth/login" -Body @{
        email = $studentEmail
        password = "WrongPassword999!"
    }
    if ($login.StatusCode -ne 401) { throw "Expected 401 Unauthorized, got $($login.StatusCode)" }
    if ($login.Json.error -notmatch "Invalid email or password") { throw "Unexpected error: $($login.Json.error)" }
    Write-Host "  -> Invalid credentials properly rejected with 401: $($login.Json.error)" -ForegroundColor Gray
}

# 6. Disabled Account Login Test (401)
Test-Step "Disabled Account Login Rejection (401)" {
    $tempEmail = "disabled_test_" + (Get-Random -Maximum 999999) + "@example.com"
    $reg = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/api/auth/register" -Body @{
        fullName = "Disabled Test User"
        email = $tempEmail
        password = "password123"
        role = "STUDENT"
    }
    if ($reg.StatusCode -ne 200) { throw "Temp registration failed" }
    
    $adminLogin = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/api/auth/login" -Body @{
        email = "admin@placement.com"
        password = "admin123"
    }
    $adminHeaders = @{ Authorization = "Bearer $($adminLogin.Json.token)" }
    
    $users = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/api/admin/users" -Headers $adminHeaders
    $targetUser = $users.Json | Where-Object { $_.email -eq $tempEmail }
    if (-not $targetUser) { throw "Target user $tempEmail not found in admin list" }
    
    $patch = Invoke-ApiRequest -Method "PATCH" -Url "$baseUrl/api/admin/users/$($targetUser.id)/status" -Body @{ enabled = $false } -Headers $adminHeaders
    if ($patch.StatusCode -ne 200 -or $patch.Json.enabled -ne $false) { throw "Failed to disable user" }
    
    $disabledLogin = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/api/auth/login" -Body @{
        email = $tempEmail
        password = "password123"
    }
    if ($disabledLogin.StatusCode -ne 401) { throw "Expected 401 for disabled user, got $($disabledLogin.StatusCode)" }
    if ($disabledLogin.Json.error -notmatch "Account is disabled") { throw "Expected disabled error message, got: $($disabledLogin.Json.error)" }
    Write-Host "  -> Disabled account properly rejected with 401: $($disabledLogin.Json.error)" -ForegroundColor Gray
}

# 7. Student Role Isolation / RBAC Test (403)
Test-Step "Student Role Isolation / RBAC" {
    $login = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/api/auth/login" -Body @{
        email = $studentEmail
        password = $studentPass
    }
    $studentHeaders = @{ Authorization = "Bearer $($login.Json.token)" }
    
    $adminAttempt = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/api/admin/users" -Headers $studentHeaders
    if ($adminAttempt.StatusCode -ne 403) { throw "Expected 403 Forbidden for student on /api/admin/users, got $($adminAttempt.StatusCode)" }
    
    $recruiterAttempt = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/api/recruiters/jobs" -Headers $studentHeaders
    if ($recruiterAttempt.StatusCode -ne 403) { throw "Expected 403 Forbidden for student on /api/recruiters/jobs, got $($recruiterAttempt.StatusCode)" }
    
    Write-Host "  -> RBAC enforced: Student blocked from Admin (403) and Recruiter (403) endpoints" -ForegroundColor Gray
}

# 8. CORS Preflight & Origin Header Test
Test-Step "CORS Configuration for http://localhost:3000" {
    $corsHeaders = @{
        Origin = "http://localhost:3000"
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "Authorization,Content-Type"
    }
    $cors = Invoke-ApiRequest -Method "OPTIONS" -Url "$baseUrl/api/auth/login" -Headers $corsHeaders
    if ($cors.StatusCode -ne 200 -and $cors.StatusCode -ne 204) {
        throw "CORS OPTIONS preflight returned unexpected status: $($cors.StatusCode)"
    }
    Write-Host "  -> CORS preflight successful: $($cors.StatusCode)" -ForegroundColor Gray
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "ALL 8 COMPREHENSIVE LOGIN & AUTH SCENARIOS PASSED!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
