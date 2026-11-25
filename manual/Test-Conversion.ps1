$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/Make-Playlist.ps1"
function Assert($Condition, $Message) { if (!$Condition) { throw $Message } }
$data = @{title='日本語の練習'; entries=@(
    @{id='_YZZfaMGEOU'; title='一曲目'},
    @{id='zjiNMPDNO20'; title='<b>二曲目</b>'; availability='public'},
    @{id='_YZZfaMGEOU'; title='一曲目'},
    @{id='_YZZfaMGEOU'; title='[Private video]'},
    $null
)}
$result = ConvertTo-TrackList $data ''
Assert ($result.name -eq '日本語の練習') 'Japanese name was lost'
Assert ($result.tracks.Count -eq 3) 'Wrong track count'
Assert ($result.tracks[0].title -eq '一曲目') 'Wrong order'
Assert ($result.tracks[1].title -eq 'b 二曲目 /b') 'Rich text not sanitized'
Assert ($result.tracks[2].url -eq $result.tracks[0].url) 'Duplicate lost'
$single = ConvertTo-TrackList @{entries=@(@{id='_YZZfaMGEOU';title='一曲'})} '単曲'
$parsed = ($single | ConvertTo-Json -Depth 6) | ConvertFrom-Json
Assert ($parsed.tracks -is [Array]) 'One track must remain an array'
foreach ($bad in @(@{entries=@()}, @{entries=@(@{id='invalid';title='x'})}, @{entries=@(@{id='_YZZfaMGEOU';title='x'}) * 201})) {
    $rejected=$false
    try { ConvertTo-TrackList $bad 'test' | Out-Null } catch { $rejected=$true }
    Assert $rejected 'Invalid input was accepted'
}
Write-Output 'PASS: Japanese, ordering, sanitization, duplicates, private entries, single item array, empty/error/limit checks.'
