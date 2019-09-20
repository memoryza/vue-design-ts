/**
 * h function test case
 */
import { h, Portal, Fragment } from '../src/index';
import { VNodeFlags, ChildrenFlags } from '../src/enum';
import { createTextVNode } from '../src/util';

describe('h function test', () => {
  const input = 'hello world'; 
  function func() {
    return h('h1');
  }
  test('element', () => {
    expect(h('div', null, input)).toEqual({
      tag: 'div',
      _isNode: true,
      data: null,
      children: createTextVNode(input),
      flags: VNodeFlags.ELEMENT_HTML,
      childFlags: ChildrenFlags.SINGLE_VNODE,
      el: null,
    });
  });
  test('element with style', () => {
    expect(h('div', { style: { color: 'red' } }, input)).toEqual({
      tag: 'div',
      _isNode: true,
      data: { style: { color: 'red' } },
      children: createTextVNode(input),
      flags: VNodeFlags.ELEMENT_HTML,
      childFlags: ChildrenFlags.SINGLE_VNODE,
      el: null,
    });
  });
  test('element no children', () => {
    expect(h('ul')).toEqual({
      tag: 'ul',
      _isNode: true,
      flags: VNodeFlags.ELEMENT_HTML,
      children: null,
      childFlags: ChildrenFlags.NO_CHILDREN,
      data: null,
      el: null,
    })
  });
  test('element with children', () => {
    expect(h('ul', null, [
      h('li'),
      h('li')
    ])).toEqual({
      tag: 'ul',
      _isNode: true,
      data: null,
      children: [{
        ...h('li'),
        key: '|0'
      }, {
        ...h('li'),
        key: '|1'
      }],
      flags: VNodeFlags.ELEMENT_HTML,
      childFlags: ChildrenFlags.KEYED_VNODES,
      el: null,
    });
  });
  test('protal', () => {
    expect(h(
      Portal,
      {
        target: '#box'
      },
      h('h1')
    )).toEqual({
      flags: VNodeFlags.PORTAL,
      tag: '#box',
      _isNode: true,
      data: { target: '#box' },
      children: h('h1'),
      childFlags: ChildrenFlags.SINGLE_VNODE,
      el: null,
    });
  });
  test('fragment', () => {
    expect(h(Fragment, null, [
      h('span', null, '我是标题1......'),
      h('span', null, '我是标题2......')
    ])).toEqual({
      flags: VNodeFlags.FRAGMENT,
      tag: Fragment,
      _isNode: true,
      data: null,
      children: [
        {
          ...h('span', null, '我是标题1......'),
          key: '|0',
        },
        {
          ...h('span', null, '我是标题2......'),
          key: '|1',
        },
      ],
      childFlags: ChildrenFlags.KEYED_VNODES,
      el: null,
    });
  });
  test('function', () => {
    expect(h(func, null, null)).toEqual({
      tag: func,
      flags: VNodeFlags.COMPONENT_FUNCTIONAL,
      _isNode: true,
      data: null,
      children: null,
      childFlags: ChildrenFlags.NO_CHILDREN,
      el: null,
    });
  });
  test('class', () => {
    class test {
      render() {
        return h('h1');
      }
    }
    expect(h(test)).toEqual({
      tag: test,
      flags: VNodeFlags.COMPONENT_STATEFUL_NORMAL,
      _isNode: true,
      data: null,
      children: null,
      childFlags: ChildrenFlags.NO_CHILDREN,
      el: null,
    });
  });
  test('multi component', () => {
    class test {
      render() {
        return h('h1');
      }
    }
    let com1 = h(test);
    let com2 = h(func);
    let com3 = h(Portal, {
        target: '#box'
      },
      h('h1'));
    let com4 = h(Fragment, null, [
      h('span', null, '我是标题1......'),
      h('span', null, '我是标题2......')
    ]);
    expect(h('div', { list: [1,2,3], style: {color: 'red'}}, [com1, com2, com3, com4])).toEqual({
      tag: 'div',
      _isNode: true,
      flags: VNodeFlags.ELEMENT_HTML,
      data: { list: [1, 2, 3], style: { color: 'red' } },
      el: null,
      childFlags: ChildrenFlags.KEYED_VNODES,
      children: [{
        tag: test,
        flags: VNodeFlags.COMPONENT_STATEFUL_NORMAL,
        _isNode: true,
        data: null,
        children: null,
        childFlags: ChildrenFlags.NO_CHILDREN,
        el: null,
        key: '|0'
      }, {
        tag: func,
          flags: VNodeFlags.COMPONENT_FUNCTIONAL,
          _isNode: true,
          data: null,
          children: null,
          childFlags: ChildrenFlags.NO_CHILDREN,
          el: null,
          key: '|1'
        }, {
          flags: VNodeFlags.PORTAL,
          tag: '#box',
          _isNode: true,
          data: { target: '#box' },
          children: h('h1'),
          childFlags: ChildrenFlags.SINGLE_VNODE,
          el: null,
          key: '|2'
        }, {
          flags: VNodeFlags.FRAGMENT,
          tag: Fragment,
          _isNode: true,
          data: null,
          children: [
            {
              ...h('span', null, '我是标题1......'),
              key: '|0',
            },
            {
              ...h('span', null, '我是标题2......'),
              key: '|1',
            },
          ],
          childFlags: ChildrenFlags.KEYED_VNODES,
          el: null,
          key: '|3'
        }]
    });
  });
});