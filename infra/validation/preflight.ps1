#requires -Version 7.4
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$ExpectedWorktreeRoot,
    [Parameter(Mandatory)][string]$BaselineSha,
    [Parameter(Mandatory)][string]$ExpectedHeadSha,
    [Parameter(Mandatory)][string]$EnvFile,
    [switch]$Execute,
    [string]$OwnerApproval
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$journal = $null; $mutex = $null; $lockHeld = $false; $writer = $null
try {
    Import-Module "$PSScriptRoot\safety.psm1" -Force -DisableNameChecking
    $ctx = Get-StaticContext $ExpectedWorktreeRoot $BaselineSha $ExpectedHeadSha $EnvFile $PSScriptRoot
    if (-not $Execute) {
        Write-Output 'STATIC GUARD PASS. Runtime gates NOT RUN. Docker not invoked.'
        exit 0
    }
    Assert-Safe ($OwnerApproval -ceq 'DEC-005 PostgreSQL-only preflight and owned cleanup') 'explicit preflight approval required'
    $mutex = [Threading.Mutex]::new($false, 'Global\YuniDEC005Validation')
    $lockHeld = $mutex.WaitOne(0)
    Assert-Safe $lockHeld 'another validation runner exists'
    $ctx.RunId = [guid]::NewGuid().ToString('N')
    $ctx.DockerHost = 'npipe:////./pipe/dockerDesktopLinuxEngine'
    $ctx.Ids = @{}
    $reportDir = Get-SafePath "$($ctx.Root)\docs\audits\yuni-2026-09\passes\validation"
    $null = [IO.Directory]::CreateDirectory($reportDir)
    $report = Get-SafePath "$reportDir\dec005-$($ctx.RunId).json"
    $writer = [IO.File]::Open($report, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::Read)
    $ctx.DockerConfig = Get-SafePath "$reportDir\docker-config-$($ctx.RunId)"
    Assert-Safe (-not (Test-Path -LiteralPath $ctx.DockerConfig)) 'Docker config path already exists'
    $null = [IO.Directory]::CreateDirectory($ctx.DockerConfig)
    $journal = @{
        RunId=$ctx.RunId; StartedAt=[DateTimeOffset]::UtcNow.ToString('o'); State='RUNNING'; Stage='static'
        BaselineSha=$BaselineSha; InfrastructureSha=$ExpectedHeadSha; Worktree=$ctx.Root
        DockerHost=$ctx.DockerHost; Project='yuni-validation'; Marker='yuni-audit-validation'
        Target='127.0.0.1:56032/yuni_validation_test'; Commands=$ctx.Commands; Resources=@{}
        Checks=@{ Static='PASS'; Runtime='NOT RUN'; Cleanup='NOT RUN'; RV='Not run'; DEC005='Pending' }
    }
    function Save-Evidence {
        $bytes = [Text.Encoding]::UTF8.GetBytes(($journal | ConvertTo-Json -Depth 15))
        $writer.Position=0; $writer.SetLength(0); $writer.Write($bytes,0,$bytes.Length); $writer.Flush($true)
    }
    function Invoke-Docker([string[]]$Arguments) {
        Assert-InputsUnchanged $ctx
        $full = @('--host',$ctx.DockerHost,'--config',$ctx.DockerConfig) + $Arguments
        $entry = @{Tool='docker'; Arguments=$full; Directory=$ctx.Root; StartedAt=[DateTimeOffset]::UtcNow.ToString('o'); Result='STARTED'}
        $journal.Commands.Add($entry); Save-Evidence
        $watch = [Diagnostics.Stopwatch]::StartNew()
        try {
            $r = Invoke-SafeProcess $ctx.Docker $full $ctx.Root @{VALIDATION_RUN_ID=$ctx.RunId}
            $entry.Result='PASS'; $entry.ExitCode=0
            return $r.Output
        } catch {
            $entry.Result='FAIL / UNKNOWN'; throw 'SAFETY STOP: Docker command failed; output suppressed'
        } finally { $entry.Milliseconds=$watch.ElapsedMilliseconds; Save-Evidence }
    }
    function Invoke-Compose([string[]]$Arguments) {
        return Invoke-Docker (@('compose','--project-name','yuni-validation','--project-directory',$ctx.Root,
            '--env-file',$ctx.EnvFile,'-f',$ctx.Compose) + $Arguments)
    }
    function Get-Inventory {
        $items = [Collections.Generic.List[object]]::new()
        foreach ($kind in @('container','network','volume')) {
            $a = @($kind,'ls','--format','{{json .}}')
            if ($kind -ceq 'container') { $a += @('--all','--no-trunc') }
            if ($kind -ceq 'network') { $a += '--no-trunc' }
            $raw = Invoke-Docker $a
            foreach ($line in ($raw -split '\r?\n' | Where-Object { $_ })) {
                $item = $line | ConvertFrom-Json -AsHashtable
                $name = if ($kind -ceq 'container') { $item.Names } else { $item.Name }
                Assert-Safe (-not [string]::IsNullOrEmpty($name)) 'inventory incomplete'
                $items.Add(@{Kind=$kind; Name=$name; Labels=[string]$item.Labels
                    Id=$(if ($kind -ceq 'volume') {$name} else {$item.ID})
                    State=$(if ($kind -ceq 'container') {$item.State} else {''})})
            }
        }
        return $items.ToArray()
    }
    function Inspect-One([string]$Kind, [string]$Name) {
        $items = @( (Invoke-Docker @($Kind,'inspect',$Name)) | ConvertFrom-Json -AsHashtable )
        Assert-Safe ($items.Count -eq 1) 'ambiguous inspection'
        return $items[0]
    }
    function Check-Owned([switch]$Running) {
        $c = Inspect-One 'container' 'yuni-validation-postgres'
        $n = Inspect-One 'network' 'yuni-validation-network'
        $v = Inspect-One 'volume' 'yuni-validation-postgres-data'
        foreach ($pair in @(@('container',$c),@('network',$n),@('volume',$v))) {
            $kind = $pair[0]; $resource = $pair[1]
            $expected = if ($ctx.Ids.ContainsKey($kind)) {$ctx.Ids[$kind]} else {''}
            $id = Assert-OwnedResource $resource $kind $ctx.RunId $expected
            $ctx.Ids[$kind] = $id
            $labels = if ($kind -ceq 'container') {$resource.Config.Labels} else {$resource.Labels}
            $journal.Resources[$kind] = @{Identity=$id; Name=$resource.Name; Labels=@{
                'com.docker.compose.project'=$labels['com.docker.compose.project']
                'io.yuni.validation.run'=$labels['io.yuni.validation.run']
                'io.yuni.validation.environment'=$labels['io.yuni.validation.environment']}}
        }
        Assert-Safe ($n.Driver -ceq 'bridge' -and $n.Internal -eq $false -and $n.Scope -ceq 'local' -and
            ($null -eq $n.Options -or $n.Options.Count -eq 0)) 'effective network mismatch'
        Assert-Safe ($c.Image -ceq $ctx.ImageId) 'image identity changed'
        Assert-Safe ($c.HostConfig.Privileged -eq $false -and @($c.HostConfig.Binds | Where-Object { $null -ne $_ }).Count -eq 0 -and
            @($c.Mounts).Count -eq 1 -and $c.Mounts[0].Type -ceq 'volume' -and
            $c.Mounts[0].Name -ceq 'yuni-validation-postgres-data' -and
            $c.Mounts[0].Destination -ceq '/var/lib/postgresql/data') 'effective mount/privilege mismatch'
        Assert-Keys $c.HostConfig.PortBindings @('5432/tcp')
        $binding = $c.HostConfig.PortBindings['5432/tcp']
        Assert-Safe (@($binding).Count -eq 1 -and $binding[0].HostIp -ceq '127.0.0.1' -and $binding[0].HostPort -ceq '56032') 'effective host binding mismatch'
        Assert-Keys $c.NetworkSettings.Networks @('yuni-validation-network')
        Assert-Safe ($c.HostConfig.NetworkMode -ceq 'yuni-validation-network') 'network mode mismatch'
        if ($Running) { Assert-Safe ($c.NetworkSettings.Networks['yuni-validation-network'].NetworkID -ceq $ctx.Ids.network) 'network attachment mismatch' }
        foreach ($connection in $n.Containers.Keys) { Assert-Safe ($connection -ceq $ctx.Ids.container) 'foreign network consumer' }
        $consumers = (Invoke-Docker @('container','ls','--all','--quiet','--no-trunc','--filter','volume=yuni-validation-postgres-data')).Trim()
        Assert-Safe ($consumers -ceq $ctx.Ids.container) 'foreign or unknown volume consumer'
        foreach ($entry in @("POSTGRES_DB=yuni_validation_test","POSTGRES_USER=$($ctx.Values.VALIDATION_POSTGRES_USER)",
            "POSTGRES_PASSWORD=$($ctx.Values.VALIDATION_POSTGRES_PASSWORD)")) {
            Assert-Safe ($entry -cin $c.Config.Env) 'effective database environment mismatch'
        }
        if ($Running) {
            Assert-Safe ($c.State.Running -eq $true -and $c.State.Health.Status -ceq 'healthy') 'container not healthy'
            Assert-Keys $c.NetworkSettings.Ports @('5432/tcp')
            $published = $c.NetworkSettings.Ports['5432/tcp']
            Assert-Safe (@($published).Count -eq 1 -and $published[0].HostIp -ceq '127.0.0.1' -and
                $published[0].HostPort -ceq '56032') 'actual published port missing or unsafe'
        }
        Save-Evidence
        return $c
    }
    function Invoke-OwnedCleanup {
            $journal.Stage='guarded cleanup'
            $null = Check-Owned -Running
            $null = Invoke-Docker @('container','stop','--time','10',$ctx.Ids.container)
            $c = Check-Owned
            Assert-Safe ($c.State.Running -eq $false) 'stop not verified'
            $null = Invoke-Docker @('container','rm',$ctx.Ids.container)
            $n = Inspect-One 'network' $ctx.Ids.network
            $null = Assert-OwnedResource $n 'network' $ctx.RunId $ctx.Ids.network
            Assert-Safe ($n.Containers.Count -eq 0) 'network has consumers'
            $null = Invoke-Docker @('network','rm',$ctx.Ids.network)
            $v = Inspect-One 'volume' 'yuni-validation-postgres-data'
            $null = Assert-OwnedResource $v 'volume' $ctx.RunId $ctx.Ids.volume
            Assert-Safe ([string]::IsNullOrEmpty((Invoke-Docker @('container','ls','--all','--quiet','--filter','volume=yuni-validation-postgres-data')).Trim())) 'volume has consumers'
            $null = Invoke-Docker @('volume','rm','yuni-validation-postgres-data')
            $after = @(Get-Inventory)
            Assert-NoExistingResources $after
            # Compare identities/states only; do not preserve unrelated labels or inspect ordinary DB.
            $beforeKey = @($ctx.Before | ForEach-Object { "$($_.Kind)|$($_.Name)|$($_.Id)|$($_.State)" } | Sort-Object)
            $afterKey = @($after | ForEach-Object { "$($_.Kind)|$($_.Name)|$($_.Id)|$($_.State)" } | Sort-Object)
            Assert-Safe (($beforeKey -join "\n") -ceq ($afterKey -join "\n")) 'unrelated resource inventory changed'
            $journal.Checks.Cleanup='PASS: owned Docker resources absent; original inventory unchanged'
    }
    $journal.Stage='psql capability (before Docker)'
    $journal.sqlIdentity = @{attempted=$false; result='NOT RUN'}
    $capability = @{Tool='psql';Arguments=@('--version');Result='STARTED'}
    $journal.Commands.Add($capability); Save-Evidence
    try {
        $ctx.Psql = Get-ValidationPsqlClient $ctx.Values.VALIDATION_PSQL_PATH $ctx.Root
        $capability.Result='PASS'; $capability.ExitCode=0
        $journal.PsqlClient = @{Path=$ctx.Psql.Path;Version=$ctx.Psql.Version;ExecutableSHA256=$ctx.Psql.SHA256
            PreparedReference=@{VersionBuild='16.15-4 Windows x64';ArchiveSHA256='F5F55B03BD54CE0DD1C51D524B54C7E015ABD4D620AF27D6971288A2DBE4A8F8'
                Source='https://get.enterprisedb.com/postgresql/postgresql-16.15-4-windows-x64-binaries.zip'
                Limitation='Official EDB HTTPS source; no publisher checksum/signature confirmed. Reference archive not reverified by runner.'}
            MatchesPreparedExecutable=($ctx.Psql.SHA256 -ceq '4D77C3479F5CEBD0CD761154C4E02A34A005D2728A249FBC9ECB4BDAC1519F07')}
    } catch { $capability.Result='FAIL / UNKNOWN'; throw }
    finally { Save-Evidence }
    $ctx.Docker = @(Get-Command docker.exe -CommandType Application -ErrorAction Stop)[0].Source
    Invoke-SafetySteps @(
        {
            $journal.Stage='runtime preflight'
            $version = (Invoke-Docker @('version','--format','{{json .}}')) | ConvertFrom-Json -AsHashtable
            Assert-Safe ($version.Server.Os -ceq 'linux') 'Linux Docker engine required'
            $journal.DockerVersion = $version.Server.Version
            $journal.ComposeVersion = (Invoke-Docker @('compose','version','--short')).Trim()
            $ctx.Before = @(Get-Inventory)
            Assert-NoExistingResources $ctx.Before
            $journal.PreexistingResources = @($ctx.Before | ForEach-Object { @{Kind=$_.Kind;Name=$_.Name;Id=$_.Id;State=$_.State} })
            $portEntry = @{Tool='Get-NetTCPConnection';Arguments=@('filter LocalPort = 56032');Result='STARTED'}
            $journal.Commands.Add($portEntry); Save-Evidence
            $portWatch = [Diagnostics.Stopwatch]::StartNew()
            try {
                Assert-Safe (@(Get-NetTCPConnection -ErrorAction Stop | Where-Object LocalPort -eq 56032).Count -eq 0) 'host port already in use'
                $portEntry.Result='PASS'
            } catch { $portEntry.Result='FAIL / UNKNOWN'; throw }
            finally { $portEntry.Milliseconds=$portWatch.ElapsedMilliseconds; Save-Evidence }
            # netsh is read-only; unknown/localized output fails closed instead of assuming a free range.
            $netsh = (Get-Command netsh.exe -CommandType Application).Source
            $rangeEntry = @{Tool='netsh';Arguments=@('interface','ipv4','show','excludedportrange','protocol=tcp');Result='STARTED'}
            $journal.Commands.Add($rangeEntry); Save-Evidence
            $rangeWatch = [Diagnostics.Stopwatch]::StartNew()
            try {
                $ranges = Invoke-SafeProcess $netsh $rangeEntry.Arguments $ctx.Root
                $rangeEntry.Result='PASS'; $rangeEntry.ExitCode=0
            } catch { $rangeEntry.Result='FAIL / UNKNOWN'; throw }
            finally { $rangeEntry.Milliseconds=$rangeWatch.ElapsedMilliseconds; Save-Evidence }
            $matched = 0
            foreach ($line in ($ranges.Output -split '\r?\n')) {
                if ($line -match '^\s*(\d+)\s+(\d+)\s*\*?\s*$') {
                    $matched++
                    Assert-Safe (-not (56032 -ge [int]$Matches[1] -and 56032 -le [int]$Matches[2])) 'Windows port excluded'
                }
            }
            Assert-Safe ($matched -gt 0) 'excluded-port output unknown'
            $null = Invoke-Compose @('config','--quiet')
            $rendered = (Invoke-Compose @('config','--format','json')) | ConvertFrom-Json -AsHashtable
            Assert-ComposeTopology $rendered $ctx.Values $ctx.RunId -Rendered
            $rendered = $null
            $image = Inspect-One 'image' 'postgres:16-alpine'
            Assert-Safe ($image.Id -cmatch '^sha256:[0-9a-f]{64}$' -and @($image.RepoDigests).Count -gt 0) 'local image identity missing; no automatic pull'
            $ctx.ImageId = $image.Id; $journal.ImageId = $image.Id
            $journal.Checks.Runtime='GATES PASS; not yet connectivity'
        },
        {
            $journal.Stage='create stopped resources'
            Assert-NoExistingResources @(Get-Inventory)
            $null = Invoke-Compose @('create','--no-recreate','--pull','never','validation-postgres')
            $c = Check-Owned
            Assert-Safe ($c.State.Status -ceq 'created' -and $c.State.Running -eq $false) 'unexpected container state before start'
            $journal.Stage='start owned container'
            $null = Invoke-Docker @('container','start',$ctx.Ids.container)
        },
        {
            $journal.Stage='health and host TCP'
            $healthy = $false
            for ($attempt=0; $attempt -lt 25; $attempt++) {
                $c = Inspect-One 'container' $ctx.Ids.container
                $null = Assert-OwnedResource $c 'container' $ctx.RunId $ctx.Ids.container
                if ($c.State.Health.Status -ceq 'healthy') { $healthy=$true; break }
                Assert-Safe ($c.State.Running -eq $true -and $c.State.Health.Status -ceq 'starting') 'unhealthy or stopped container'
                Start-Sleep -Seconds 5
            }
            Assert-Safe $healthy 'health timeout'
            $null = Check-Owned -Running
            $client = [Net.Sockets.TcpClient]::new()
            $tcpEntry = @{Tool='TcpClient';Arguments=@('127.0.0.1','56032');Result='STARTED'}
            $journal.Commands.Add($tcpEntry); Save-Evidence
            $tcpWatch = [Diagnostics.Stopwatch]::StartNew()
            try {
                $connect = $client.ConnectAsync('127.0.0.1',56032)
                Assert-Safe ($connect.Wait(5000) -and $client.Connected) 'host TCP connection failed'
                $tcpEntry.Result='PASS'
            } catch { $tcpEntry.Result='FAIL / UNKNOWN'; throw }
            finally { $client.Dispose(); $tcpEntry.Milliseconds=$tcpWatch.ElapsedMilliseconds; Save-Evidence }
            $journal.Checks.Runtime='PENDING SQL: healthy; actual loopback publication; host TCP'
            Save-Evidence
        },
        {
            $journal.Stage='host SQL identity'
            $journal.sqlIdentity = @{
                attempted=$false; clientPath=$ctx.Psql.Path; clientVersion=$ctx.Psql.Version
                host='127.0.0.1'; port=56032; expectedDatabase='yuni_validation_test'
                actualDatabase=$null; currentUser=$null; postgresVersion=$null; exitCode=$null
                result='NOT RUN'; pgpassCleanup='NOT RUN'
            }
            $sqlEntry = @{Tool='psql';Arguments=(Get-SqlIdentityArguments);Result='STARTED'}
            $journal.Commands.Add($sqlEntry); Save-Evidence
            Invoke-IdentityAndCleanup -SqlEvidence $journal.sqlIdentity -Checks $journal.Checks -Probe {
                Assert-InputsUnchanged $ctx
                $watch = [Diagnostics.Stopwatch]::StartNew()
                try {
                    Invoke-HostSqlIdentity $ctx $journal.sqlIdentity
                    $sqlEntry.Result='PASS'; $sqlEntry.ExitCode=$journal.sqlIdentity.exitCode
                } catch { $sqlEntry.Result='FAIL / UNKNOWN'; throw }
                finally { $sqlEntry.Milliseconds=$watch.ElapsedMilliseconds; Save-Evidence }
            } -Compare {
                $journal.Stage='ordinary resource comparison before cleanup'
                $current = @(Get-Inventory | Where-Object { $_.Name -notin @('yuni-validation-postgres','yuni-validation-network','yuni-validation-postgres-data') })
                $beforeKey = @($ctx.Before | ForEach-Object { "$($_.Kind)|$($_.Name)|$($_.Id)|$($_.State)" } | Sort-Object)
                $currentKey = @($current | ForEach-Object { "$($_.Kind)|$($_.Name)|$($_.Id)|$($_.State)" } | Sort-Object)
                Assert-Safe (($beforeKey -join "\n") -ceq ($currentKey -join "\n")) 'ordinary resource inventory changed before cleanup'
                $journal.Checks.OrdinaryResources='PASS before cleanup'; Save-Evidence
            } -Cleanup { Invoke-OwnedCleanup; Save-Evidence }
        }
    )
    $journal.State='PASS'; $journal.CompletedAt=[DateTimeOffset]::UtcNow.ToString('o'); Save-Evidence
    Write-Output "DEC-005 preflight completed; DEC-005 Pending, RV Not run. Evidence: $report"
} catch {
    if ($null -ne $journal -and $null -ne $writer) {
        $journal.State='STOP'; $journal.StopReason='FAIL / UNKNOWN / AMBIGUOUS; inspect stage and command results; raw errors withheld'
        try { Save-Evidence } catch { }
    }
    [Console]::Error.WriteLine('PREFLIGHT STOP. See evidence for guarded cleanup outcome. Raw details suppressed.')
    exit 1
} finally {
    if ($null -ne $writer) { $writer.Dispose() }
    if ($lockHeld) { $mutex.ReleaseMutex() }
    if ($null -ne $mutex) { $mutex.Dispose() }
}
