$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$story = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot 'male_reproductive_story.json') | ConvertFrom-Json
$voice = New-Object -ComObject SAPI.SpVoice
foreach ($availableVoice in $voice.GetVoices()) {
    if ($availableVoice.GetDescription() -like '*Zira*') { $voice.Voice = $availableVoice; break }
}
$voice.Rate = 0
$work = Join-Path $projectRoot 'tmp/male-reproductive-system'
New-Item -ItemType Directory -Force -Path $work | Out-Null
for ($scene = 0; $scene -lt $story.Count; $scene++) {
    for ($cue = 0; $cue -lt $story[$scene].narration.Count; $cue++) {
        $stream = New-Object -ComObject SAPI.SpFileStream
        $stream.Format.Type = 22
        $stream.Open((Join-Path $work "voice-$scene-$cue.wav"), 3, $false)
        $voice.AudioOutputStream = $stream
        [void]$voice.Speak($story[$scene].narration[$cue])
        $stream.Close()
    }
    Write-Output "Recorded scene $($scene + 1): $($story[$scene].title)"
}
