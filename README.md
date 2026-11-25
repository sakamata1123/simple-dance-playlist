# Simple Dance プレイリスト

許可したメンバーがGitHubで曲一覧を編集し、GitHub PagesからVRChatへ配信します。
Googleスプレッドシート・Apps Script・Gist・個人アクセストークンは不要です。

## YouTubeプレイリストから自動取り込み（推奨）

`playlist.json` を次の形式に置き換えます。`プレイリストID` は実際のIDに置き換えてください。

```json
{
  "name": "ダンス練習",
  "youtubePlaylists": [
    "https://www.youtube.com/playlist?list=プレイリストID"
  ]
}
```

公開プレイリストを使用してください。個人用の「後で見る」、非公開プレイリスト、自動生成ミックスは対象外です。
複数URLも指定でき、上から順に1つのリストに結合します。各リスト内はYouTubeの順番を維持し、重複動画も残します。
最大10リスト、各リスト最大200件（非公開・削除済みを含む）、手動分を合わせた合計も最大200曲です。
非公開・削除済みの項目は除外します。地域制限など、実際の再生可否までは保証しません。
取得エラー・件数超過・取り込める動画が0件の場合は公開せず、直前の配信を維持します。
空の `youtubePlaylists: []` は自動取り込みなしを意味します。現在は設定待ちのため既存の手動曲を維持しています。

### 最初に一度だけ：APIキーを登録

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成または選択します。
2. **APIとサービス → ライブラリ** で **YouTube Data API v3** を有効にします。
3. **APIとサービス → 認証情報 → 認証情報を作成 → APIキー** でキーを作成します。
4. キーの **APIの制限** は **YouTube Data API v3** のみにします。GitHub Actionsから呼ぶため、ウェブサイトのHTTPリファラー制限は設定しません。共有ランナーのIPは固定ではありません。
5. GitHubリポジトリの **Settings → Secrets and variables → Actions → New repository secret** を開きます。
6. Nameを **YOUTUBE_API_KEY**、Secretを発行したキーにして保存します。
7. `playlist.json` に実際のプレイリストURLを登録してCommitします。
8. **Actions → Validate and publish playlist** が成功し、Pagesの `playlist.json` に曲が並ぶことを確認します。

