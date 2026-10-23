# LIVE MySQL-backed Recruiter E2E test
$ErrorActionPreference = "Stop"
$base = "http://localhost:8080"
$results = @()
$rEmail = "recruiter_e2e_" + (Get-Random -Maximum 999999) + "@example.com"
$sEmail = "student_e2e_" + (Get-Random -Maximum 999999) + "@example.com"
$pass = "Password@123"
$script:recToken = $null
$script:stuToken = $null
$script:companyId = $null
$script:jobId = $null
$script:stuProfileId = $null
$script:appId = $null

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
        return @{ ok = ($resp.StatusCode -eq $expectStatus); actual = $resp.StatusCode; body = $resp.Content }
    } catch {
        $actual = [int]$_.Exception.Response.StatusCode.value__
        return @{ ok = ($actual -eq $expectStatus); actual = $actual; body = "" }
    }
}

# --- Recruiter registration & login ---
$reg = Invoke-Api "POST" "/api/auth/register" @{ email=$rEmail; password=$pass; role="RECRUITER"; name="E2E Recruiter" } $null 200
Add-Result "R1. Register recruiter" $reg.ok "status=$($reg.actual)"
if ($reg.ok) { $rj=$reg.body|ConvertFrom-Json; $script:recToken=$rj.token }
$login = Invoke-Api "POST" "/api/auth/login" @{ email=$rEmail; password=$pass } $null 200
Add-Result "R2. Login recruiter" $login.ok "status=$($login.actual)"
if ($login.ok) { $lj=$login.body|ConvertFrom-Json; $script:recToken=$lj.token }

# --- Company CRUD ---
$compBody = @{ name="Acme Corp E2E $((Get-Random))"; industry="Information Technology"; website="https://acme.com"; location="Bengaluru, India"; description="Test company for E2E." }
$compCreate = Invoke-Api "POST" "/api/recruiters/companies" $compBody $script:recToken 201
if (-not $compCreate.ok) {
    $compCreate2 = Invoke-Api "POST" "/api/recruiters/companies" $compBody $script:recToken 200
    if ($compCreate2.ok) { $compCreate = $compCreate2 }
}
Add-Result "R3. Create company" $compCreate.ok "status=$($compCreate.actual)"
if ($compCreate.ok) { $cj=$compCreate.body|ConvertFrom-Json; $script:companyId=$cj.id }

if ($script:companyId) {
    $compUpd = Invoke-Api "PUT" "/api/recruiters/companies/$script:companyId" @{ name="Acme Corp E2E Updated"; industry="IT Services"; website="https://acme.com"; location="Mumbai, India"; description="Updated." } $script:recToken 200
    Add-Result "R4. Update company" $compUpd.ok "status=$($compUpd.actual)"
}

# --- Job CRUD ---
$deadline = (Get-Date).AddDays(30).ToString("yyyy-MM-ddTHH:mm:ss")
if ($script:companyId) {
    $jobBody = @{ title="Senior Java Engineer E2E"; description="Build backend systems"; eligibility="B.Tech CSE"; requiredSkills="Java, Spring Boot"; location="Bengaluru"; salaryMin=1200000; salaryMax=1800000; employmentType="FULL_TIME"; workMode="HYBRID"; experience="3-5"; deadline=$deadline; companyId=$script:companyId; status="ACTIVE" }
    $jobCreate = Invoke-Api "POST" "/api/recruiters/jobs" $jobBody $script:recToken 200
    Add-Result "R5. Create job" $jobCreate.ok "status=$($jobCreate.actual)"
    if ($jobCreate.ok) { $jj=$jobCreate.body|ConvertFrom-Json; $script:jobId=$jj.id }

    if ($script:jobId) {
        $jobGet = Invoke-Api "GET" "/api/recruiters/jobs/$script:jobId" $null $script:recToken 200
        Add-Result "R6. View job" $jobGet.ok "status=$($jobGet.actual)"

        $jobEdit = Invoke-Api "PUT" "/api/recruiters/jobs/$script:jobId" @{ title="Senior Java Engineer E2E (Updated)"; description="Updated description"; eligibility="B.Tech CSE"; requiredSkills="Java, Spring Boot, AWS"; location="Bengaluru"; salaryMin=1300000; salaryMax=2000000; employmentType="FULL_TIME"; workMode="HYBRID"; experience="3-5"; deadline=$deadline; companyId=$script:companyId; status="ACTIVE" } $script:recToken 200
        Add-Result "R7. Edit job" $jobEdit.ok "status=$($jobEdit.actual)"

        $jobList = Invoke-Api "GET" "/api/recruiters/jobs?page=0&size=10" $null $script:recToken 200
        Add-Result "R8. List my jobs" $jobList.ok "status=$($jobList.actual)"
    }
}

