# Simple Dance プレイリスト

許可したメンバーがGitHubで曲一覧を編集し、GitHub PagesからVRChatへ配信します。

## 複数の名前付きプレイリストを管理する

`playlist.json` のルートを `{"playlists": [リスト1, リスト2]}` にします。
各リストは従来と同じ `{"name": "名前", "tracks": [...]}` です。
具体例は [examples/multiple-playlists.json](examples/multiple-playlists.json) を参照してください。
PowerShellツールで生成した各JSONオブジェクトを、この配列の中にカンマで区切って入れられます。
`{...}.{...}` のような連結、コメント、末尾の余分なカンマ、`...` の省略記号はJSONとして使えません。

最大10リスト・各200曲。リスト名と曲順を維持します。従来の単一リスト形式も使用できます。

## 現在のワールド連携：Dance Playlists v1.3

コピー用パネルが `playlist.json` を取得・検証し、同じ曲名とURLを **YamaPlayerのプレイリスト一覧とURLコピー用パネルの両方** へ渡します。

- 入室約2秒後に、各参加者のクライアントがJSONを1回取得します。途中参加者も同じ方式です。
- パネルの「再読み込み」は追加で1回取得し、両方の一覧を更新します。自動の定期再取得はありません。
- 取得失敗・不正なJSONの場合は、前の正常な一覧を保持します。「再読み込み」で再試行できます。
- 再読み込みでは登録済みスロットを再使用し、リストを重複追加しません。

一覧とページ操作は各自のローカル状態で、動画の再生同期はYamaPlayerが担当します。配信途中の更新により、参加者ごとに取得した版が異なる場合があります。特にリストや曲の削除・並べ替え後は、新しいインスタンスで揃えてください。
再読み込みは現在再生している動画URLを変更しませんが、次曲の選択は更新後の一覧に従います。

### URLコピーで再生する

1. コピー用パネルでプレイリストを選びます。
2. 動画一覧から曲名を押すと、下部にURLが表示されます。
3. URL欄を押してVRChatの入力UIを開き、全選択・コピーします。デスクトップでは `Ctrl+A` → `Ctrl+C` を使えます。
4. YamaPlayerの動画URL入力欄へ貼り付けて再生します。
5. 別のリストを選ぶ場合は「リスト一覧へ戻る」を押します。

「URLを戻す」はURL欄への誤入力を復元します。曲を押すだけではキーボードが開かない場合があるため、URL欄そのものを押してください。クリップボードへの自動書き込みはしません。

v1.3は動画のURL解決経路を変更しません。YamaPlayerのリストから直接再生すると、引き続き `api.yamachan.moe` を使用します。`PlayerError` が出る環境では上記のコピー経由を使ってください。コピー用パネルの一覧取得・URL表示はこのサービスを使用しません。

## Windowsで曲一覧を作って貼り付ける（現在の運用）

1. **Code → Download ZIP** で取得してすべて展開します。
2. `manual/Start.cmd` をダブルクリックし、公開YouTubeプレイリストのURLを貼ります。
3. 初回は公式yt-dlpを自動取得・SHA256検証します。
4. `manual/generated/` に作られたJSONを開き、このリポジトリの `playlist.json` を編集してCommitします。
   - 単一リストだけを管理する場合は、生成JSONでファイル全体を置き換えます。
   - 複数リストの場合は、`playlists` 配列内の該当する `{ "name": ..., "tracks": [...] }` だけを置き換えます。ほかのリストは残してください。
5. Actionsが成功したら配信完了です。Unityの再アップロードは不要です（配信URLを変えない場合）。

動画本体はダウンロードしません。タイトルとURLだけを取得し、曲順と重複を維持します。
最大200件。既存ファイルは上書きせず、失敗や0曲の場合も保存しません。
YouTube側を変更したときは再生成・貼り付けを行ってください。GitHubからYouTubeへの定期取得は停止しています。
詳しくは [manual/README-ja.txt](manual/README-ja.txt) を参照してください。


### 更新タイミング

