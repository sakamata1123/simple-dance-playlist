export function playlistId(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('YouTubeプレイリストのURLが必要です'); }
  const id = url.searchParams.get('list');
  if (url.protocol !== 'https:' || url.username || url.password || url.port ||
      !['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname) ||
      !['/playlist', '/watch'].includes(url.pathname) || !/^[A-Za-z0-9_-]{10,100}$/.test(id ?? '')) {
    throw new Error('list=実際のプレイリストIDを含むHTTPS YouTube URLを指定してください');
  }
  return id;
}

export async function fetchPlaylist(url, {apiKey, fetchImpl = fetch} = {}) {
  const id = playlistId(url);
  if (!apiKey?.trim()) throw new Error('GitHub Actions SecretsにYOUTUBE_API_KEYを登録してください');
  const tracks = [];
  const tokens = new Set();
  let token;
  let scanned = 0;
  do {
    const endpoint = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    endpoint.search = new URLSearchParams({part:'snippet,status', playlistId:id, maxResults:'50', ...(token ? {pageToken:token} : {})});
    let response;
    try {
      response = await fetchImpl(endpoint, {
        headers: {'X-Goog-Api-Key': apiKey},
        redirect: 'error',
        signal: AbortSignal.timeout(30000)
      });
    } catch { throw new Error('YouTube APIへの接続に失敗しました。時間をおいて再実行してください'); }
    // Never echo a response body or request headers: they could contain credentials.
    if (!response.ok) throw new Error(`YouTube API HTTP ${response.status}: APIキー・APIの有効化・割り当て・プレイリストの公開状態を確認してください`);
    let data;
    try { data = await response.json(); } catch { throw new Error('YouTube APIから不正なJSONが返されました'); }
    if (!Array.isArray(data.items)) throw new Error('YouTube APIのitemsが不正です');
    for (const item of data.items) {
      if (++scanned > 200) throw new Error('YouTubeプレイリストは最大200件です（非公開・削除済みを含む）');
      if (item.status?.privacyStatus === 'private' || ['Private video','Deleted video'].includes(item.snippet?.title)) continue;
      const videoId = item.snippet?.resourceId?.videoId;
      if (!/^[A-Za-z0-9_-]{11}$/.test(videoId ?? '') || typeof item.snippet?.title !== 'string') throw new Error('YouTube動画のIDまたはタイトルが不正です');
      // Unity rich-text tags and line breaks must never enter UI labels.
      const title = item.snippet.title.replace(/[<>\x00-\x1f]/g, ' ').trim().slice(0,200) || videoId;
      tracks.push({title, url:`https://www.youtube.com/watch?v=${videoId}`, enabled:true});
    }
    token = data.nextPageToken;
    if (token !== undefined && (typeof token !== 'string' || !token || tokens.has(token))) throw new Error('YouTube APIのページ送りが不正です');
    if (token) tokens.add(token);
    if (tokens.size > 20) throw new Error('YouTube APIのページ数が上限を超えました');
  } while (token);
  if (!tracks.length) throw new Error('取り込める動画がありません。直前の配信を維持します');
  return tracks;
}
