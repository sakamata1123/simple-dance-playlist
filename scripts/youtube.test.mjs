import {test} from 'node:test';
import assert from 'node:assert/strict';
import {playlistId, fetchPlaylist} from './youtube.mjs';
import {build, validateSource} from './build.mjs';

const url = 'https://www.youtube.com/playlist?list=PLtest_1234567890';
const item = (title='曲', id='_YZZfaMGEOU', privacyStatus='public') => ({snippet:{title, resourceId:{videoId:id}},status:{privacyStatus}});
const ok = data => ({ok:true,json:async()=>data});
const options = items => ({apiKey:'test-secret',fetchImpl:async()=>ok({items})});
test('validate URL-only config without needing credentials; reject bad configuration',()=>{
  validateSource({name:'練習',youtubePlaylists:[url]});
  for(const source of [{name:'x'}, {name:'x',tracks:null}, {name:'x',youtubePlaylists:'url'}, {name:'x',youtubePlaylists:Array(11).fill(url)}, {name:'x',youtubePlaylists:['https://evil.test/playlist?list=PLtest_1234567890']}]) assert.throws(()=>validateSource(source));
  assert.equal(playlistId(url), 'PLtest_1234567890');
  assert.throws(()=>playlistId('https://www.youtube.com/playlist?list=プレイリストID'));
});
test('paginate in YouTube order; keep API key in header only; sanitize titles and skip unavailable videos',async()=>{
  let calls=0;
  const tracks=await fetchPlaylist(url,{apiKey:'test-secret',fetchImpl:async(endpoint,init)=>{
    assert.equal(endpoint.hostname,'www.googleapis.com');
    assert.equal(endpoint.searchParams.get('maxResults'),'50');
    assert.ok(!endpoint.href.includes('test-secret'));
    assert.equal(init.headers['X-Goog-Api-Key'],'test-secret');
    assert.equal(init.redirect,'error');
    if(calls++===0) return ok({items:[item('一'),item('秘密','_YZZfaMGEOU','private'),item('Deleted video')],nextPageToken:'page2'});
    assert.equal(endpoint.searchParams.get('pageToken'),'page2');
    return ok({items:[item('<b>二</b>\n')]});
  }});
  assert.deepEqual(tracks.map(t=>t.title),['一','b 二 /b']);
  assert.equal(calls,2);
});
test('compile URL-only configuration to YamaPlayer output',async()=>{
  const output=await build({name:'練習',youtubePlaylists:[url]},options([item()]));
  assert.ok(output.startsWith('{"playlist":'));
  assert.equal(JSON.parse(output).playlist.contents[0].playlistPanelVideoRenderer.videoId,'_YZZfaMGEOU');
});
test('manual tracks first, then playlists, duplicates intentionally retained',async()=>{
  const output=await build({name:'練習',tracks:[{title:'手動',url:'https://youtu.be/_YZZfaMGEOU',enabled:true}],youtubePlaylists:[url,url]},options([item()]));
  assert.deepEqual(JSON.parse(output).playlist.contents.map(t=>t.playlistPanelVideoRenderer.title.simpleText),['手動','曲','曲']);
});
test('missing key, API failure, malformed response, empty list and paging loops fail safely',async()=>{
  await assert.rejects(fetchPlaylist(url),/YOUTUBE_API_KEY/);
  for(const fetchImpl of [
    async()=>({ok:false,status:403,json:async()=>({error:'secret'})}),
    async()=>{throw new Error('secret');},
    async()=>ok({}), async()=>ok({items:[]}),
    async()=>ok({items:[item()],nextPageToken:'same'}),
    async()=>ok({items:[item('bad','invalid')]}),
    async()=>({ok:true,json:async()=>{throw new Error('secret');}})
  ]) await assert.rejects(fetchPlaylist(url,{apiKey:'secret',fetchImpl}), e=>!e.message.includes('secret'));
});
test('200 items maximum and combined output cannot silently truncate',async()=>{
  await assert.rejects(fetchPlaylist(url,options(Array(201).fill(item()))),/200/);
  await assert.rejects(build({name:'x',youtubePlaylists:[url,url]},options(Array(101).fill(item()))),/200/);
});
