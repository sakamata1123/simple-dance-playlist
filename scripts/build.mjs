import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

function object(value, keys, location) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${location}: オブジェクトが必要です`);
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) throw new Error(`${location}: 未対応の項目 ${key}`);
  }
}

function label(value, location) {
  if (typeof value !== 'string' || !value.trim() || value.length > 200 || /[<>\x00-\x1f]/.test(value)) {
    throw new Error(`${location}: 1～200文字の文字列を指定してください。タグ・改行は使えません`);
  }
  return value.trim();
}

export function videoId(value) {
  if (typeof value !== 'string') throw new Error('YouTube動画URLが必要です');
  let url;
  try { url = new URL(value.trim()); } catch { throw new Error('URLの形式が不正です'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new Error('通常のHTTPS YouTube URLを指定してください');
  let id;
  if (url.hostname === 'youtu.be') id = url.pathname.slice(1);
  else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else id = /^\/(?:shorts|embed)\/([A-Za-z0-9_-]{11})$/.exec(url.pathname)?.[1];
  }
  if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) throw new Error('YouTube動画のURLを指定してください（プレイリストURLは不可）');
  return id;
}

export function compile(input) {
  object(input, ['name', 'tracks'], 'リスト');
  const name = label(input.name, 'name');
  if (!Array.isArray(input.tracks) || input.tracks.length > 200) throw new Error('tracksは最大200曲の配列にしてください');
  const contents = [];
  input.tracks.forEach((track, index) => {
    const location = `${index + 1}曲目`;
    object(track, ['title', 'url', 'enabled'], location);
    if (typeof track.enabled !== 'boolean') throw new Error(`${location}: enabledはtrueまたはfalseで指定してください`);
    try {
      const title = label(track.title, `${location} title`);
      const id = videoId(track.url);
      if (track.enabled) contents.push({playlistPanelVideoRenderer: {videoId: id, title: {simpleText: title}}});
    } catch (error) { throw new Error(`${location}: ${error.message}`); }
  });
  // YamaPlayer 1.5.19 searches for the literal {"playlist": prefix.
  return JSON.stringify({playlist: {title: name, contents}});
}

async function main() {
  const source = JSON.parse(await readFile(new URL('../playlist.json', import.meta.url), 'utf8'));
  const output = compile(source); // Validate the whole list before producing an artifact.
  const directory = new URL('../dist/', import.meta.url);
  await mkdir(directory, {recursive: true});
  await writeFile(new URL('playlist.json', directory), output + '\n');
  await writeFile(new URL('.nojekyll', directory), '');
  console.log(`Validated ${JSON.parse(output).playlist.contents.length} enabled tracks; generated dist/playlist.json`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
