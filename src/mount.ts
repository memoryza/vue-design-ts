import { domPropsRE, createTextVNode, patchData } from './util';
import { VNodeFlags, ChildrenFlags } from './enum';
import { patch } from './patch';


const mountElement = (vnode: VNode, container: HTMLElement, isSVG?: boolean): void => {
  const isSvg: boolean = vnode.flags & VNodeFlags.ELEMENT_SVG ? true : false;
  const el: any = isSvg ? document.createElementNS('http://www.w3.org/2000/svg', vnode.tag)
    : document.createElement(vnode.tag)
  vnode.el = el;
  const data: any = vnode.data;
  if (data) {
    for (let key in data) {
      patchData(el, key, null, data[key]);
    }
  }
  const { childFlags, children } = vnode;
  if (childFlags && childFlags !== ChildrenFlags.NO_CHILDREN) {
    if (childFlags & ChildrenFlags.SINGLE_VNODE) {
      mount(children, el, isSvg);
    } else if (childFlags & ChildrenFlags.KEYED_VNODES) {
      children.forEach((childVnode: VNode) => {
        mount(childVnode, el, isSvg)
      });
    }
  }
  container.appendChild(el);
}

const mountFragment = (vnode: VNode, container: HTMLElement, isSVG?: boolean): void => {
  let { children, childFlags } = vnode;
  if (childFlags & ChildrenFlags.SINGLE_VNODE) {
    mount(children, container, isSVG);
    vnode.el = children.el;
  } else if (childFlags & ChildrenFlags.KEYED_VNODES) {
    // 多个子节点，遍历挂载之
    for (let i = 0; i < children.length; i++) {
      mount(children[i], container, isSVG);
    }
    vnode.el = children[0].el;
  } else {
    // 如果没有子节点，等价于挂载空片段，会创建一个空的文本节点占位
    const placeholder = createTextVNode('');
    mountText(placeholder, container);
    vnode.el = placeholder.el;
  }
}

const mountText = (vnode: VNode, container: HTMLElement): Text => {
  const el = document.createTextNode(vnode.children);
  vnode.el = el;
  return container.appendChild(el);
}


const mountPortal = (vnode: VNode, container: HTMLElement): void => {
  let { children, tag } = vnode;
  const target: HTMLElement = typeof tag === 'string' ? document.querySelector(tag) : tag;
  if (Array.isArray(children)) {
    children.forEach(child => {
      mount(child, target);
    });
  } else {
    mount(children, target);
  }
  // 占位的空文本节点
  const placeholder: VNode = createTextVNode('')
  // 将该节点挂载到 container 中
  mountText(placeholder, container)
  // el 属性引用该节点
  vnode.el = placeholder.el;
}
const mountComponent = (vnode: VNode, container: HTMLElement, isSVG?: boolean): void =>  {
  if (vnode.flags & VNodeFlags.COMPONENT_STATEFUL) {
    mountStatefulComponent(vnode, container, isSVG);
  } else {
    mountFunctionalComponent(vnode, container, isSVG);
  }
}
const mountStatefulComponent = (vnode: VNode, container: HTMLElement, isSVG?: boolean): void => {
  const instance: StatefulComponentProps = new vnode.tag();
  instance.$props = vnode.data;
  instance._update = () => {
    if (instance._mounted) {
      // 1、拿到旧的 VNode
      const prevVNode = instance.$vnode;
      // 2、重渲染新的 VNode
      const nextVNode = (instance.$vnode = instance.render());
      // 3、patch 更新
      patch(prevVNode, nextVNode, prevVNode.el.parentNode);
      // 4、更新 vnode.el 和 $el
      instance.$el = vnode.el = instance.$vnode.el;
    } else {
      instance.$vnode = instance.render();
      mount(instance.$vnode, container, isSVG);
      instance._mounted = true;
      instance.$el = vnode.el = instance.$vnode.el;
      instance.mounted && instance.mounted();
    }
  }
  instance._update();
  vnode.children = instance;
}
const mountFunctionalComponent = (vnode: VNode, container: HTMLElement, isSVG?: boolean): void => {
  // 在函数式组件类型的 vnode 上添加 handle 属性，它是一个对象
  vnode.handle = {
    prev: null,
    next: vnode,
    container,
    update: () => {
      if (vnode.handle.prev) {
        const { prev, next, container } = vnode.handle;
        const $vnode: VNode = (vnode.children = vnode.tag(next.data)); // 组件产出的新的 VNode
        patch(prev.children, $vnode, container);
      } else {
        const $vnode: VNode = (vnode.children = vnode.tag(vnode.data))
        mount($vnode, container, isSVG)
        vnode.el = $vnode.el
      }
    }
  }
  vnode.handle.update()
}

export const mount = (vnode: VNode, container: any, isSVG?: boolean): void => {
  const { flags } = vnode;
  if (flags & VNodeFlags.ELEMENT) {
    mountElement(vnode, container, isSVG);
  } else if (flags & VNodeFlags.COMPONENT) {
    mountComponent(vnode, container, isSVG);
  } else if (flags & VNodeFlags.TEXT) {
    mountText(vnode, container);
  } else if (flags & VNodeFlags.FRAGMENT) {
    mountFragment(vnode, container, isSVG);
  } else if (flags & VNodeFlags.PORTAL) {
    mountPortal(vnode, container);
  }
}

