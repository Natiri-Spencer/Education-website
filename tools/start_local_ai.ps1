$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $PSScriptRoot 'ollama/ollama.exe'
if (-not (Test-Path -LiteralPath $runtime)) { throw 'Install the local runtime with tools/install_local_ai_runtime.py first.' }
$env:OLLAMA_HOST = '127.0.0.1:11434'
$env:OLLAMA_MODELS = Join-Path $projectRoot 'models/ollama'
$env:OLLAMA_NO_CLOUD = '1'
$env:OLLAMA_NUM_PARALLEL = '1'
$env:OLLAMA_CONTEXT_LENGTH = '2048'
$env:OLLAMA_MAX_LOADED_MODELS = '1'
try {
    $null = Invoke-RestMethod 'http://127.0.0.1:11434/api/version' -TimeoutSec 2
    Write-Output 'Local AI service is already running.'
} catch {
    $logDirectory = Join-Path $projectRoot 'tmp/local-ai'
    New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
    $process = Start-Process -FilePath $runtime -ArgumentList 'serve' -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDirectory 'service.out.log') -RedirectStandardError (Join-Path $logDirectory 'service.err.log')
    Write-Output "Started local AI service (PID $($process.Id))."
}
