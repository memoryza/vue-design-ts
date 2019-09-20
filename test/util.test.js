/**
 * util function test case
 */
import { createTextVNode, normalizeVNodes } from '../src/util';
import { VNodeFlags, ChildrenFlags } from '../src/enum';

describe('util function test', () => {
  test('createTextVNode', () => {
    const input = 'hello world';
    expect(createTextVNode(input)).toEqual({
      childFlags: ChildrenFlags.NO_CHILDREN,
      children: input,
      data: null,
      el: null,
      flags: VNodeFlags.TEXT,
      tag: null,
      _isNode: true
    })
  });
  test('normalizeVNodes', () => {
    const arr = [{x: 1}, {x: 2}, {x:3, key: 'normal'}];
    expect(normalizeVNodes(arr)).toEqual([{ x: 1, key: '|0' }, { x: 2, key: '|1'}, { x: 3, key: 'normal' }])
  });
})