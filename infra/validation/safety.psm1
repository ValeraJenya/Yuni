#requires -Version 7.4
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
function Assert-Safe($Condition, [string]$Code) {
    if (-not $Condition) { throw "SAFETY STOP: $Code" }
}
function Assert-Keys([System.Collections.IDictionary]$Object, [string[]]$Allowed, [string[]]$Required = $Allowed) {
    Assert-Safe ($null -ne $Object) 'missing object'
    foreach ($key in $Object.Keys) { Assert-Safe ($key -cin $Allowed) 'unexpected configuration key' }
    foreach ($key in $Required) { Assert-Safe ($Object.Contains($key)) 'missing configuration key' }
}
function Get-SafePath([string]$Path, [switch]$MustExist) {
    Assert-Safe ($Path -cmatch '^[A-Za-z]:\\' -and $Path -notmatch '(^|[\\/])\.\.?([\\/]|$)' -and $Path -notmatch '/') 'absolute local path required'
    $full = [IO.Path]::GetFullPath($Path).TrimEnd('\')
    Assert-Safe ($full -ieq $Path.TrimEnd('\')) 'noncanonical path'
    if ($MustExist) { Assert-Safe (Test-Path -LiteralPath $full) 'path missing' }
    $ancestor = $full
    while ($ancestor) {
        if (Test-Path -LiteralPath $ancestor) {
            $item = Get-Item -Force -LiteralPath $ancestor
            Assert-Safe (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -eq 0) 'reparse point forbidden'
        }
        $ancestor = Split-Path -Parent $ancestor
    }
    return $full
}
function Assert-InheritedEnvironment([System.Collections.IDictionary]$Environment) {
    foreach ($key in $Environment.Keys) {
        if ($key -match '(^|_)(DATABASE|DB|PG|POSTGRES|JWT|TOKEN|SECRET|PASSWORD|CREDENTIAL|AWS|AZURE|GOOGLE|STRIPE|REDIS|PROXY)(_|$)|^(PG|DOCKER|COMPOSE|VALIDATION_)') {
            Assert-Safe ([string]::IsNullOrEmpty([string]$Environment[$key])) 'sensitive inherited environment; open a clean shell'
        }
    }
}
function Read-ValidationEnvironment([string]$Path) {
    $result = @{}
    foreach ($line in [IO.File]::ReadAllLines($Path)) {
        if (-not $line.Trim() -or $line.TrimStart().StartsWith('#')) { continue }
        Assert-Safe ($line -cmatch '^([A-Z][A-Z0-9_]*)=(.*)$') 'invalid env assignment'
        $key = $Matches[1]; $value = $Matches[2]
        Assert-Safe ($value -notmatch '[''"\x00-\x1f$]' -and $value -ceq $value.Trim()) 'env must use plain literals'
        Assert-Safe (-not $result.ContainsKey($key)) 'duplicate env key'
        $result[$key] = $value
    }
    return $result
}
function Assert-ValidationEnvironment([hashtable]$Values, [string]$ExpectedWorktreeRoot) {
    Assert-Keys $Values @('COMPOSE_PROJECT_NAME','VALIDATION_ENVIRONMENT','VALIDATION_EXTERNAL_PROVIDERS',
        'VALIDATION_DATABASE_NAME','VALIDATION_POSTGRES_PORT','VALIDATION_POSTGRES_USER','VALIDATION_POSTGRES_PASSWORD',
        'DATABASE_URL','TEST_DATABASE_URL','VALIDATION_WORKTREE_ROOT','VALIDATION_MEDIA_ROOT','VALIDATION_PSQL_PATH')
    $null = Get-ValidationPsqlPath $Values.VALIDATION_PSQL_PATH
    $constants = @{
        COMPOSE_PROJECT_NAME='yuni-validation'; VALIDATION_ENVIRONMENT='yuni-audit-validation'
        VALIDATION_EXTERNAL_PROVIDERS='disabled'; VALIDATION_DATABASE_NAME='yuni_validation_test'
        VALIDATION_POSTGRES_PORT='56032'; VALIDATION_POSTGRES_USER='yuni_validation_user'
    }
    foreach ($key in $constants.Keys) { Assert-Safe ($Values[$key] -ceq $constants[$key]) 'validation identity mismatch' }
    Assert-Safe ($Values.VALIDATION_POSTGRES_PASSWORD -cmatch '^[A-Za-z0-9_-]{32,128}$' -and
        $Values.VALIDATION_POSTGRES_PASSWORD -notmatch 'replace|placeholder|example') 'fresh synthetic password required'
    $expectedUrl = 'postgresql://yuni_validation_user:' + $Values.VALIDATION_POSTGRES_PASSWORD +
        '@127.0.0.1:56032/yuni_validation_test?schema=public'
    foreach ($key in @('DATABASE_URL','TEST_DATABASE_URL')) {
        # Exact authority/query reject aliases, URI normalization and query host overrides.
        Assert-Safe ($Values[$key] -ceq $expectedUrl) 'explicit validation URL mismatch'
    }
    $root = Get-SafePath $ExpectedWorktreeRoot -MustExist
    Assert-Safe ((Get-SafePath $Values.VALIDATION_WORKTREE_ROOT -MustExist) -ieq $root) 'worktree identity mismatch'
    $media = Get-SafePath $Values.VALIDATION_MEDIA_ROOT
    Assert-Safe ($media -ieq "$root\apps\backend\uploads\dec-005") 'media scope mismatch'
    if (Test-Path -LiteralPath $media) {
        Assert-Safe (Test-Path -LiteralPath $media -PathType Container) 'media is not a directory'
        Assert-Safe (@(Get-ChildItem -Force -LiteralPath $media).Count -eq 0) 'media must be empty'
    }
}
function Assert-ComposeTopology([hashtable]$Model, [hashtable]$Values, [string]$RunId, [switch]$Rendered) {
    Assert-Keys $Model @('name','services','volumes','networks')
    Assert-Safe ($Model.name -ceq 'yuni-validation') 'wrong project'
    Assert-Keys $Model.services @('validation-postgres')
    $s = $Model.services['validation-postgres']
    Assert-Keys $s @('image','container_name','environment','ports','volumes','networks','healthcheck','labels')
    Assert-Safe ($s.image -ceq 'postgres:16-alpine' -and $s.container_name -ceq 'yuni-validation-postgres') 'wrong image/container'
    Assert-Keys $s.environment @('POSTGRES_DB','POSTGRES_USER','POSTGRES_PASSWORD')
    $user = '${VALIDATION_POSTGRES_USER:?Required}'; $password = '${VALIDATION_POSTGRES_PASSWORD:?Required}'
    $port = '${VALIDATION_POSTGRES_PORT:?Required}'; $label = '${VALIDATION_RUN_ID:?Runner required}'
    $health = 'pg_isready -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'
    if ($Rendered) {
        $user = $Values.VALIDATION_POSTGRES_USER; $password = $Values.VALIDATION_POSTGRES_PASSWORD
        $port = '56032'; $label = $RunId
        Assert-Safe ($s.healthcheck.test[1] -cin @($health, 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"')) 'health command changed'
        $health = $s.healthcheck.test[1]
    }
    Assert-Safe ($s.environment.POSTGRES_DB -ceq 'yuni_validation_test' -and
        $s.environment.POSTGRES_USER -ceq $user -and $s.environment.POSTGRES_PASSWORD -ceq $password) 'container DB environment mismatch'
    Assert-Safe (@($s.ports).Count -eq 1) 'unexpected ports'
    $p = $s.ports[0]
    Assert-Keys $p @('target','published','host_ip','protocol','mode') @('target','published','host_ip','protocol')
    Assert-Safe ($p.target -eq 5432 -and [string]$p.published -ceq $port -and $p.host_ip -ceq '127.0.0.1' -and
        $p.protocol -ceq 'tcp' -and (-not $p.ContainsKey('mode') -or $p.mode -ceq 'ingress')) 'port/bind mismatch'
    Assert-Safe (@($s.volumes).Count -eq 1) 'unexpected mounts'
    $v = $s.volumes[0]
    Assert-Keys $v @('type','source','target','volume','read_only') @('type','source','target')
    Assert-Safe ($v.type -ceq 'volume' -and $v.source -ceq 'validation_postgres_data' -and
        $v.target -ceq '/var/lib/postgresql/data') 'mount mismatch'
    if ($v.ContainsKey('volume')) { Assert-Keys $v.volume @() @() }
    if ($v.ContainsKey('read_only')) { Assert-Safe ($v.read_only -eq $false) 'mount mode mismatch' }
    Assert-Keys $s.networks @('validation_network')
    if ($null -ne $s.networks.validation_network) { Assert-Keys $s.networks.validation_network @() @() }
    Assert-Keys $s.healthcheck @('test','interval','timeout','retries','start_period')
    Assert-Safe (@($s.healthcheck.test).Count -eq 2 -and $s.healthcheck.test[0] -ceq 'CMD-SHELL' -and
        $s.healthcheck.test[1] -ceq $health -and $s.healthcheck.interval -ceq '5s' -and
        $s.healthcheck.timeout -ceq '5s' -and $s.healthcheck.retries -eq 20 -and $s.healthcheck.start_period -ceq '5s') 'healthcheck mismatch'
    Assert-Keys $Model.volumes @('validation_postgres_data')
    Assert-Keys $Model.networks @('validation_network')
    $volume = $Model.volumes.validation_postgres_data; $network = $Model.networks.validation_network
    Assert-Keys $volume @('name','driver','labels')
    Assert-Keys $network @('name','driver','labels')
    Assert-Safe ($volume.name -ceq 'yuni-validation-postgres-data' -and $volume.driver -ceq 'local') 'volume mismatch'
    Assert-Safe ($network.name -ceq 'yuni-validation-network' -and $network.driver -ceq 'bridge') 'network mismatch'
    foreach ($resource in @($s,$volume,$network)) {
        Assert-Keys $resource.labels @('io.yuni.validation.run','io.yuni.validation.environment')
        Assert-Safe ($resource.labels['io.yuni.validation.run'] -ceq $label -and
            $resource.labels['io.yuni.validation.environment'] -ceq 'yuni-audit-validation') 'ownership label mismatch'
    }
}

# A Windows job owns the CLI and descendants, including pipe-holding children.
# It never owns an already running Docker daemon.
if (-not ('YuniValidation.NativeJob' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
namespace YuniValidation {
    public sealed class NativeJob : IDisposable {
        [StructLayout(LayoutKind.Sequential)]
        struct BasicLimits {
            public long ProcessTime, JobTime;
            public uint Flags;
            public UIntPtr MinWorkingSet, MaxWorkingSet;
            public uint ActiveLimit;
            public UIntPtr Affinity;
            public uint Priority, Scheduling;
        }
        [StructLayout(LayoutKind.Sequential)]
        struct IoCounters { public ulong A, B, C, D, E, F; }
        [StructLayout(LayoutKind.Sequential)]
        struct ExtendedLimits {
            public BasicLimits Basic;
            public IoCounters Io;
            public UIntPtr ProcessMemory, JobMemory, PeakProcessMemory, PeakJobMemory;
        }
        [StructLayout(LayoutKind.Sequential)]
        struct Accounting {
            public long User, Kernel, PeriodUser, PeriodKernel;
            public uint Faults, Total, Active, Terminated;
        }
        [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
        static extern IntPtr CreateJobObject(IntPtr attributes, string name);
        [DllImport("kernel32.dll", SetLastError=true)]
        static extern bool SetInformationJobObject(IntPtr job, int kind, ref ExtendedLimits info, uint size);
        [DllImport("kernel32.dll", SetLastError=true)]
        static extern bool QueryInformationJobObject(IntPtr job, int kind, out Accounting info, uint size, IntPtr returned);
        [DllImport("kernel32.dll", SetLastError=true)]
        static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);
        [DllImport("kernel32.dll", SetLastError=true)]
        static extern bool TerminateJobObject(IntPtr job, uint code);
        [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);

        [StructLayout(LayoutKind.Sequential)]
        struct SecurityAttributes {
            public int Length;
            public IntPtr Descriptor;
            [MarshalAs(UnmanagedType.Bool)] public bool Inherit;
        }
        [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
        struct StartupInfo {
            public int Size;
            public string Reserved, Desktop, Title;
            public uint X, Y, XSize, YSize, XChars, YChars, Fill, Flags;
            public short Show, ReservedSize;
            public IntPtr ReservedData, Input, Output, Error;
        }
        [StructLayout(LayoutKind.Sequential)]
        struct ProcessInfo { public IntPtr Process, Thread; public uint Pid, Tid; }
        [DllImport("kernel32.dll", SetLastError=true)]
        static extern bool CreatePipe(out IntPtr read, out IntPtr write, ref SecurityAttributes security, uint size);
        [DllImport("kernel32.dll", SetLastError=true)]
        static extern bool SetHandleInformation(IntPtr handle, uint mask, uint flags);
        [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
        static extern IntPtr CreateFile(string name, uint access, uint share, ref SecurityAttributes security,
            uint creation, uint flags, IntPtr template);
        [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
        static extern bool CreateProcess(string application, System.Text.StringBuilder command,
            IntPtr processSecurity, IntPtr threadSecurity, bool inherit, uint flags, IntPtr environment,
            string directory, ref StartupInfo startup, out ProcessInfo info);
        [DllImport("kernel32.dll", SetLastError=true)]
        static extern uint ResumeThread(IntPtr thread);
        [DllImport("kernel32.dll", SetLastError=true)]
        static extern bool TerminateProcess(IntPtr process, uint code);
        [DllImport("kernel32.dll")] static extern uint WaitForSingleObject(IntPtr handle, uint milliseconds);
        public System.Diagnostics.Process Process { get; private set; }
        public System.IO.StreamReader Output { get; private set; }
        public System.IO.StreamReader Error { get; private set; }
        static string Quote(string value) {
            var result=new System.Text.StringBuilder("\"");
            int slashes=0;
            foreach(char c in value) {
                if(c=='\\') { slashes++; continue; }
                result.Append('\\',c=='"' ? slashes*2+1 : slashes);
                result.Append(c); slashes=0;
            }
            result.Append('\\',slashes*2); result.Append('"');
            return result.ToString();
        }
        public void Start(string executable, string[] arguments, string directory,
            System.Collections.Generic.IDictionary<string,string> environment) {
            IntPtr outRead=IntPtr.Zero, outWrite=IntPtr.Zero, errRead=IntPtr.Zero, errWrite=IntPtr.Zero;
            IntPtr input=IntPtr.Zero, block=IntPtr.Zero;
            var info=new ProcessInfo();
            bool resumed=false;
            try {
                var security=new SecurityAttributes {Length=Marshal.SizeOf<SecurityAttributes>(),Inherit=true};
                if(!CreatePipe(out outRead,out outWrite,ref security,0) ||
                   !CreatePipe(out errRead,out errWrite,ref security,0) ||
                   !SetHandleInformation(outRead,1,0) || !SetHandleInformation(errRead,1,0))
                    throw new InvalidOperationException("Pipe setup failed");
                input=CreateFile("NUL",0x80000000,3,ref security,3,0,IntPtr.Zero);
                if(input==new IntPtr(-1)) throw new InvalidOperationException("Input setup failed");
                var command=new System.Text.StringBuilder(Quote(executable));
                foreach(string argument in arguments) command.Append(' ').Append(Quote(argument));
                var env=new System.Text.StringBuilder();
                foreach(var pair in new System.Collections.Generic.SortedDictionary<string,string>(environment,StringComparer.OrdinalIgnoreCase))
                    env.Append(pair.Key).Append('=').Append(pair.Value).Append('\0');
                env.Append('\0');
                block=Marshal.StringToHGlobalUni(env.ToString());
                var startup=new StartupInfo {
                    Size=Marshal.SizeOf<StartupInfo>(),Flags=0x100,
                    Input=input,Output=outWrite,Error=errWrite
                };
                // CREATE_SUSPENDED | CREATE_UNICODE_ENVIRONMENT | CREATE_NO_WINDOW.
                // No user-mode instruction can run or spawn a child before job assignment.
                if(!CreateProcess(executable,command,IntPtr.Zero,IntPtr.Zero,true,0x08000404,block,directory,ref startup,out info))
                    throw new InvalidOperationException("Suspended process creation failed");
                Assign(info.Process);
                Process=System.Diagnostics.Process.GetProcessById((int)info.Pid);
                var keepHandle=Process.Handle;
                Output=new System.IO.StreamReader(new System.IO.FileStream(
                    new Microsoft.Win32.SafeHandles.SafeFileHandle(outRead,true),System.IO.FileAccess.Read));
                outRead=IntPtr.Zero;
                Error=new System.IO.StreamReader(new System.IO.FileStream(
                    new Microsoft.Win32.SafeHandles.SafeFileHandle(errRead,true),System.IO.FileAccess.Read));
                errRead=IntPtr.Zero;
                if(ResumeThread(info.Thread)==uint.MaxValue) throw new InvalidOperationException("Process resume failed");
                resumed=true;
            } finally {
                if(!resumed && info.Process!=IntPtr.Zero) {
                    TerminateProcess(info.Process,1); WaitForSingleObject(info.Process,5000);
                }
                foreach(var item in new [] {outRead,outWrite,errRead,errWrite,info.Thread,info.Process})
                    if(item!=IntPtr.Zero) CloseHandle(item);
                if(input!=IntPtr.Zero && input!=new IntPtr(-1)) CloseHandle(input);
                if(block!=IntPtr.Zero) Marshal.FreeHGlobal(block);
            }
        }

        IntPtr handle;
        public NativeJob() {
            handle=CreateJobObject(IntPtr.Zero,null);
            if(handle==IntPtr.Zero) throw new InvalidOperationException("Job creation failed");
            var limits=new ExtendedLimits();
            limits.Basic.Flags=0x2000; // JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
            if(!SetInformationJobObject(handle,9,ref limits,(uint)Marshal.SizeOf<ExtendedLimits>())) {
                Dispose(); throw new InvalidOperationException("Job limits failed");
            }
        }
        public void Assign(IntPtr process) {
            if(!AssignProcessToJobObject(handle,process)) throw new InvalidOperationException("Job assignment failed");
        }
        public uint Active {
            get {
                Accounting value;
                if(!QueryInformationJobObject(handle,1,out value,(uint)Marshal.SizeOf<Accounting>(),IntPtr.Zero))
                    throw new InvalidOperationException("Job accounting unknown");
                return value.Active;
            }
        }
        public void Stop() {
            if(!TerminateJobObject(handle,1)) throw new InvalidOperationException("Job termination unknown");
        }
        public void Dispose() {
            if(handle!=IntPtr.Zero) { CloseHandle(handle); handle=IntPtr.Zero; }
            Output?.Dispose(); Error?.Dispose(); Process?.Dispose();
        }
    }
}
'@
}

function Get-WindowsProgramFiles {
    # SHGetKnownFolderPath via .NET, not a caller/env-provided directory.
    Assert-Safe $IsWindows 'Windows Docker plugin discovery required'
    $path = Get-SafePath ([Environment]::GetFolderPath([Environment+SpecialFolder]::ProgramFiles)) -MustExist
    Assert-Safe (Test-Path -LiteralPath $path -PathType Container) 'system ProgramFiles directory missing'
    return $path
}
function New-NativeChildEnvironment([hashtable]$ExtraEnvironment = @{}, [switch]$DockerChild) {
    $environment = [Collections.Generic.Dictionary[string,string]]::new([StringComparer]::OrdinalIgnoreCase)
    foreach ($key in @('SystemRoot','WINDIR','PATH','TEMP','TMP')) {
        $value = [Environment]::GetEnvironmentVariable($key)
        if ($value) { $environment[$key] = $value }
    }
    foreach ($key in $ExtraEnvironment.Keys) {
        Assert-Safe ($key -ine 'ProgramFiles') 'ProgramFiles override forbidden'
        $environment[$key] = $ExtraEnvironment[$key]
    }
    if ($DockerChild) { $environment['ProgramFiles'] = Get-WindowsProgramFiles }
    return ,$environment
}
function Test-CapabilityArguments([string]$Executable, [string[]]$Arguments) {
    if (@($Arguments | Where-Object { $_ -match '[\x00\r\n]' }).Count) { return $false }
    $name = [IO.Path]::GetFileName($Executable)
    if ($name -ieq 'psql.exe') { return ($Arguments.Count -eq 1 -and $Arguments[0] -ceq '--version') }
    if ($name -ine 'docker.exe') { return $false }
    $argsToCheck = $Arguments
    if ($Arguments.Count -gt 4 -and $Arguments[0] -ceq '--host' -and
        $Arguments[1] -ceq 'npipe:////./pipe/dockerDesktopLinuxEngine' -and $Arguments[2] -ceq '--config') {
        $null = Get-SafePath $Arguments[3] -MustExist
        $argsToCheck = $Arguments[4..($Arguments.Count-1)]
    }
    # Exact token lists: never opt config/inspect/SQL or arbitrary flags into diagnostics.
    return (($argsToCheck -join "`n") -cin @('--version','version',"version`n--format`n{{json .}}",
        "compose`nversion", "compose`nversion`n--short"))
}
function Get-SanitizedCapabilityStderr([string]$Text) {
    if ([string]::IsNullOrWhiteSpace($Text)) { return '' }
    # Keep known diagnostics only; no free-form native text, paths, URLs or config fragments.
    $safe = [Collections.Generic.List[string]]::new()
    $scan = if ($Text.Length -gt 4096) { $Text.Substring(0,4096) } else { $Text }
    foreach ($line in ($scan -split '\r?\n')) {
        $line = $line.Trim()
        if (-not $line) { continue }
        if ($line -cin @('docker: unknown command: docker compose','unknown flag: --short',
            "docker: 'compose' is not a docker command.","Run 'docker --help' for more information",'Usage:  docker [OPTIONS] COMMAND [ARG...]')) {
            $safe.Add($line)
        } else { $safe.Add('[REDACTED: unrecognized capability diagnostic]') }
        if (($safe -join "`n").Length -ge 768) { break }
    }
    $result = $safe -join "`n"
    if ($Text.Length -gt 4096 -or $result.Length -gt 768) { $result = $result.Substring(0,[Math]::Min(768,$result.Length)) + "`n[TRUNCATED]" }
    return $result
}
function Read-ComposeVersion([string]$Output, [int]$ExitCode) {
    Assert-Safe ($ExitCode -eq 0 -and $Output.Length -le 64 -and
        $Output.Trim() -cmatch '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$') 'Compose capability/version unconfirmed'
    return $Output.Trim()
}
function Invoke-SafeProcess([string]$Executable, [string[]]$Arguments, [string]$Directory,
    [hashtable]$ExtraEnvironment = @{}, [int]$TimeoutSeconds = 60, [switch]$ReturnExitCode,
    [switch]$DockerChild, [hashtable]$CapabilityEvidence) {
    Assert-Safe ($TimeoutSeconds -ge 1 -and $TimeoutSeconds -le 300) 'invalid command timeout'
    if ($DockerChild) {
        $null = Get-SafePath $Executable -MustExist
        Assert-Safe ([IO.Path]::GetFileName($Executable) -ieq 'docker.exe') 'Docker-only environment requested for another executable'
    }
    if ($null -ne $CapabilityEvidence) {
        Assert-Safe (Test-CapabilityArguments $Executable $Arguments) 'diagnostics forbidden for this command'
        $CapabilityEvidence.ExitCode=$null; $CapabilityEvidence.SanitizedStderr='[UNAVAILABLE: command did not complete]'
    }
    $childEnvironment = New-NativeChildEnvironment $ExtraEnvironment -DockerChild:$DockerChild
    $job = [YuniValidation.NativeJob]::new()
    $watch = [Diagnostics.Stopwatch]::StartNew()
    try {
        $job.Start($Executable,$Arguments,$Directory,$childEnvironment)
        $process = $job.Process
        $stdout = $job.Output.ReadToEndAsync(); $stderr = $job.Error.ReadToEndAsync()
        # The deadline covers the CLI, descendants and both redirected pipes.
        while (-not ($process.HasExited -and $stdout.IsCompleted -and $stderr.IsCompleted -and $job.Active -eq 0)) {
            Assert-Safe ($watch.Elapsed.TotalSeconds -lt $TimeoutSeconds) 'command deadline exceeded; resource state unknown'
            [Threading.Thread]::Sleep(20)
        }
        $output = $stdout.GetAwaiter().GetResult(); $errorOutput = $stderr.GetAwaiter().GetResult()
        if ($null -ne $CapabilityEvidence) {
            $CapabilityEvidence.ExitCode=$process.ExitCode
            $CapabilityEvidence.SanitizedStderr=Get-SanitizedCapabilityStderr $errorOutput
        }
        $errorOutput=$null
        if (-not $ReturnExitCode) { Assert-Safe ($process.ExitCode -eq 0) 'command failed; native output suppressed' }
        return @{ Output=$output; ExitCode=$process.ExitCode; Milliseconds=$watch.ElapsedMilliseconds }
    } catch {
        $job.Stop()
        $deadline = [Diagnostics.Stopwatch]::StartNew()
        while ($job.Active -gt 0 -and $deadline.Elapsed.TotalSeconds -lt 5) { [Threading.Thread]::Sleep(20) }
        Assert-Safe ($job.Active -eq 0) 'CLI process termination unverified; resource state unknown'
        # Already submitted daemon requests may finish; never infer rollback or issue cleanup.
        throw 'SAFETY STOP: native command incomplete or failed; resource state unknown; output suppressed'
    } finally { $job.Dispose() }
}
function Get-ValidationGitExecutable {
    # Get-Command preserves effective PATH precedence. Never cast the full Source array to a string.
    $candidates = @(Get-Command git.exe -CommandType Application -ErrorAction Stop)
    Assert-Safe ($candidates.Count -gt 0) 'Git executable not found'
    $candidate = $candidates[0]
    Assert-Safe ($candidate -is [Management.Automation.ApplicationInfo]) 'Git candidate is not an application'
    Assert-Safe ($candidate.CommandType -eq [Management.Automation.CommandTypes]::Application) 'Git command type mismatch'
    Assert-Safe ($candidate.Source -is [string] -and -not [string]::IsNullOrWhiteSpace($candidate.Source)) 'Git path missing'
    $path = Get-SafePath $candidate.Source -MustExist
    Assert-Safe (Test-Path -LiteralPath $path -PathType Leaf) 'Git path is not a file'
    Assert-Safe ([IO.Path]::GetFileName($path) -ieq 'git.exe') 'Git executable basename mismatch'
    return $path
}
function Get-StaticContext([string]$ExpectedWorktreeRoot, [string]$BaselineSha, [string]$ExpectedHeadSha,
    [string]$EnvFile, [string]$InfrastructureRoot) {
    Assert-InheritedEnvironment ([Environment]::GetEnvironmentVariables())
    Assert-Safe ($BaselineSha -ceq 'deeee2c98951976c2064bf80e1a02c7a941be24f') 'baseline mismatch'
    Assert-Safe ($ExpectedHeadSha -cmatch '^[0-9a-f]{40}$') 'full infrastructure HEAD required'
    $root = Get-SafePath $ExpectedWorktreeRoot -MustExist
    Assert-Safe ((Get-SafePath $InfrastructureRoot -MustExist) -ieq "$root\infra\validation") 'execute runner from selected worktree'
    $null = Get-SafePath "$root\.git" -MustExist
    Assert-Safe (Test-Path -LiteralPath "$root\.git" -PathType Leaf) 'registered linked worktree required; shared checkout forbidden'
    $envPath = Get-SafePath $EnvFile -MustExist
    Assert-Safe ($envPath -ieq "$root\infra\validation\.env.validation") 'only explicit worktree validation env allowed'
    $values = Read-ValidationEnvironment $envPath
    Assert-ValidationEnvironment $values $root
    $git = Get-ValidationGitExecutable
    $commands = [Collections.Generic.List[object]]::new()
    function Read-Git([string[]]$A) {
        $r = Invoke-SafeProcess $git (@('-c','core.fsmonitor=false','-C',$root) + $A) $root
        $commands.Add(@{Tool='git'; Arguments=$A; ExitCode=0; Milliseconds=$r.Milliseconds})
        return $r.Output.Trim()
    }
    Assert-Safe ((Read-Git @('rev-parse','HEAD')) -ceq $ExpectedHeadSha) 'HEAD mismatch'
    Assert-Safe ((Read-Git @('rev-parse','--show-toplevel')).Replace('/','\') -ieq $root) 'Git root mismatch'
    $common = (Read-Git @('rev-parse','--path-format=absolute','--git-common-dir')).Replace('/','\')
    $null = Get-SafePath $common -MustExist
    Assert-Safe (-not $common.StartsWith("$root\",[StringComparison]::OrdinalIgnoreCase)) 'shared Git metadata required'
    Assert-Safe ((Read-Git @('worktree','list','--porcelain')).Contains('worktree ' + $root.Replace('\','/'))) 'worktree registration missing'
    $null = Read-Git @('merge-base','--is-ancestor',$BaselineSha,$ExpectedHeadSha)
    $changes = Read-Git @('diff','--name-only',"$BaselineSha..$ExpectedHeadSha")
    foreach ($file in ($changes -split '\r?\n' | Where-Object { $_ })) {
        Assert-Safe ($file -cin @('infra/validation/guard.ps1','infra/validation/safety.psm1','infra/validation/preflight.ps1',
            'infra/validation/tests/safety.tests.ps1','infra/validation/compose.validation.yml','infra/validation/.env.validation.example',
            'infra/validation/README.md','docs/audits/yuni-2026-09/08-VALIDATION-ENVIRONMENT.md')) 'baseline code drift'
    }
    Assert-Safe ([string]::IsNullOrEmpty((Read-Git @('status','--porcelain=v1','--untracked-files=all')))) 'worktree must be clean'
    $null = Read-Git @('check-ignore','--quiet','--','infra/validation/.env.validation')
    $compose = "$root\infra\validation\compose.validation.yml"
    $null = Get-SafePath $compose -MustExist
    $model = [IO.File]::ReadAllText($compose) | ConvertFrom-Json -AsHashtable
    Assert-ComposeTopology $model $values ''
    return @{ Root=$root; EnvFile=$envPath; Values=$values; Compose=$compose; BaselineSha=$BaselineSha; HeadSha=$ExpectedHeadSha
        EnvHash=(Get-FileHash -LiteralPath $envPath -Algorithm SHA256).Hash
        ComposeHash=(Get-FileHash -LiteralPath $compose -Algorithm SHA256).Hash; Commands=$commands }
}
function Assert-InputsUnchanged([hashtable]$Context) {
    $null = Get-SafePath $Context.EnvFile -MustExist
    $null = Get-SafePath $Context.Compose -MustExist
    Assert-Safe ((Get-FileHash -LiteralPath $Context.EnvFile).Hash -ceq $Context.EnvHash -and
        (Get-FileHash -LiteralPath $Context.Compose).Hash -ceq $Context.ComposeHash) 'inputs changed during run'
    Assert-InheritedEnvironment ([Environment]::GetEnvironmentVariables())
    Assert-ValidationEnvironment (Read-ValidationEnvironment $Context.EnvFile) $Context.Root
}
function Assert-NoExistingResources([object[]]$Inventory) {
    foreach ($r in $Inventory) {
        Assert-Safe (-not ($r.Name -match '^yuni-validation' -or $r.Labels -match 'com.docker.compose.project=yuni-validation(,|$)|io.yuni.validation.run=')) 'pre-existing validation resource; ownership unknown'
    }
}
function Assert-OwnedResource([hashtable]$Resource, [string]$Kind, [string]$RunId, [string]$Identity = '') {
    $name = switch ($Kind) { container {'yuni-validation-postgres'} network {'yuni-validation-network'} volume {'yuni-validation-postgres-data'} default {throw 'SAFETY STOP: unknown resource kind'} }
    $actualName = ([string]$Resource.Name).TrimStart('/')
    $labels = if ($Kind -ceq 'container') { $Resource.Config.Labels } else { $Resource.Labels }
    Assert-Safe ($actualName -ceq $name -and $labels['com.docker.compose.project'] -ceq 'yuni-validation' -and
        $labels['io.yuni.validation.run'] -ceq $RunId -and $labels['io.yuni.validation.environment'] -ceq 'yuni-audit-validation') 'resource ownership not proven'
    if ($Kind -ceq 'volume') {
        Assert-Safe ($Resource.Driver -ceq 'local' -and $Resource.Scope -ceq 'local' -and
            ($null -eq $Resource.Options -or $Resource.Options.Count -eq 0)) 'volume driver/options mismatch'
        Assert-Safe (-not [string]::IsNullOrEmpty($Resource.CreatedAt)) 'volume creation identity missing'
        $id = "$actualName|$($Resource.CreatedAt)"
    } else {
        $id = $Resource.Id
        Assert-Safe ($id -cmatch '^[0-9a-f]{64}$') 'resource ID missing'
    }
    if ($Identity) { Assert-Safe ($id -ceq $Identity) 'resource identity changed' }
    return $id
}
function Invoke-SafetySteps([scriptblock[]]$Steps) {
    # Exceptions terminate the sequence. Deliberately no cleanup in finally.
    foreach ($step in $Steps) { & $step }
}
function Get-ValidationPsqlPath([string]$Path) {
    $resolved = Get-SafePath $Path -MustExist
    Assert-Safe (Test-Path -LiteralPath $resolved -PathType Leaf) 'psql file missing'
    Assert-Safe ([IO.Path]::GetFileName($resolved) -ieq 'psql.exe') 'psql basename mismatch'
    return $resolved
}
function Get-ValidationPsqlClient([string]$Path, [string]$Directory, [hashtable]$CapabilityEvidence) {
    $resolved = Get-ValidationPsqlPath $Path
    $beforeHash = (Get-FileHash -LiteralPath $resolved -Algorithm SHA256).Hash
    $diagnosticOptions = @{}
    if ($null -ne $CapabilityEvidence) { $diagnosticOptions.CapabilityEvidence=$CapabilityEvidence }
    $r = Invoke-SafeProcess $resolved @('--version') $Directory @diagnosticOptions
    Assert-Safe ($r.ExitCode -eq 0 -and $r.Output.Trim() -cmatch '^psql \(PostgreSQL\) (16\.[0-9]+)$') 'psql major 16 required'
    $version = $Matches[1]
    Assert-Safe ((Get-FileHash -LiteralPath $resolved -Algorithm SHA256).Hash -ceq $beforeHash) 'psql changed during capability check'
    return @{Path=$resolved; Version=$version; SHA256=$beforeHash}
}
function Assert-PsqlUnchanged([hashtable]$Client) {
    $path = Get-ValidationPsqlPath $Client.Path
    Assert-Safe ((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash -ceq $Client.SHA256) 'psql changed after capability gate'
}
function Get-SqlIdentityArguments {
    # Not caller-configurable: no SQL, endpoint or URI is accepted from the environment.
    return @('-X','-w','-h','127.0.0.1','-p','56032','-d','yuni_validation_test',
        '-U','yuni_validation_user','-v','ON_ERROR_STOP=1','-A','-t','-c',
        "SELECT pg_catalog.json_build_object('database', current_database(), 'user', current_user, 'version', version())::text;")
}
function Read-SqlIdentity([hashtable]$Response, [string]$Password) {
    Assert-Safe ($Response.ExitCode -eq 0) 'SQL identity process failed'
    Assert-Safe ($Response.Output -is [string] -and $Response.Output.Length -lt 2048 -and
        -not $Response.Output.Contains($Password)) 'SQL output rejected'
    try {
        # JsonDocument preserves duplicate properties; ConvertFrom-Json alone would collapse them.
        $json = [Text.Json.JsonDocument]::Parse($Response.Output.Trim())
        try {
            Assert-Safe ($json.RootElement.ValueKind -eq [Text.Json.JsonValueKind]::Object) 'SQL object required'
            $fields = @($json.RootElement.EnumerateObject())
            Assert-Safe ($fields.Count -eq 3) 'SQL field count mismatch'
            $result = @{}
            foreach ($field in $fields) {
                Assert-Safe ($field.Name -cin @('database','user','version') -and -not $result.ContainsKey($field.Name) -and
                    $field.Value.ValueKind -eq [Text.Json.JsonValueKind]::String) 'SQL fields invalid'
                $result[$field.Name] = $field.Value.GetString()
            }
            Assert-Safe ($result.database -ceq 'yuni_validation_test' -and $result.user -ceq 'yuni_validation_user') 'SQL target identity mismatch'
            Assert-Safe ($result.version -cmatch '^PostgreSQL 16\.[0-9]+ [\x20-\x7e]{1,500}$') 'SQL server version invalid'
            return $result
        } finally { $json.Dispose() }
    } catch { throw 'SAFETY STOP: SQL identity invalid; native output withheld' }
}
function Assert-PrivateAcl([string]$Path, [Security.Principal.SecurityIdentifier]$Sid) {
    $acl = Get-Acl -LiteralPath $Path
    $rules = @($acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier]))
    Assert-Safe ($acl.AreAccessRulesProtected -and $acl.GetOwner([Security.Principal.SecurityIdentifier]).Value -ceq $Sid.Value -and
        $rules.Count -eq 1 -and $rules[0].IdentityReference.Value -ceq $Sid.Value -and
        $rules[0].AccessControlType -eq [Security.AccessControl.AccessControlType]::Allow -and
        $rules[0].FileSystemRights -eq [Security.AccessControl.FileSystemRights]::FullControl -and
        -not $rules[0].IsInherited) 'private ACL not guaranteed'
}
function Get-PgpassScope([string]$Root, [string]$RunId) {
    Assert-Safe ($RunId -cmatch '^[0-9a-f]{32}$') 'invalid pgpass run ID'
    $rootPath = Get-SafePath $Root -MustExist
    $parent = Get-SafePath "$rootPath\docs\audits\yuni-2026-09\passes\validation" -MustExist
    return Get-SafePath "$parent\pgpass-$RunId"
}
function New-PrivatePgpass([string]$Root, [string]$RunId, [string]$Password, [hashtable]$Ownership) {
    Assert-Safe ($Password -cmatch '^[A-Za-z0-9_-]{32,128}$') 'invalid synthetic password'
    $scope = Get-PgpassScope $Root $RunId
    Assert-Safe (-not (Test-Path -LiteralPath $scope)) 'pgpass scope already exists'
    $sid = [Security.Principal.WindowsIdentity]::GetCurrent().User
    $directoryAcl = [Security.AccessControl.DirectorySecurity]::new()
    $directoryAcl.SetOwner($sid); $directoryAcl.SetAccessRuleProtection($true,$false)
    $directoryAcl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new($sid,'FullControl','ContainerInherit,ObjectInherit','None','Allow'))
    # Windows creates the directory and file with protected ACLs, before any secret is written.
    [IO.FileSystemAclExtensions]::Create([IO.DirectoryInfo]::new($scope),$directoryAcl)
    $Ownership.Created = $true
    Assert-PrivateAcl $scope $sid
    $path = Join-Path $scope 'pgpass.conf'
    $fileAcl = [Security.AccessControl.FileSecurity]::new()
    $fileAcl.SetOwner($sid); $fileAcl.SetAccessRuleProtection($true,$false)
    $fileAcl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new($sid,'FullControl','Allow'))
    $stream = [IO.FileSystemAclExtensions]::Create([IO.FileInfo]::new($path),[IO.FileMode]::CreateNew,
        [Security.AccessControl.FileSystemRights]::Write,[IO.FileShare]::None,4096,[IO.FileOptions]::None,$fileAcl)
    try {
        Assert-PrivateAcl $path $sid
        $bytes = [Text.Encoding]::ASCII.GetBytes("127.0.0.1:56032:yuni_validation_test:yuni_validation_user:$Password`n")
        try { $stream.Write($bytes,0,$bytes.Length); $stream.Flush($true) }
        finally { [Array]::Clear($bytes,0,$bytes.Length) }
    } finally { $stream.Dispose() }
    return $path
}
function Remove-PrivatePgpass([string]$Root, [string]$RunId) {
    $scope = Get-PgpassScope $Root $RunId
    $path = Get-SafePath (Join-Path $scope 'pgpass.conf')
    # No recursive removal, wildcards or guessed outside paths. Reparse points fail closed.
    if (Test-Path -LiteralPath $path) { [IO.File]::Delete($path) }
    if (Test-Path -LiteralPath $scope) { [IO.Directory]::Delete($scope,$false) }
    Assert-Safe (-not (Test-Path -LiteralPath $scope)) 'pgpass cleanup incomplete'
}
function Invoke-HostSqlIdentity([hashtable]$Context, [hashtable]$Evidence) {
    $Evidence.attempted = $false; $Evidence.result='FAIL'; $Evidence.pgpassCleanup='NOT RUN'
    $ownership = @{Created=$false}
    try {
        Assert-PsqlUnchanged $Context.Psql
        $passFile = New-PrivatePgpass $Context.Root $Context.RunId $Context.Values.VALIDATION_POSTGRES_PASSWORD $ownership
        $Evidence.attempted = $true
        $response = Invoke-SafeProcess $Context.Psql.Path (Get-SqlIdentityArguments) $Context.Root @{
            PGPASSFILE=$passFile; PGCONNECT_TIMEOUT='5'; PGCLIENTENCODING='UTF8'; PGAPPNAME='yuni-dec005-identity'
        } 15 -ReturnExitCode
        $Evidence.exitCode = $response.ExitCode
        $identity = Read-SqlIdentity $response $Context.Values.VALIDATION_POSTGRES_PASSWORD
        $Evidence.actualDatabase = $identity.database; $Evidence.currentUser = $identity.user
        $Evidence.postgresVersion = $identity.version
        $Evidence.result='PASS'
    } catch { throw 'SAFETY STOP: host SQL identity failed; raw output suppressed' }
    finally {
        try {
            if ($ownership.Created) { Remove-PrivatePgpass $Context.Root $Context.RunId }
            $Evidence.pgpassCleanup='PASS'
        }
        catch {
            $Evidence.pgpassCleanup='FAIL'; $Evidence.result='FAIL'
            throw 'SAFETY STOP: private pgpass cleanup failed; manual recovery required'
        }
    }
}
function Invoke-IdentityAndCleanup([scriptblock]$Probe, [scriptblock]$Compare, [scriptblock]$Cleanup,
    [hashtable]$SqlEvidence, [hashtable]$Checks) {
    # Only this narrow post-creation phase permits failure cleanup. Cleanup itself must reprove ownership.
    try {
        & $Probe
        Assert-Safe ($SqlEvidence.result -ceq 'PASS' -and $SqlEvidence.pgpassCleanup -ceq 'PASS') 'SQL success required'
        & $Compare
        $Checks.Runtime='PASS: health, loopback, TCP and host SQL identity'
    } catch {
        $Checks.Runtime='FAIL: SQL identity or resource comparison'
        try { & $Cleanup } catch { $Checks.Cleanup='FAIL / UNKNOWN: resources retained' }
        throw 'SAFETY STOP: identity/comparison failed; see redacted cleanup outcome'
    }
    & $Cleanup
}
Export-ModuleMember -Function *
