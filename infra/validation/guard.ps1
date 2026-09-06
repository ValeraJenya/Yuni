[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$EnvFile,

    [string]$ComposeFile = (Join-Path $PSScriptRoot 'compose.validation.yml'),

    [string]$ProjectName = 'yuni-validation'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ExpectedProject = 'yuni-validation'
$ExpectedDatabase = 'yuni_validation_test'
$ExpectedHostPort = 55432
$ForbiddenTerms = @('prod', 'production', 'stage', 'staging')

function Stop-Guard {
    param([Parameter(Mandatory = $true)][string]$Message)

    [Console]::Error.WriteLine("VALIDATION GUARD STOP: $Message")
    exit 1
}

function Get-CanonicalPath {
    param([Parameter(Mandatory = $true)][string]$Path, [Parameter(Mandatory = $true)][string]$Label)

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        Stop-Guard "$Label does not exist."
    }

    return (Resolve-Path -LiteralPath $Path -ErrorAction Stop).Path
}

function Read-ValidationEnv {
    param([Parameter(Mandatory = $true)][string]$Path)

    $values = @{}
    $lineNumber = 0
    foreach ($line in Get-Content -LiteralPath $Path -ErrorAction Stop) {
        $lineNumber++
        $trimmed = $line.Trim()
        if ($trimmed.Length -eq 0 -or $trimmed.StartsWith('#')) {
            continue
        }

        $match = [regex]::Match($trimmed, '^(?<key>[A-Za-z_][A-Za-z0-9_]*)=(?<value>.*)$')
        if (-not $match.Success) {
            Stop-Guard "Env file has an invalid assignment on line $lineNumber."
        }

        $key = $match.Groups['key'].Value
        if ($values.ContainsKey($key)) {
            Stop-Guard "Env file defines $key more than once."
        }

        $value = $match.Groups['value'].Value.Trim()
        if ($value.Length -ge 2 -and (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'")))) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        $values[$key] = $value
    }

    return $values
}

function Require-Value {
    param(
        [Parameter(Mandatory = $true)][hashtable]$Values,
        [Parameter(Mandatory = $true)][string]$Name,
        [string]$Expected
    )

    if (-not $Values.ContainsKey($Name) -or [string]::IsNullOrWhiteSpace($Values[$Name])) {
        Stop-Guard "Env file is missing $Name."
    }
    if ($PSBoundParameters.ContainsKey('Expected') -and $Values[$Name] -ne $Expected) {
        Stop-Guard "$Name does not have its required value."
    }
}

function Test-ValidationUrl {
    param([Parameter(Mandatory = $true)][string]$Name, [Parameter(Mandatory = $true)][string]$Value)

    try {
        $uri = [Uri]$Value
    } catch {
        Stop-Guard "$Name is not a valid PostgreSQL URL."
    }

    if ($uri.Scheme -notin @('postgres', 'postgresql')) {
        Stop-Guard "$Name does not use a PostgreSQL protocol."
    }
    if ([string]::IsNullOrWhiteSpace($uri.Host)) {
        Stop-Guard "$Name has no database host."
    }
    if ($uri.Port -ne $ExpectedHostPort) {
        Stop-Guard "$Name does not use host port $ExpectedHostPort."
    }

    $database = [Uri]::UnescapeDataString($uri.AbsolutePath.Trim('/'))
    if ($database -ne $ExpectedDatabase -or $database -notmatch 'validation') {
        Stop-Guard "$Name does not target the validation database."
    }

    $target = ("{0}/{1}" -f $uri.Host, $database).ToLowerInvariant()
    if ($uri.Host -eq 'yuni-postgres-1' -or $target -match 'yuni-postgres-1') {
        Stop-Guard "$Name targets the existing Yuni PostgreSQL container."
    }
    foreach ($term in $ForbiddenTerms) {
        if ($target -match [regex]::Escape($term)) {
            Stop-Guard "$Name contains a forbidden production or staging target marker."
        }
    }

    return [pscustomobject]@{
        Host = $uri.Host.ToLowerInvariant()
        Port = $uri.Port
        Database = $database
    }
}

if ($ProjectName -ne $ExpectedProject) {
    Stop-Guard "Compose project must be $ExpectedProject."
}

$resolvedEnvFile = Get-CanonicalPath -Path $EnvFile -Label 'Validation env file'
if ((Split-Path -Leaf $resolvedEnvFile) -ne '.env.validation') {
    Stop-Guard 'Validation env file must be named .env.validation.'
}

$resolvedComposeFile = Get-CanonicalPath -Path $ComposeFile -Label 'Validation compose file'
$values = Read-ValidationEnv -Path $resolvedEnvFile

Require-Value -Values $values -Name 'COMPOSE_PROJECT_NAME' -Expected $ExpectedProject
Require-Value -Values $values -Name 'VALIDATION_ENVIRONMENT' -Expected 'yuni-audit-validation'
Require-Value -Values $values -Name 'VALIDATION_EXTERNAL_PROVIDERS' -Expected 'disabled'
Require-Value -Values $values -Name 'VALIDATION_DATABASE_NAME' -Expected $ExpectedDatabase
Require-Value -Values $values -Name 'VALIDATION_POSTGRES_PORT' -Expected ([string]$ExpectedHostPort)
Require-Value -Values $values -Name 'VALIDATION_POSTGRES_USER'
Require-Value -Values $values -Name 'VALIDATION_POSTGRES_PASSWORD'

$composeText = Get-Content -LiteralPath $resolvedComposeFile -Raw -ErrorAction Stop
if ($composeText -notmatch '(?m)^name:\s*yuni-validation\s*$') {
    Stop-Guard 'Validation compose file does not declare the expected project name.'
}
if ($composeText -notmatch 'postgres:16-alpine') {
    Stop-Guard 'Validation compose file does not use PostgreSQL 16 Alpine.'
}
if ($composeText -notmatch '127\.0\.0\.1:\$\{VALIDATION_POSTGRES_PORT') {
    Stop-Guard 'Validation compose file does not bind the validation port to 127.0.0.1.'
}
if ($composeText -match 'yuni-postgres-1|yuni_postgres_data|yuni_default') {
    Stop-Guard 'Validation compose file references existing Yuni infrastructure.'
}

$hasDatabaseUrl = $values.ContainsKey('DATABASE_URL') -and -not [string]::IsNullOrWhiteSpace($values['DATABASE_URL'])
$hasTestDatabaseUrl = $values.ContainsKey('TEST_DATABASE_URL') -and -not [string]::IsNullOrWhiteSpace($values['TEST_DATABASE_URL'])
if ($hasDatabaseUrl -xor $hasTestDatabaseUrl) {
    Stop-Guard 'DATABASE_URL and TEST_DATABASE_URL must be supplied together.'
}
if ($hasDatabaseUrl) {
    $databaseUrl = Test-ValidationUrl -Name 'DATABASE_URL' -Value $values['DATABASE_URL']
    $testDatabaseUrl = Test-ValidationUrl -Name 'TEST_DATABASE_URL' -Value $values['TEST_DATABASE_URL']
    if ($databaseUrl.Host -ne $testDatabaseUrl.Host -or $databaseUrl.Port -ne $testDatabaseUrl.Port -or $databaseUrl.Database -ne $testDatabaseUrl.Database) {
        Stop-Guard 'DATABASE_URL and TEST_DATABASE_URL do not resolve to the same validation target.'
    }
}

Write-Output "VALIDATION GUARD PASS: project $ExpectedProject, database $ExpectedDatabase, host port $ExpectedHostPort."
exit 0
