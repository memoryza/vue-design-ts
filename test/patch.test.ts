/**
 * patch function test case
 */
import { h } from '../src/index';
import {  ChildrenFlags } from '../src/enum';
import { patch } from '../src/patch';
import { mount } from '../src/mount';
describe('patch function test', () => {
  test('vnode data update', () => {
    const prevVNode = h('div', {
      style: {
        width: '100px',
        height: '100px',
        backgroundColor: 'red'
      }
    });
    const nextVNode = h('div', {
      style: {
        width: '100px',
        height: '100px',
        border: '1px solid green'
      }
    });
    mount(prevVNode, document.body);
    expect(prevVNode.el.style.backgroundColor).toBe('red');
    mount(nextVNode, document.body);
    patch(prevVNode, nextVNode, document.body);
    expect(prevVNode.el.style.border).toBe('1px solid green');
    expect(prevVNode.el.style.backgroundColor).toBe('');
    expect(prevVNode.el.style.width).toBe('100px');
  });
  test('patch element', () => {
    let body = document.body;
    const prevVNode = h('div', null, h('p', null, '只有一个子节点'))
    const nextVNode = h('div', null, [
      h('p', null, '子节点 1'),
      h('p', null, '子节点 2')
    ])
    mount(prevVNode, body);
    expect(prevVNode.childFlags).toBe(ChildrenFlags.SINGLE_VNODE);
    patch(prevVNode, nextVNode, body);
    expect(nextVNode.childFlags).toBe(ChildrenFlags.KEYED_VNODES);
    expect(nextVNode.el.children.length).toBe(2);
  });
  test('class component update props', async () => {
    // 子组件类
    class ChildComponent {
      $props: any;
      render() {
        // 子组件中访问外部状态：this.$props.text
        return h('div', null, this.$props.text)
      }
    }
    // 父组件类
    class ParentComponent {
      localState = 'one'
      mounted() {
        // 1秒钟后将 localState 的值修改为 'two'
        setTimeout(() => {
          this.localState = 'two';
          this._update();
        }, 1000);
      }
      _update() {
        throw new Error("Method not implemented.");
      }
      render() {
        return h(ChildComponent, {
          // 父组件向子组件传递的 props
          text: this.localState
        })
      }
    }

    // 有状态组件 VNode
    const compVNode = h(ParentComponent);
    mount(compVNode, document.body);
    expect(compVNode.children.localState === compVNode.children.$vnode.data.text).toBeTruthy();
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(compVNode.children.localState).toBe('two');
        expect(compVNode.children.$vnode.data.text).toBe('two');
        resolve();
      }, 1100);
    });
  });
  test('function component update props', async () => {
    // 子组件类
    function ChildComponent(props: any) {
      return h('div', null, props.text)
    }
    // 父组件类
    class ParentComponent {
      localState = 'one'
      mounted() {
        // 1秒钟后将 localState 的值修改为 'two'
        setTimeout(() => {
          this.localState = 'two';
          this._update();
        }, 1000);
      }
      _update() {
        throw new Error("Method not implemented.");
      }
      render() {
        return h(ChildComponent, {
          // 父组件向子组件传递的 props
          text: this.localState
        })
      }
    }

    // 有状态组件 VNode
    const compVNode = h(ParentComponent);
    mount(compVNode, document.body);
    expect(compVNode.children.localState).toBe('one');
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(compVNode.children.localState).toBe('two');
        resolve();
      }, 1100);
    });
  });
});
