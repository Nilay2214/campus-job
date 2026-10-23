$ErrorActionPreference = "Stop"
$base = "http://localhost:8080"
$results = @()
$pass = "Password@123"

function Add-Result($name, $ok, $detail) {
    $script:results += [PSCustomObject]@{ Step = $name; Status = $(if ($ok) {"PASS"} else {"FAIL"}); Detail = $detail }
    Write-Output ("[{0}] {1} - {2}" -f $(if ($ok) {"PASS"} else {"FAIL"}), $name, $detail)
}

function Invoke-ApiOnly($method, $path, $bodyObj, $token) {
    $headers = @{}
    if ($token) { $headers["Authorization"] = "Bearer $token" }
    $params = @{ Uri = "$base$path"; Method = $method; Headers = $headers; TimeoutSec = 20 }
    if ($bodyObj -ne $null) { $params["ContentType"] = "application/json"; $params["Body"] = ($bodyObj | ConvertTo-Json -Depth 10) }
    try {
        $resp = Invoke-WebRequest @params -UseBasicParsing
        return $resp.StatusCode
    } catch {
        if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode.value__ }
        return -1
    }
}

# Helper to register a user and get a token
function Register-User($role) {
    $email = ("e2e_" + $role.ToLower() + "_" + (Get-Random -Maximum 9999999) + "@example.com")
    $reg = Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post -ContentType "application/json" `
        -Body (@{ email=$email; password=$pass; role=$role; name=("E2E " + $role) } | ConvertTo-Json) -TimeoutSec 20
    return $reg.token
}

# --- Anonymous → protected API = 401 ---
$ani = Invoke-ApiOnly "GET" "/api/students/profile" $null $null
Add-Result "ANC1. Anonymous -> student API = 401" ($ani -eq 401) "actual=$ani"

$ani2 = Invoke-ApiOnly "GET" "/api/recruiters/jobs" $null $null
Add-Result "ANC2. Anonymous -> recruiter API = 401" ($ani2 -eq 401) "actual=$ani2"

$ani3 = Invoke-ApiOnly "GET" "/api/admin/stats" $null $null
Add-Result "ANC3. Anonymous -> admin API = 401" ($ani3 -eq 401) "actual=$ani3"

# --- STUDENT principal ---
$stuTok = Register-User "STUDENT"
Add-Result "RBAC-S1. Register STUDENT" ($null -ne $stuTok) "token=$([bool]$stuTok)"
if ($stuTok) {
    $s1 = Invoke-ApiOnly "GET" "/api/students/profile" $null $stuTok
    Add-Result "RBAC-S2. STUDENT -> student API = 200" ($s1 -eq 200) "actual=$s1"

    $s2 = Invoke-ApiOnly "POST" "/api/recruiters/companies" @{ name="X"; industry="Y"; website="https://x.com"; location="Z" } $stuTok
    Add-Result "RBAC-S3. STUDENT -> recruiter mutation = 403" ($s2 -eq 403) "actual=$s2"

    $s3 = Invoke-ApiOnly "GET" "/api/admin/stats" $null $stuTok
    Add-Result "RBAC-S4. STUDENT -> admin API = 403" ($s3 -eq 403) "actual=$s3"
}

# --- RECRUITER principal ---
$recTok = Register-User "RECRUITER"
Add-Result "RBAC-R1. Register RECRUITER" ($null -ne $recTok) "token=$([bool]$recTok)"
if ($recTok) {
    $r1 = Invoke-ApiOnly "POST" "/api/recruiters/companies" @{ name=("RBAC Co " + (Get-Random)); industry="IT"; website="https://c.com"; location="Pune"; description="x" } $recTok
    Add-Result "RBAC-R2. RECRUITER -> create company = 200/201" (($r1 -eq 200) -or ($r1 -eq 201)) "actual=$r1"

    $r2 = Invoke-ApiOnly "GET" "/api/recruiters/jobs" $null $recTok
    Add-Result "RBAC-R3. RECRUITER -> recruiter API = 200" ($r2 -eq 200) "actual=$r2"

    $r3 = Invoke-ApiOnly "GET" "/api/admin/stats" $null $recTok
    Add-Result "RBAC-R4. RECRUITER -> admin API = 403" ($r3 -eq 403) "actual=$r3"

    $r4 = Invoke-ApiOnly "POST" "/api/applications/1" $null $recTok
    Add-Result "RBAC-R5. RECRUITER -> apply to job = 403" ($r4 -eq 403) "actual=$r4"
}

# --- ADMIN principal (register normally then note admin self-reg behavior) ---
# Try to self-register as ADMIN (should be downgraded/blocked)
$adminRegEmail = ("admin_self_" + (Get-Random -Maximum 9999999) + "@example.com")
$adminBlocked = $true
try {
    $reg = Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post -ContentType "application/json" `
        -Body (@{ email=$adminRegEmail; password=$pass; role="ADMIN"; name="Admin Self" } | ConvertTo-Json) -TimeoutSec 20
    $adminBlocked = ($reg.role -ne "ADMIN")
} catch {
    $adminBlocked = $true
}
Add-Result "SEC1. ADMIN self-registration is blocked/downgraded" $adminBlocked "self-reg rejected or downgraded"

# --- ADMIN principal (seeded dev admin) -> admin APIs = 200 ---
# The seeded admin is present in the DB (confirmed via login). Use it to verify
# that a genuine ADMIN token is granted access to admin-only endpoints.
$adminLoginBody = @{ email = "admin@placement.com"; password = "admin123" } | ConvertTo-Json
$adminTok = $null
try {
    $adminLogin = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -ContentType "application/json" -Body $adminLoginBody -TimeoutSec 20
    $adminTok = $adminLogin.token
} catch { $adminTok = $null }
Add-Result "SEC2. Seeded ADMIN login" ($null -ne $adminTok) "token=$([bool]$adminTok)"
if ($adminTok) {
    $a1 = Invoke-ApiOnly "GET" "/api/admin/dashboard" $null $adminTok
    Add-Result "SEC3. ADMIN -> admin dashboard API = 200" ($a1 -eq 200) "actual=$a1"

    $a2 = Invoke-ApiOnly "GET" "/api/admin/users" $null $adminTok
    Add-Result "SEC4. ADMIN -> admin users API = 200" ($a2 -eq 200) "actual=$a2"

    $a3 = Invoke-ApiOnly "GET" "/api/admin/analytics" $null $adminTok
    Add-Result "SEC5. ADMIN -> admin analytics API = 200" ($a3 -eq 200) "actual=$a3"

    $a4 = Invoke-ApiOnly "GET" "/api/admin/reports" $null $adminTok
    Add-Result "SEC6. ADMIN -> admin reports API = 200" ($a4 -eq 200) "actual=$a4"

    # Recruiter controllers enforce @PreAuthorize("hasRole('RECRUITER')") at method level,
    # so even ADMIN is denied (403) on recruiter job-management endpoints. This is intended
    # least-privilege isolation (admin cannot impersonate a recruiter's own job management).
    $a5 = Invoke-ApiOnly "GET" "/api/recruiters/jobs" $null $adminTok
    Add-Result "SEC7. ADMIN -> recruiter job mgmt (method-level RECRUITER-only) = 403" ($a5 -eq 403) "actual=$a5"
}

Write-Output ""
Write-Output "=== RBAC + SECURITY SUMMARY ==="
$passC = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failC = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
Write-Output "PASS: $passC FAIL: $failC TOTAL: $($results.Count)"
$results | Format-Table -AutoSize
