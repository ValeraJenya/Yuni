#requires -Version 7.4
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$ExpectedWorktreeRoot,
    [Parameter(Mandatory)][string]$BaselineSha,
    [Parameter(Mandatory)][string]$ExpectedHeadSha,
    [Parameter(Mandatory)][string]$EnvFile
)
$ErrorActionPreference = 'Stop'
try {
    Import-Module "$PSScriptRoot\safety.psm1" -Force -DisableNameChecking
    $null = Get-StaticContext $ExpectedWorktreeRoot $BaselineSha $ExpectedHeadSha $EnvFile $PSScriptRoot
    Write-Output 'STATIC GUARD PASS; runtime ownership/connectivity NOT CHECKED; no authorization granted.'
    exit 0
} catch {
    # Never emit exception details: parser/native errors can contain credentials.
    [Console]::Error.WriteLine('STATIC GUARD STOP: invalid or unverified input; details suppressed.')
    exit 1
}