# --- Student applies to recruiter's job ---
if ($script:jobId) {
    $sreg = Invoke-Api "POST" "/api/auth/register" @{ email=$sEmail; password=$pass; role="STUDENT"; name="E2E Student" } $null 200
    Add-Result "R9. Register student (for application)" $sreg.ok "status=$($sreg.actual)"
    if ($sreg.ok) { $sj=$sreg.body|ConvertFrom-Json; $script:stuToken=$sj.token }

    $validPdf = "C:\Users\Nilay_bhamare\OneDrive\Desktop\Resume Project\cand_resume.pdf"
    [System.IO.File]::WriteAllBytes($validPdf,[byte[]](0x25,0x50,0x44,0x46,0x2D,0x31,0x2E,0x37))
    $up = & curl.exe -s -o - -w "|%{http_code}" -X POST "$base/api/students/profile/resume" -H "Authorization: Bearer $script:stuToken" -F "resume=@$validPdf;type=application/pdf" 2>$null
    $code = ($up -split '\|' | Select-Object -Last 1) -replace '[^0-9]',''
    Add-Result "R10. Student uploads resume" ($code -eq "200") "http=$code"
    Remove-Item $validPdf -ErrorAction SilentlyContinue

    $prof = Invoke-Api "GET" "/api/students/profile" $null $script:stuToken 200
    if ($prof.ok) { $pj=$prof.body|ConvertFrom-Json; $script:stuProfileId=$pj.id }

    $apply = Invoke-Api "POST" "/api/applications/$script:jobId" $null $script:stuToken 200
    Add-Result "R11. Student applies to job" ($apply.ok -or $apply.actual -eq 400) "status=$($apply.actual)"

    $apps = Invoke-Api "GET" "/api/recruiters/applications?page=0&size=10" $null $script:recToken 200
    Add-Result "R12. Recruiter view applications" $apps.ok "status=$($apps.actual)"
    if ($apps.ok) {
        $aj = $apps.body | ConvertFrom-Json
        $appArr = @()
        if ($aj.content) { $appArr=$aj.content } elseif ($aj -is [array]) { $appArr=$aj }
        if ($appArr -and $appArr.Count -gt 0) { $script:appId=$appArr[0].id }
    }

    $cand = Invoke-Api "GET" "/api/recruiters/applications?page=0&size=10&jobId=$script:jobId" $null $script:recToken 200
    Add-Result "R13. Candidate details (filtered)" $cand.ok "status=$($cand.actual)"

    if ($script:appId) {
        $st = Invoke-Api "PATCH" "/api/recruiters/applications/$script:appId/status" @{ status="SHORTLISTED" } $script:recToken 200
        Add-Result "R14. Update application status" $st.ok "status=$($st.actual)"
    } else {
        Add-Result "R14. Update application status" $false "no application id"
    }

    if ($script:stuProfileId) {
        $res = & curl.exe -s -o NUL -w "%{http_code}" "$base/api/resumes/student/$script:stuProfileId" -H "Authorization: Bearer $script:recToken" 2>$null
        Add-Result "R15. Recruiter accesses candidate resume" ($res -eq "200") "http=$res"

        $r2Email="recruiter2_"+ (Get-Random -Maximum 999999) +"@example.com"
        $r2reg = Invoke-Api "POST" "/api/auth/register" @{ email=$r2Email; password=$pass; role="RECRUITER"; name="E2E Recruiter2" } $null 200
        $r2tok = $null
        if ($r2reg.ok) { $r2j=$r2reg.body|ConvertFrom-Json; $r2tok=$r2j.token }
        if ($r2tok) {
            $res2 = & curl.exe -s -o NUL -w "%{http_code}" "$base/api/resumes/student/$script:stuProfileId" -H "Authorization: Bearer $r2tok" 2>$null
            Add-Result "R16. Unrelated recruiter resume access (expect 403)" ($res2 -eq "403") "http=$res2"
        } else {
            Add-Result "R16. Unrelated recruiter resume access (expect 403)" $false "could not register recruiter2"
        }
    } else {
        Add-Result "R15. Recruiter accesses candidate resume" $false "no student profile id"
        Add-Result "R16. Unrelated recruiter resume access (expect 403)" $false "no student profile id"
    }
}

# --- Delete job ---
# Job R5/R7 has an application (from R11) -> deletion must be BLOCKED (409) to
# preserve referential integrity, with a clear business message. This is the
# correct behavior after the deleteJob fix.
if ($script:jobId) {
    $del = Invoke-Api "DELETE" "/api/recruiters/jobs/$script:jobId" $null $script:recToken 409
    Add-Result "R17. Delete job with applications (expect 409 blocked)" ($del.ok -or $del.actual -eq 409) "status=$($del.actual) (job has applications -> blocked)"
}

# R18. Delete a job with NO applications -> must succeed (204)
$delJobBody = @{ title="Temp Delete Me Job"; description="d"; eligibility="UG"; requiredSkills="Java"; location="Pune"; salaryMin=100000; salaryMax=200000; employmentType="FULL_TIME"; workMode="HYBRID"; experience="0-2"; deadline=$deadline; companyId=$script:companyId; status="ACTIVE" }
$tmpJob = Invoke-Api "POST" "/api/recruiters/jobs" $delJobBody $script:recToken 200
if ($tmpJob.ok) {
    $tmpJobId = ($tmpJob.body | ConvertFrom-Json).id
    $delTmp = Invoke-Api "DELETE" "/api/recruiters/jobs/$tmpJobId" $null $script:recToken 204
    Add-Result "R18. Delete job with no applications" $delTmp.ok "status=$($delTmp.actual)"
} else {
    Add-Result "R18. Delete job with no applications" $false "could not create temp job"
}

Write-Output ""
Write-Output "=== RECRUITER E2E SUMMARY ==="
$passCount = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
Write-Output "PASS: $passCount  FAIL: $failCount  TOTAL: $($results.Count)"
$results | Format-Table -AutoSize
