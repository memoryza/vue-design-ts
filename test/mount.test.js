/**
 * patch function test case
 */
import { h } from '../src/index';
import { VNodeFlags } from '../src/enum';
import { mount } from '../src/mount';
describe('mount function test', () => {
  test('mount sample element', () => {
    const sample = h('div');
    mount(sample, document.body);
    expect(sample.el.tagName).toBe('DIV');
  });
  test('mount attribute element', () => {
    const sample = h('div', {style:{color: 'red'}, height: '100px', 'data-x': 100});
    mount(sample, document.body);
    expect(sample.el.tagName).toBe('DIV');
    expect(sample.el.style.color).toBe('red');
    expect(sample.el.getAttribute('height')).toBe('100px');
    expect(sample.el.children.length).toBe(0);
    expect(sample.el.getAttribute('data-x')).toBe('100');
    expect(sample.el.getAttribute('data-x')).toBe('100');
  });
  test('mount element have children', () => {
    const sample = h('div', { style: { color: 'red' }, height: '100px', 'data-x': 100 }, [h('div'), h('span')]);
    mount(sample, document.body);
    expect(sample.el.children.length).toBe(2);
    const sampleSingleChildren = h('div', { style: { color: 'red' }, height: '100px', 'data-x': 100 }, "我是测试");
    mount(sampleSingleChildren, document.body);
    expect(sampleSingleChildren.el.innerHTML).toBe("我是测试");
  });
  test('mount component', () => {
    // 子组件类
    class ChildComponent {
      render() {
        // 子组件中访问外部状态：this.$props.text
        return h('div', null, this.$props.text)
      }
    }
    // 父组件类
    class ParentComponent {
      localState = 'one'

      render() {
        return h(ChildComponent, {
          // 父组件向子组件传递的 props
          text: this.localState
        })
      }
    }

    // 有状态组件 VNode
    const compVNode = h(ParentComponent)
    mount(compVNode, document.body);
    expect(compVNode.flags & VNodeFlags.COMPONENT_STATEFUL).toBeTruthy();
    const comp = new compVNode.tag()
    expect(comp.localState).toBe('one');
  })
});
