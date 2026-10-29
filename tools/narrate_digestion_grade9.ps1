$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskStory = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot 'digestion_story_grade9.json') | ConvertFrom-Json
$taskSpeaker = New-Object -ComObject SAPI.SpVoice
foreach ($taskVoice in $taskSpeaker.GetVoices()) {
    if ($taskVoice.GetDescription() -like '*Zira*') { $taskSpeaker.Voice = $taskVoice }
}
$taskSpeaker.Rate = 0
for ($taskChapter = 0; $taskChapter -lt $taskStory.Count; $taskChapter++) {
    for ($taskCue = 0; $taskCue -lt $taskStory[$taskChapter].narration.Count; $taskCue++) {
        $taskStream = New-Object -ComObject SAPI.SpFileStream
        $taskStream.Format.Type = 22
        $taskPath = Join-Path $taskRoot "tmp/digestion-grade9-voice/voice-$taskChapter-$taskCue.wav"
        $taskStream.Open($taskPath, 3, $false)
        $taskSpeaker.AudioOutputStream = $taskStream
        [void]$taskSpeaker.Speak($taskStory[$taskChapter].narration[$taskCue])
        $taskStream.Close()
    }
    Write-Output "Narrated chapter $($taskChapter + 1): $($taskStory[$taskChapter].title)"
}
