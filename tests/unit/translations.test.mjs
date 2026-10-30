import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { translateUi } from '../../src/i18n/translate.ts';
const dictionary = JSON.parse(fs.readFileSync(new URL('../../src/i18n/ui.en.json', import.meta.url)));
test('interface copy translates in English and preserves Romanian', () => {
  assert.equal(translateUi('Cerere Ofertă', 'en', dictionary), 'Quotation request');
  assert.equal(translateUi('Cerere Ofertă', 'ro', dictionary), 'Cerere Ofertă');
  assert.equal(translateUi(' Add an unknown product name ', 'en', dictionary), ' Add an unknown product name ');
  const node = { product: 42 }; assert.equal(translateUi(node,'en',dictionary),node);
});
test('dynamic counts and failures translate without losing numbers', () => {
  assert.equal(translateUi('Trimite Cererea (4 furnizori)','en',dictionary),'Send request (4 suppliers)');
  assert.equal(translateUi('2 cereri salvate. 1 cereri nu au fost trimise; au rămas în coș pentru reîncercare.','en',dictionary),'2 requests saved. 1 requests could not be sent and remain in the basket for retry.');
});
test('server and browser translation dictionaries have the same keys', () => {
  for (const language of ['ro','en']) {
    const server = JSON.parse(fs.readFileSync(new URL(`../../messages/${language}.json`,import.meta.url)));
    const client = JSON.parse(fs.readFileSync(new URL(`../../src/i18n/messages/${language}.json`,import.meta.url)));
    assert.deepEqual(client,server);
  }
});

test('Romanian API error literals have an English translation', async () => {
  const ts = await import('typescript');
  const path = await import('node:path');
  const root = fileURLToPath(new URL('../../src/app/api/',import.meta.url));
  function files(directory) { return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry => entry.isDirectory() ? files(path.join(directory,entry.name)) : [path.join(directory,entry.name)]); }
  const missing = new Set();
  for (const file of files(root).filter(file => file.endsWith('.ts'))) {
    const source = fs.readFileSync(file,'utf8'), ast = ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
    function visit(node) {
      if (ts.isPropertyAssignment(node) && ['error','message'].includes(node.name.getText(ast))) {
        function strings(value) { if (ts.isStringLiteral(value) && /[ăâîșțĂÂÎȘȚ]/.test(value.text) && !dictionary[value.text]) missing.add(value.text); ts.forEachChild(value,strings); }
        strings(node.initializer);
      }
      ts.forEachChild(node,visit);
    }
    visit(ast);
  }
  assert.deepEqual([...missing],[]);
});

test('all static ui() strings have English copy', async () => {
  const ts = await import('typescript');
  const path = await import('node:path');
  const root = fileURLToPath(new URL('../../src/',import.meta.url));
  function files(directory) { return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry => entry.isDirectory() ? files(path.join(directory,entry.name)) : [path.join(directory,entry.name)]); }
  const missing = new Set();
  for (const file of files(root).filter(file => file.endsWith('.tsx'))) {
    const source = fs.readFileSync(file,'utf8'), ast = ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    function visit(node) {
      if (ts.isCallExpression(node) && node.expression.getText(ast) === 'ui' && ts.isStringLiteral(node.arguments[0])) {
        const key = node.arguments[0].text.trim();
        if (/[a-zăâîșț]/i.test(key) && !dictionary[key]) missing.add(key);
      }
      ts.forEachChild(node,visit);
    }
    visit(ast);
  }
  assert.deepEqual([...missing],[]);
});
