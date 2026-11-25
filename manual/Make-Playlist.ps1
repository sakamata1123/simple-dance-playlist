param(
    [string]$PlaylistUrl,
    [string]$Name,
    [string]$OutputPath,
    [string]$YtDlpPath
)
$ErrorActionPreference = 'Stop'

function ConvertTo-TrackList {
    param($Data, [string]$ListName)
    if ($null -eq $Data.entries) { throw 'プレイリストの項目が取得できませんでした。' }
    $entries = @($Data.entries)
    if ($entries.Count -gt 200) { throw '200件を超えています。プレイリストを分割してください。' }
    if ([string]::IsNullOrWhiteSpace($ListName)) { $ListName = [string]$Data.title }
    $ListName = ($ListName -replace '[<>\x00-\x1f]', ' ').Trim()
    if (!$ListName) { $ListName = 'ダンス練習' }
    if ($ListName.Length -gt 200) { $ListName = $ListName.Substring(0,200) }
    $tracks = @(
        foreach ($entry in $entries) {
            if ($null -eq $entry -or $entry.availability -in @('private','premium_only','subscriber_only','needs_auth') -or
                $entry.title -in @('[Private video]','[Deleted video]','Private video','Deleted video')) { continue }
            if ([string]$entry.id -cnotmatch '^[A-Za-z0-9_-]{11}$') { throw '不正な動画IDが含まれているため保存しませんでした。' }
            $title = ([string]$entry.title -replace '[<>\x00-\x1f]', ' ').Trim()
            if (!$title) { $title = [string]$entry.id }
            if ($title.Length -gt 200) { $title = $title.Substring(0,200) }
            [ordered]@{title=$title; url=('https://www.youtube.com/watch?v=' + $entry.id); enabled=$true}
        }
    )
    if (!$tracks.Count) { throw '取り込める動画がありません。出力ファイルは作成しません。' }
    return [ordered]@{name=$ListName; tracks=$tracks}
}

# Dot-sourcing exposes only the conversion function for offline tests.
if ($MyInvocation.InvocationName -eq '.') { return }

if (!$PlaylistUrl) { $PlaylistUrl = Read-Host 'YouTubeプレイリストURLを貼り付けてEnter' }
$uri = $null
if (![Uri]::TryCreate($PlaylistUrl.Trim(), [UriKind]::Absolute, [ref]$uri) -or
    $uri.Scheme -ne 'https' -or $uri.Host -notin @('www.youtube.com','youtube.com','m.youtube.com') -or
    $uri.UserInfo -or !$uri.IsDefaultPort -or $uri.AbsolutePath -notin @('/playlist','/watch')) {
    throw 'HTTPSのYouTubeプレイリストURLを指定してください。'
}
$match = [regex]::Match($uri.Query, '(?:\?|&)list=([A-Za-z0-9_-]{10,100})(?:&|$)')
if (!$match.Success) { throw 'URLにlist=プレイリストIDがありません。' }
$canonicalUrl = 'https://www.youtube.com/playlist?list=' + $match.Groups[1].Value

