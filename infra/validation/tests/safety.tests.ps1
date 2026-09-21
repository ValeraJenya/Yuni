#requires -Version 7.4
# Synthetic, offline tests only. No Docker executable, network connection or database is used.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Import-Module "$PSScriptRoot\..\safety.psm1" -Force -DisableNameChecking
$script:passed = 0
function Check([string]$Name, [scriptblock]$Test, [switch]$Reject) {
    $failed = $false
    try { & $Test } catch { $failed = $true }
    if ($failed -ne [bool]$Reject) { throw "TEST FAILED: $Name" }
    $script:passed++; Write-Output "PASS $Name"
}
function Clone($Value) { return ($Value | ConvertTo-Json -Depth 30 | ConvertFrom-Json -AsHashtable) }
$temp = Join-Path ([IO.Path]::GetTempPath()) ('yuni-validation-static-' + [guid]::NewGuid().ToString('N'))
$null = [IO.Directory]::CreateDirectory($temp)
try {
    $model = Get-Content -LiteralPath "$PSScriptRoot\..\compose.validation.yml" -Raw | ConvertFrom-Json -AsHashtable
    $values = @{
        COMPOSE_PROJECT_NAME='yuni-validation'; VALIDATION_ENVIRONMENT='yuni-audit-validation'
        VALIDATION_EXTERNAL_PROVIDERS='disabled'; VALIDATION_DATABASE_NAME='yuni_validation_test'
        VALIDATION_POSTGRES_PORT='56032'; VALIDATION_POSTGRES_USER='yuni_validation_user'
        VALIDATION_POSTGRES_PASSWORD=('a' * 40); VALIDATION_WORKTREE_ROOT=$temp
        VALIDATION_MEDIA_ROOT="$temp\apps\backend\uploads\dec-005"
        DATABASE_URL=('postgresql://yuni_validation_user:' + ('a' * 40) + '@127.0.0.1:56032/yuni_validation_test?schema=public')
        TEST_DATABASE_URL=('postgresql://yuni_validation_user:' + ('a' * 40) + '@127.0.0.1:56032/yuni_validation_test?schema=public')
    }
    Check 'valid synthetic inputs' { Assert-ValidationEnvironment $values $temp }
    $urlCases = @{
        'non-loopback host'=@('127.0.0.1','192.0.2.1'); 'localhost alias'=@('127.0.0.1','localhost')
        'ordinary host port'=@('56032','5432'); 'wrong host port'=@('56032','56033')
        'ordinary database'=@('yuni_validation_test','yuni'); 'production target'=@('127.0.0.1','production')
        'staging target'=@('127.0.0.1','staging'); 'ordinary container host'=@('127.0.0.1','yuni-postgres-1')
    }
    foreach ($case in $urlCases.Keys) {
        $bad=Clone $values; $bad.DATABASE_URL=$bad.DATABASE_URL.Replace($urlCases[$case][0],$urlCases[$case][1])
        Check $case { Assert-ValidationEnvironment $bad $temp } -Reject
    }
    foreach ($key in @('DATABASE_URL','TEST_DATABASE_URL')) {
        $bad=Clone $values; $bad.Remove($key)
        Check "missing $key" { Assert-ValidationEnvironment $bad $temp } -Reject
    }
    $bad=Clone $values; $bad.TEST_DATABASE_URL += '&host=production'
    Check 'URL query override' { Assert-ValidationEnvironment $bad $temp } -Reject
    $bad=Clone $values; $bad.VALIDATION_POSTGRES_PORT='5432'
    Check 'explicit forbidden port variable' { Assert-ValidationEnvironment $bad $temp } -Reject
    $bad=Clone $values; $bad.VALIDATION_MEDIA_ROOT=Split-Path -Parent $temp
    Check 'outside media scope' { Assert-ValidationEnvironment $bad $temp } -Reject
    $bad=Clone $values; $bad.VALIDATION_MEDIA_ROOT="$temp\apps\backend\uploads"
    Check 'ordinary uploads root' { Assert-ValidationEnvironment $bad $temp } -Reject
    $bad=Clone $values; $bad.VALIDATION_WORKTREE_ROOT='.'
    Check 'relative worktree' { Assert-ValidationEnvironment $bad $temp } -Reject
    Check 'different expected worktree' { Assert-ValidationEnvironment $values (Split-Path -Parent $temp) } -Reject
    Check 'path traversal' { Get-SafePath "$temp\..\escape" } -Reject
    $target = Join-Path $temp 'synthetic-target'
    $mediaParent = Join-Path $temp 'apps\backend\uploads'
    $null = [IO.Directory]::CreateDirectory($target)
    $null = [IO.Directory]::CreateDirectory($mediaParent)
    $junction = Join-Path $mediaParent 'dec-005'
    $null = New-Item -ItemType Junction -Path $junction -Target $target
    try {
        Check 'media junction escape' { Assert-ValidationEnvironment $values $temp } -Reject
    } finally { Remove-Item -LiteralPath $junction -Force }
    Check 'UNC root' { Get-SafePath '\\server\share' } -Reject
    foreach ($key in @('DATABASE_URL','TEST_DATABASE_URL','PGHOST','DOCKER_HOST','COMPOSE_FILE','AWS_ACCESS_KEY_ID','HTTPS_PROXY','JWT_ACCESS_SECRET')) {
        Check "inherited $key" { Assert-InheritedEnvironment @{$key='synthetic-dangerous-value'} } -Reject
    }
    Check 'benign parent environment' { Assert-InheritedEnvironment @{SystemRoot='C:\Windows';TEMP=$temp} }
    $bad=Clone $values; $bad.UNKNOWN_PROVIDER='enabled'
    Check 'extra env key' { Assert-ValidationEnvironment $bad $temp } -Reject
    $fixture = Join-Path $temp 'synthetic-input.txt'
    [IO.File]::WriteAllText($fixture, "DATABASE_URL=x" + [Environment]::NewLine + "DATABASE_URL=y")
    Check 'duplicate env key' { Read-ValidationEnvironment $fixture } -Reject
    [IO.File]::WriteAllText($fixture, 'DATABASE_URL=${ROOT_DATABASE_URL}')
    Check 'env interpolation' { Read-ValidationEnvironment $fixture } -Reject
    Check 'valid source Compose structure' { Assert-ComposeTopology $model $values '' }
    foreach ($service in @('backend','frontend','worker')) {
        $bad=Clone $model; $bad.services[$service]=@{image='synthetic'}
        Check "extra $service service" { Assert-ComposeTopology $bad $values '' } -Reject
    }
    $bad=Clone $model; $bad.networks.validation_network.internal=$true
    Check 'internal network regression' { Assert-ComposeTopology $bad $values '' } -Reject
    $bad=Clone $model; $bad.services['validation-postgres'].ports[0].host_ip='0.0.0.0'
    Check 'wildcard bind' { Assert-ComposeTopology $bad $values '' } -Reject
    $bad=Clone $model; $bad.services['validation-postgres'].ports += @{target=5432;published='5432';host_ip='127.0.0.1';protocol='tcp'}
    Check 'extra port' { Assert-ComposeTopology $bad $values '' } -Reject
    $bad=Clone $model; $bad.services['validation-postgres'].volumes[0].type='bind'
    Check 'bind mount' { Assert-ComposeTopology $bad $values '' } -Reject
    $bad=Clone $model; $bad.volumes.validation_postgres_data.name='yuni_postgres_data'
    Check 'ordinary Yuni volume' { Assert-ComposeTopology $bad $values '' } -Reject
    $bad=Clone $model; $bad.networks.validation_network.name='yuni_default'
    Check 'ordinary Yuni network' { Assert-ComposeTopology $bad $values '' } -Reject
    $bad=Clone $model; $bad.services['validation-postgres'].container_name='yuni-postgres-1'
    Check 'ordinary Yuni container' { Assert-ComposeTopology $bad $values '' } -Reject
    $bad=Clone $model; $bad.services['validation-postgres'].privileged=$true
    Check 'privileged service' { Assert-ComposeTopology $bad $values '' } -Reject
    $bad=Clone $model; $bad.volumes.validation_postgres_data.external=$true
    Check 'external volume' { Assert-ComposeTopology $bad $values '' } -Reject
    $run='a' * 32
    $rendered=Clone $model
    $s=$rendered.services['validation-postgres']
    $s.environment.POSTGRES_USER=$values.VALIDATION_POSTGRES_USER
    $s.environment.POSTGRES_PASSWORD=$values.VALIDATION_POSTGRES_PASSWORD
    $s.ports[0].published='56032'; $s.ports[0].mode='ingress'; $s.volumes[0].volume=@{}
    foreach ($resource in @($s,$rendered.volumes.validation_postgres_data,$rendered.networks.validation_network)) {
        $resource.labels['io.yuni.validation.run']=$run
    }
    Check 'synthetic normalized Compose model' { Assert-ComposeTopology $rendered $values $run -Rendered }
    $bad=Clone $rendered; $bad.services['validation-postgres'].environment.POSTGRES_DB='yuni'
    Check 'rendered database mismatch' { Assert-ComposeTopology $bad $values $run -Rendered } -Reject
    Check 'empty resource namespace' { Assert-NoExistingResources @() }
    foreach ($entry in @(@{Name='yuni-validation-network';Labels=''},@{Name='other';Labels='com.docker.compose.project=yuni-validation'},
        @{Name='other';Labels='io.yuni.validation.run=old'})) {
        Check 'unknown preexisting resource' { Assert-NoExistingResources @($entry) } -Reject
    }
    $labels=@{'com.docker.compose.project'='yuni-validation';'io.yuni.validation.run'=$run;'io.yuni.validation.environment'='yuni-audit-validation'}
    $container=@{Name='/yuni-validation-postgres';Id=('b'*64);Config=@{Labels=$labels}}
    Check 'owned container' { $null=Assert-OwnedResource $container 'container' $run ('b'*64) }
    $bad=Clone $container; $bad.Config.Labels['io.yuni.validation.run']='old'
    Check 'foreign run ownership' { Assert-OwnedResource $bad 'container' $run } -Reject
    Check 'changed container ID' { Assert-OwnedResource $container 'container' $run ('c'*64) } -Reject
    $volume=@{Name='yuni-validation-postgres-data';CreatedAt='2026-09-21T00:00:00Z';Driver='local';Scope='local';Options=@{};Labels=$labels}
    Check 'owned volume creation identity' { $null=Assert-OwnedResource $volume 'volume' $run 'yuni-validation-postgres-data|2026-09-21T00:00:00Z' }
    Check 'replaced volume' { Assert-OwnedResource $volume 'volume' $run 'yuni-validation-postgres-data|different' } -Reject
    $calls=[Collections.Generic.List[string]]::new()
    Check 'gate exception aborts remaining operations including cleanup' {
        Invoke-SafetySteps @({$calls.Add('gate');throw 'synthetic STOP'},{$calls.Add('start')},{$calls.Add('cleanup')})
    } -Reject
    Check 'nothing after failed gate' { Assert-Safe (($calls -join ',') -ceq 'gate') 'continued after failed gate' }
    # Child process is PowerShell only: exercise environment clearing without any native Docker adapter.
    $env:YUNI_SYNTHETIC_INHERITED='must-not-leak'
    try {
        $r=Invoke-SafeProcess (Get-Process -Id $PID).Path @('-NoProfile','-Command',
            'if ($env:YUNI_SYNTHETIC_INHERITED) { exit 1 }; Write-Output "clean"') $temp
        Check 'child environment cleared' { Assert-Safe ($r.Output.Trim() -ceq 'clean') 'inherited value leaked' }
    } finally { Remove-Item Env:\YUNI_SYNTHETIC_INHERITED }

    $childFile = Join-Path $temp 'harmless-child.ps1'
    [IO.File]::WriteAllText($childFile, '[IO.File]::WriteAllText("$PSScriptRoot\child-pid.txt",[string]$PID); [Console]::Error.WriteLine("SYNTHETIC_SECRET_DO_NOT_EMIT"); Start-Sleep -Seconds 30')
    $parentFile = Join-Path $temp 'harmless-parent.ps1'
    $parentText = @'
param([string]$Mode)
$start=[Diagnostics.ProcessStartInfo]::new()
$start.FileName=(Get-Process -Id $PID).Path
$start.UseShellExecute=$false
$start.CreateNoWindow=$true
foreach ($a in @('-NoProfile','-File',"$PSScriptRoot\harmless-child.ps1")) { $start.ArgumentList.Add($a) }
$child=[Diagnostics.Process]::Start($start)
[IO.File]::WriteAllText("$PSScriptRoot\child-pid.txt",[string]$child.Id)
if ($Mode -eq 'parent-waits') { Start-Sleep -Seconds 30 }
'@
    [IO.File]::WriteAllText($parentFile, $parentText)
    foreach ($mode in @('parent-waits','parent-exits')) {
        $failureMessage=''
        $watch=[Diagnostics.Stopwatch]::StartNew()
        try {
            $null=Invoke-SafeProcess (Get-Process -Id $PID).Path @('-NoProfile','-File',$parentFile,$mode) $temp @{} 2
        } catch { $failureMessage=$_.Exception.Message }
        Check "$mode reaches bounded STOP" {
            Assert-Safe ($failureMessage -match 'SAFETY STOP' -and $watch.Elapsed.TotalSeconds -lt 10) 'timeout not bounded'
        }
        Check "$mode hides stderr" { Assert-Safe ($failureMessage -notmatch 'SYNTHETIC_SECRET') 'stderr leaked' }
        $childPid=[int][IO.File]::ReadAllText((Join-Path $temp 'child-pid.txt'))
        Check "$mode descendant terminated" {
            Assert-Safe ($null -eq (Get-Process -Id $childPid -ErrorAction SilentlyContinue)) 'descendant survived'
        }
        Remove-Item -LiteralPath (Join-Path $temp 'child-pid.txt')
    }


    # A native launcher can spawn before a PowerShell child has initialized.
    # CREATE_SUSPENDED assignment must contain even this immediate child.
    $fastFile=Join-Path $temp 'fast-parent.cmd'
    $pwshPath=(Get-Process -Id $PID).Path
    [IO.File]::WriteAllText($fastFile, '@start "" /b "' + $pwshPath + '" -NoProfile -File "' + $childFile + '"' + [Environment]::NewLine)
    $failureMessage=''; $watch=[Diagnostics.Stopwatch]::StartNew()
    try { $null=Invoke-SafeProcess "$env:SystemRoot\System32\cmd.exe" @('/d','/c',$fastFile) $temp @{} 2 }
    catch { $failureMessage=$_.Exception.Message }
    Check 'fast native parent bounded STOP' {
        Assert-Safe ($failureMessage -match 'SAFETY STOP' -and $watch.Elapsed.TotalSeconds -lt 10) 'fast launcher escaped deadline'
    }
    $childPid=[int][IO.File]::ReadAllText((Join-Path $temp 'child-pid.txt'))
    Check 'fast native descendant terminated' {
        Assert-Safe ($null -eq (Get-Process -Id $childPid -ErrorAction SilentlyContinue)) 'fast descendant escaped job'
    }
    Remove-Item -LiteralPath (Join-Path $temp 'child-pid.txt')
    $argvFile=Join-Path $temp 'argv-only.ps1'
    [IO.File]::WriteAllText($argvFile, '[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false); $args | ConvertTo-Json -Compress')
    $argv=@('space value','C:\trailing\','literal"quote','Юни')
    $r=Invoke-SafeProcess $pwshPath (@('-NoProfile','-File',$argvFile)+$argv) $temp
    Check 'native arguments preserved' {
        Assert-Safe ($r.Output.Trim() -ceq ($argv | ConvertTo-Json -Compress)) 'native quoting changed arguments'
    }

    Write-Output "STATIC TESTS PASS: $script:passed; Docker/DB/runtime operations: 0."
} finally {
    # This test owns a unique temporary root. Verify the final target before recursive removal.
    $resolved = [IO.Path]::GetFullPath($temp)
    $prefix = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\') + '\yuni-validation-static-'
    if (-not $resolved.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe fixture cleanup path' }
    Remove-Item -LiteralPath $resolved -Recurse -Force
}
