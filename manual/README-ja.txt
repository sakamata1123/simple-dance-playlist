YouTubeプレイリスト → 曲一覧JSON（Windows用）

1. このフォルダーをZIPからすべて展開する。
2. Start.cmdをダブルクリックする。
3. 公開YouTubeプレイリストのURLを貼り付けてEnter。
4. generatedフォルダーにできたJSONをメモ帳で開く。
5. 中身をすべてコピーし、GitHubのplaylist.jsonを鉛筆ボタンで編集して全置換。
6. Commit changesで保存。Actionsが緑になれば配信完了。

編集先: https://github.com/sakamata1123/simple-dance-playlist/blob/main/playlist.json

Cloud Console・APIキー・Pythonのインストールは不要です。
初回のみ公式GitHubからWindows x64用yt-dlp.exeを.toolsフォルダーへダウンロードします。
公式のSHA256チェックサムと照合してから使用します。インターネット接続が必要です。
Start.cmdの実行ポリシー指定はそのプロセス限りです。PC全体の設定は変更しません。
動画はダウンロードしません。曲名と動画URLだけを取得します。
現在のリストを上書きせず、時刻付きJSONを新しく保存します。
曲順・重複を維持します。非公開・削除済みなどの項目はスキップします。
最大200件。超過・取得失敗・0曲の場合は保存しません。再生可否はVRChatで確認してください。
この方式は手動更新です。YouTube側を編集したら再生成・GitHubへの貼り付けを行ってください。
配信URLが変わらなければUnityの再アップロードは不要です。

取得できないとき:
- 公開プレイリストであることを確認してください。「後で見る」や自動生成ミックスは対象外です。
- アクセス制限時は時間をおいて再実行してください。
- yt-dlpの更新が必要な場合、.tools/yt-dlp.exeを削除して再実行すると最新版を取得します。
- CookiesやGoogleアカウントのパスワードは不要です。

PowerShellから名前や出力先を指定する例:
.\Make-Playlist.ps1 -PlaylistUrl "https://www.youtube.com/playlist?list=実際のID" -Name "ダンス練習" -OutputPath ".\playlist-new.json"

yt-dlp公式: https://github.com/yt-dlp/yt-dlp