if (!$YtDlpPath) {
    $toolDir = Join-Path $PSScriptRoot '.tools'
    $YtDlpPath = Join-Path $toolDir 'yt-dlp.exe'
    if (!(Test-Path -LiteralPath $YtDlpPath)) {
        Write-Host '初回のみ、公式GitHubからyt-dlpをダウンロードします（管理者権限不要）。'
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $release = Invoke-RestMethod 'https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest'
        $exeAsset = $release.assets | Where-Object { $_.name -eq 'yt-dlp.exe' } | Select-Object -First 1
        $hashAsset = $release.assets | Where-Object { $_.name -eq 'SHA2-256SUMS' } | Select-Object -First 1
        if (!$exeAsset -or !$hashAsset) { throw '公式配布ファイルが見つかりません。時間をおいて再実行してください。' }
        foreach ($asset in @($exeAsset,$hashAsset)) {
            if ($asset.browser_download_url -notmatch '^https://github\.com/yt-dlp/yt-dlp/releases/download/') { throw '配布URLが不正です。' }
        }
        [IO.Directory]::CreateDirectory($toolDir) | Out-Null
        $tempExe = Join-Path $toolDir ([Guid]::NewGuid().ToString() + '.download')
        try {
            Invoke-WebRequest $exeAsset.browser_download_url -OutFile $tempExe -UseBasicParsing
            $hashes = (Invoke-WebRequest $hashAsset.browser_download_url -UseBasicParsing).Content
            if ($hashes -is [byte[]]) { $hashes = [Text.Encoding]::UTF8.GetString($hashes) }
            $hashMatch = [regex]::Match($hashes, '(?m)^([a-fA-F0-9]{64})\s+\*?yt-dlp\.exe\r?$')
            if (!$hashMatch.Success -or (Get-FileHash -LiteralPath $tempExe -Algorithm SHA256).Hash -ne $hashMatch.Groups[1].Value) { throw 'ダウンロードのSHA256検証に失敗しました。' }
            Move-Item -LiteralPath $tempExe -Destination $YtDlpPath
        } finally { if (Test-Path -LiteralPath $tempExe) { Remove-Item -LiteralPath $tempExe } }
    }
}
$YtDlpPath = (Resolve-Path -LiteralPath $YtDlpPath).Path
Write-Host '曲名とURLを取得しています。動画ファイルはダウンロードしません。'
$info = New-Object Diagnostics.ProcessStartInfo
$info.FileName = $YtDlpPath
$info.Arguments = '--ignore-config --flat-playlist --dump-single-json --skip-download --no-warnings --encoding utf-8 --socket-timeout 20 --retries 2 --playlist-end 201 -- ' + $canonicalUrl
$info.UseShellExecute = $false
$info.CreateNoWindow = $true
$info.RedirectStandardOutput = $true
$info.RedirectStandardError = $true
$info.StandardOutputEncoding = [Text.Encoding]::UTF8
$info.StandardErrorEncoding = [Text.Encoding]::UTF8
$process = New-Object Diagnostics.Process
$process.StartInfo = $info
try {
    $process.Start() | Out-Null
    $stdout = $process.StandardOutput.ReadToEndAsync()
    $stderr = $process.StandardError.ReadToEndAsync()
    if (!$process.WaitForExit(180000)) { $process.Kill(); throw '取得がタイムアウトしました。時間をおいて再実行してください。' }
    $json = $stdout.GetAwaiter().GetResult()
    $errorText = $stderr.GetAwaiter().GetResult()
    if ($process.ExitCode -ne 0) { throw ('取得に失敗しました。公開状態やアクセス制限を確認してください。' + [Environment]::NewLine + $errorText) }
} finally { $process.Dispose() }
$data = $json | ConvertFrom-Json
$result = ConvertTo-TrackList -Data $data -ListName $Name
if (!$OutputPath) {
    $outputDir = Join-Path $PSScriptRoot 'generated'
    [IO.Directory]::CreateDirectory($outputDir) | Out-Null
    $OutputPath = Join-Path $outputDir ('playlist-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff') + '.json')
}
$OutputPath = [IO.Path]::GetFullPath($OutputPath)
# CreateNew prevents accidentally overwriting an existing list.
$file = [IO.File]::Open($OutputPath, [IO.FileMode]::CreateNew)
$writer = New-Object IO.StreamWriter($file, [Text.UTF8Encoding]::new($false))
try { $writer.WriteLine(($result | ConvertTo-Json -Depth 6)) } finally { $writer.Dispose() }
Write-Host ('完了: ' + $result.tracks.Count + '曲')
Write-Host ('保存先: ' + $OutputPath)
Write-Host 'このJSONの内容をGitHubのplaylist.jsonに貼り付け、Commit changesしてください。'
