# Simple Dance プレイリスト

許可したメンバーがGitHubで曲一覧を編集し、GitHub PagesからVRChatへ配信します。
Googleスプレッドシート・Apps Script・Gist・個人アクセストークンは不要です。

## 普段の編集

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
6. 初期設定後の日常運用では `playlist.json` だけを編集します。

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

Node.js 22以上で `npm test` と `npm run build` を実行します。
依存パッケージのインストールは不要です。配信するのは生成された `dist/playlist.json` のみです。
YamaPlayerの読取仕様に合わせるため、生成JSONを手動で整形しないでください。
