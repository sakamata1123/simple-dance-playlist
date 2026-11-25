import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compile, videoId} from './build.mjs';

const track = (title='曲名', enabled=true) => ({title, enabled, url:'https://youtu.be/_YZZfaMGEOU'});
test('YamaPlayer parser-compatible compact prefix, titles and order', () => {
  const output = compile({name:'練習', tracks:[track('一'),track('非表示',false),track('二')]});
  assert.ok(output.startsWith('{"playlist":'));
  const parsed = JSON.parse(output).playlist;
  assert.equal(parsed.title,'練習');
  assert.deepEqual(parsed.contents.map(t=>t.playlistPanelVideoRenderer.title.simpleText),['一','二']);
  assert.equal(parsed.contents[0].playlistPanelVideoRenderer.videoId,'_YZZfaMGEOU');
});
test('accepted video URL forms',()=>{
  for (const url of ['https://youtu.be/_YZZfaMGEOU?si=example','https://www.youtube.com/watch?v=_YZZfaMGEOU&list=example','https://m.youtube.com/watch?v=_YZZfaMGEOU','https://youtube.com/shorts/_YZZfaMGEOU','https://www.youtube.com/embed/_YZZfaMGEOU']) assert.equal(videoId(url),'_YZZfaMGEOU');
});
test('reject foreign hosts, playlist URLs, credentials and malformed IDs',()=>{
  for (const url of ['https://youtube.com.evil.test/watch?v=_YZZfaMGEOU','https://www.youtube.com/playlist?list=example','http://youtu.be/_YZZfaMGEOU','https://u:p@youtu.be/_YZZfaMGEOU','https://youtu.be/short']) assert.throws(()=>videoId(url));
});
test('reject misspelled fields and wrong enabled type',()=>{
  assert.throws(()=>compile({name:'test',tracks:[{...track(),enable:true}]}));
  assert.throws(()=>compile({name:'test',tracks:[{...track(),enabled:'false'}]}));
});
test('reject rich text and missing title, including disabled entries',()=>{
  for (const title of ['<size=100>bad</size>','','\n']) assert.throws(()=>compile({name:'test',tracks:[track(title,false)]}));
});
test('limit and empty list',()=>{
  assert.throws(()=>compile({name:'test',tracks:Array.from({length:201},()=>track())}));
  assert.equal(JSON.parse(compile({name:'empty',tracks:[]})).playlist.contents.length,0);
});