- `main` にCommitしたとき、または **Run workflow** で手動実行したときに更新します。
- 公開リポジトリで60日間活動がないと定期実行が停止することがあります。YouTubeだけの編集はGitHub側の活動にはなりません。停止時はActionsからワークフローを再有効化してください。
- 配信URLが同じならUnityの変更・再アップロードは不要です。新しいインスタンスでリストを確認してください。


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

## Unityへの導入・更新（v1.3）

対象は Unity 2022.3.22f1 / VRChat SDK Worlds 3.10.6 / YamaPlayer 1.5.19 / YamachanWebUnit 1.1.0 のPC向け環境です。
連携処理はYamaPlayer 1.5.19の内部フィールドを使用するため、本体のバージョンを変えた場合は再検証してください。
Unityパッケージは別途共有する `DancePlaylists-v1.3.unitypackage` を使用します。このリポジトリのDownload ZIPには含まれていません。

1. 更新前にUnityプロジェクトをバックアップし、v1.3パッケージをImportします。
2. TMPを初めて使う場合は **Window → TextMeshPro → Import TMP Essential Resources** を実行します。
3. `Assets/PlaylistUrlCopy/PlaylistUrlCopy.prefab` をシーンへ配置します。
   有効なコピー用パネルはシーン内に1つだけにしてください。旧PrefabをUnpack・改造している場合は、位置・回転・URL設定を控え、旧パネルを無効にして新Prefabを配置します。
4. パネルの **Playlist Url** に下記の配信URLを設定します。
5. HierarchyでYamaPlayer本体を選び、**Tools → Playlist URL Copy → Set Up YamaPlayer Lists** を実行します。
   コピー用パネルとYamaPlayerを接続し、`YamaPlayer - Multiple Playlist Loader` を作成・更新します。同じプレイヤーに接続された旧 `SheetPlaylistLoader` のオブジェクトは無効になります。再び有効にしないでください。
6. シーンを保存し、**Build & Test** でミラー・両方の一覧・URLコピー・動画再生を確認してからアップロードします。新しいインスタンスで複数人での動作も確認してください。

**更新時もImportだけでは完了しません。手順5のセットアップを必ず実行してください。**
v1.1・v1.2を順番にImportする手順はありません。旧版からの更新でも、v1.3のパネル配置とセットアップが必要です。個別に改造した旧シーンを含むすべての更新パターンを検証したものではありません。

### 配信URLと更新の反映

現在の配信URL:

```text
https://sakamata1123.github.io/simple-dance-playlist/playlist.json
```

別のリポジトリへ移す場合は、実際のPages配信先を確認し、パネルの **Playlist Url** を変更します。セットアップの再実行ではこのURL設定は保持されます。
旧 `Sheet Playlist - Set playlistUrl after deployment` や個別の `list-01.json` URLを設定する方式はv1.3では使用しません。
**配信JSONのURLを、YamaPlayerの動画再生用URL欄へ入力しないでください。**

曲・リストの編集だけなら、最大10リスト・各200曲の範囲でUnityの再アップロードは不要です。Actionsでの配信完了後、パネルの「再読み込み」または新しいインスタンスで確認します。
配信URLの変更やUnityパッケージの更新には再アップロードが必要です。GitHub Pagesの配信反映には時間がかかる場合があります。

配信成功と動画再生成功は別なので、VRChat実機で再生・速度変更・複数人同期も確認してください。

## ローカル検証

Node.js 22以上で `npm test` と `npm run validate` を実行します。テストは模擬APIを使用し、キー不要です。
`npm run build` は配信用JSONを生成します。`youtubePlaylists` にURLを設定している場合のみYouTube APIへ取得に行き、環境変数 `YOUTUBE_API_KEY` が必要です。現在の `tracks` 方式ではAPIキーは不要です。
Pull Requestではキーを渡さず、テストと設定書式の検証のみ行います。実際のAPI取得はmainへの反映後です。
依存パッケージのインストールは不要です。`dist/` に生成した `playlist.json` と旧版互換の `list-01.json` ～ `list-10.json` を配信します。
YamaPlayerの読取仕様に合わせるため、生成JSONを手動で整形しないでください。
