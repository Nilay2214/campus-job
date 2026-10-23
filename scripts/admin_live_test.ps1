$ErrorActionPreference = "Stop"
$base = "http://localhost:8080"
$results = @()
function Add-Result($name, $ok, $detail) {
    $script:results += [PSCustomObject]@{ Step = $name; Status = $(if ($ok) {"PASS"} else {"FAIL"}); Detail = $detail }
    Write-Output ("[{0}] {1} - {2}" -f $(if ($ok) {"PASS"} else {"FAIL"}), $name, $detail)
}
function Invoke-ApiOnly($method, $path, $bodyObj, $token) {
    $headers = @{}
    if ($token) { $headers["Authorization"] = "Bearer $token" }
    $params = @{ Uri = "$base$path"; Method = $method; Headers = $headers; TimeoutSec = 20 }
    if ($bodyObj -ne $null) { $params["ContentType"] = "application/json"; $params["Body"] = ($bodyObj | ConvertTo-Json -Depth 10) }
    try { $resp = Invoke-WebRequest @params -UseBasicParsing; return @{ code=$resp.StatusCode; body=$resp.Content } }
    catch { if ($_.Exception.Response) { return @{ code=[int]$_.Exception.Response.StatusCode.value__; body="" } }; return @{ code=-1; body="" } }
}

# Login as seeded admin
$adminTok = $null
try {
    $login = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -ContentType "application/json" -Body (@{ email="admin@placement.com"; password="admin123" } | ConvertTo-Json) -TimeoutSec 20
    $adminTok = $login.token
} catch { $adminTok = $null }
Add-Result "ADM1. Admin login" ($null -ne $adminTok) "token=$([bool]$adminTok)"

if ($adminTok) {
    # Dashboard
    $d = Invoke-ApiOnly "GET" "/api/admin/dashboard" $null $adminTok
    Add-Result "ADM2. Dashboard stats = 200" ($d.code -eq 200) "code=$($d.code)"
    # Users list
    $u = Invoke-ApiOnly "GET" "/api/admin/users" $null $adminTok
    Add-Result "ADM3. Users list = 200" ($u.code -eq 200) "code=$($u.code)"
    # Companies list
    $c = Invoke-ApiOnly "GET" "/api/admin/companies" $null $adminTok
    Add-Result "ADM4. Companies list = 200" ($c.code -eq 200) "code=$($c.code)"
    # Analytics
    $an = Invoke-ApiOnly "GET" "/api/admin/analytics" $null $adminTok
    Add-Result "ADM5. Analytics = 200" ($an.code -eq 200) "code=$($an.code)"
    # Reports
    $r = Invoke-ApiOnly "GET" "/api/admin/reports" $null $adminTok
    Add-Result "ADM6. Reports = 200" ($r.code -eq 200) "code=$($r.code)"
    # Audit logs
    $aud = Invoke-ApiOnly "GET" "/api/admin/audit-logs" $null $adminTok
    Add-Result "ADM7. Audit logs = 200" ($aud.code -eq 200) "code=$($aud.code)"
    # Student cannot access admin audit-logs (403)
    $stuEmail = "adminflow_stu_" + (Get-Random -Maximum 999999) + "@example.com"
    try {
        $sreg = Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post -ContentType "application/json" -Body (@{ email=$stuEmail; password="Password@123"; role="STUDENT"; name="AdminFlow Stu" } | ConvertTo-Json) -TimeoutSec 20
        $stuTok = $sreg.token
        $stuAud = Invoke-ApiOnly "GET" "/api/admin/audit-logs" $null $stuTok
        Add-Result "ADM8. Student -> admin audit-logs = 403" ($stuAud.code -eq 403) "code=$($stuAud.code)"
    } catch { Add-Result "ADM8. Student -> admin audit-logs = 403" $false "could not register student" }
} else {
    Add-Result "ADM2. Dashboard stats = 200" $false "no token"
}

Write-Output ""
Write-Output "=== ADMIN LIVE FLOW SUMMARY ==="
$p = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$f = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
Write-Output "PASS: $p FAIL: $f TOTAL: $($results.Count)"
$results | Format-Table -AutoSize
</content>