キーを `playlist.json`、Unity、README、チャットには貼らないでください。
公開データ取得のみのためOAuth同意画面やGoogleアカウントのログイン連携は不要です。
管理を引き継ぐ場合は、新管理者のGoogle Cloudプロジェクトでキーを作り、このSecretを更新すると管理を分離できます。
共同編集者はワークフローも変更できるので、Secretsにアクセスし得る信頼したメンバーに限って編集権限を付けてください。
公式説明: [YouTube API認証](https://developers.google.com/youtube/data/guides/authentication)

### 更新タイミング

- `main` にCommitしたとき、または **Run workflow** で手動実行したときに更新します。
- YouTube側だけを編集した場合は、毎時17分を目安に自動取得します。GitHubの混雑で遅れる場合があります。
- 公開リポジトリで60日間活動がないと定期実行が停止することがあります。YouTubeだけの編集はGitHub側の活動にはなりません。停止時はActionsからワークフローを再有効化してください。
- 配信URLが同じならUnityの変更・再アップロードは不要です。新しいインスタンスでリストを確認してください。

GitHubの仕様: [定期実行](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

`tracks` と `youtubePlaylists` の併用も可能です。その場合は手動曲の後ろに自動取り込みの曲が並びます。
YouTubeだけに切り替える場合は、既存の `tracks` を削除してください。

## 手動で1曲ずつ登録する場合

1. このリポジトリの `playlist.json` を開き、鉛筆ボタンで編集します。
2. `title` が曲名、`url` がYouTube動画URL、`enabled` が表示するかどうかです。
3. 曲のブロックを上から好きな順に並べます。`false` にすると一覧から非表示になります。
4. **Commit changes** で保存します。同時編集の競合が表示されたら、最新の内容を開き直してください。
5. **Actions** で処理が緑になれば公開完了です。失敗時は詳細に入力エラーが表示されます。

曲の例（複数の曲の間にはカンマが必要です）:

```json
{
  "name": "Dance Practice",
  "tracks": [
    {"title": "ラジオ体操第一", "url": "https://www.youtube.com/watch?v=_YZZfaMGEOU", "enabled": true},
    {"title": "いったん非表示", "url": "https://youtu.be/_YZZfaMGEOU", "enabled": false}
  ]
}
```

最大200曲。YouTubeのwatch・youtu.be・shorts・embed形式に対応します。
ライブ配信は対象外です。URL形式の検証は動画の公開状態・再生可否までは保証しません。
名前は200文字まで、改行やリッチテキストのタグは使えません。
非表示の曲も書式を検査します。配信ファイルには含めませんが、公開リポジトリの編集用ファイルや履歴からは閲覧できます。

入力に誤りがある場合は配信せず、直前の正常な配信を維持します。
過去の内容はGitHubの変更履歴から確認・復元できます。

## 所有者の初期設定

1. 公開リポジトリ `simple-dance-playlist` を作成します。
2. このフォルダの内容を、隠しフォルダ `.github` を含めてリポジトリのルートへ配置します。
   Unityプロジェクト全体はアップロードしません。ブランチ名は `main` にします。
3. **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にします。
4. **Actions → Validate and publish playlist → Run workflow** で初回配信します。
5. **Settings → Collaborators** から、編集してよい人のGitHubアカウントを招待します。
   招待された人が承諾すると編集できます。招待する相手は所有者が選んでください。
   共同編集者は曲リスト以外のリポジトリ内ファイルも編集可能です。
6. 自動取り込みは上記APIキーを登録します。日常の曲編集はYouTube側で行い、取り込み元を変更するときだけ `playlist.json` を編集します。

曲一覧とリポジトリは一般公開、書き込みは所有者と招待された共同編集者のみです。
外部の人が変更提案を送っても、承認・マージしない限り公開内容は変わりません。

## Unityへ接続

配信URLは通常 `https://ユーザー名.github.io/simple-dance-playlist/playlist.json` です。
実際のPages配信先を確認し、末尾に `playlist.json` を付けてください。
ログアウト状態でもJSONが取得できることを確認します。

SimpleDanceシーンの `Sheet Playlist - Set playlistUrl after deployment` を選択し、
`Playlist Url` をそのURLへ変更して保存・Build & Testしてください。
スクリプト名は既存シーンの参照を保つため残していますが、Googleへの依存はありません。
このURLをYamaPlayerの動画再生用URL欄へ入力しないでください。

入室約8秒後にリストの取得が始まります。YamaPlayerのプレイリスト一覧から曲を選びます。
配信内容の更新だけならワールドの再アップロードは不要です。配信URL変更時は必要です。
GitHub PagesとCDNの反映には時間がかかる場合があります。
現在ワールドには定期的な再読込機能がないため、新しいインスタンスで更新を確認してください。
練習中にリストを編集すると途中参加者とリストが異なる可能性があるため、編集は練習の前後に行ってください。

YamaPlayer 1.5.19＋YamachanWebUnit 1.1.0のPC向けです。外部の動画解決サービスを使用します。
配信成功と動画再生成功は別なので、VRChat実機で再生・速度変更・複数人同期も確認してください。

## ローカル検証

Node.js 22以上で `npm test` と `npm run validate` を実行します。テストは模擬APIを使用し、キー不要です。
`npm run build` は実際に取得します。YouTube URLを設定している場合は環境変数 `YOUTUBE_API_KEY` が必要です。
Pull Requestではキーを渡さず、テストと設定書式の検証のみ行います。実際のAPI取得はmainへの反映後です。
依存パッケージのインストールは不要です。配信するのは生成された `dist/playlist.json` のみです。
YamaPlayerの読取仕様に合わせるため、生成JSONを手動で整形しないでください。
