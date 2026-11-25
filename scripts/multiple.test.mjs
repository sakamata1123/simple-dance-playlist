import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build, validateSource, distributionFiles} from './build.mjs';
const list=(name,id)=>({name,tracks:[{title:name,url:`https://youtu.be/${id}`,enabled:true}]});
test('multiple lists preserve names, boundaries, order and legacy first-list output', async()=>{
  const data=JSON.parse(await build({playlists:[list('ダンアラ','8LmI1irhIpY'),list('別リスト','zjiNMPDNO20')]}));
  assert.deepEqual(data.playlists.map(x=>x.playlist.title),['ダンアラ','別リスト']);
  assert.deepEqual(data.playlist,data.playlists[0].playlist);
  assert.equal(data.playlists[1].playlist.contents[0].playlistPanelVideoRenderer.videoId,'zjiNMPDNO20');
});
test('reject empty/oversized/nested/mixed collections and invalid later entries', async()=>{
  for (const source of [{playlists:[]},{playlists:Array(11).fill(list('x','8LmI1irhIpY'))},{playlists:[{playlists:[]}]},{name:'mixed',playlists:[list('x','8LmI1irhIpY')]},{playlists:[list('x','8LmI1irhIpY'),list('bad','foobar')]}]) {
    assert.throws(()=>validateSource(source));
    await assert.rejects(build(source));
  }
});
test('empty individual list and disabled items do not spill across list boundaries',async()=>{
  const source={playlists:[{name:'空',tracks:[]},{name:'非表示',tracks:[{...list('x','8LmI1irhIpY').tracks[0],enabled:false}]},list('最後','zjiNMPDNO20')]};
  const data=JSON.parse(await build(source));
  assert.deepEqual(data.playlists.map(p=>p.playlist.contents.length),[0,0,1]);
});
test('publish separate YamaPlayer URLs, preserving each name and clearing unused slots',async()=>{
  const output=await build({playlists:[list('ダンアラ','8LmI1irhIpY'),list('民族・ゴシック','CNzssoQz-xU')]});
  const files=distributionFiles(output);
  assert.equal(Object.keys(files).length,11);
  assert.equal(JSON.parse(files['list-01.json']).playlist.title,'ダンアラ');
  assert.equal(JSON.parse(files['list-02.json']).playlist.contents[0].playlistPanelVideoRenderer.videoId,'CNzssoQz-xU');
  assert.ok(files['list-02.json'].startsWith('{"playlist":'));
  const smaller=distributionFiles(await build(list('ひとつ','8LmI1irhIpY')));
  assert.equal(JSON.parse(smaller['list-02.json']).playlist.contents.length,0);
  assert.equal(JSON.parse(smaller['list-10.json']).playlist.contents.length,0);
});
