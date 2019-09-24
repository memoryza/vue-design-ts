import { VNodeFlags, ChildrenFlags } from "./enum";
import { mount } from './mount';
import { patchData } from './util';

const replaceVNode = (prevNode: VNode, vnode: VNode, container: HTMLElement): void => {
  container.removeChild(prevNode.el);
  if (prevNode.flags & VNodeFlags.COMPONENT_STATEFUL_NORMAL) {
    const instance = prevNode.children;
    instance && instance.unmounted && instance.unmounted();
  }
  mount(vnode, container);
}

const patchChildren = (prevChildFlags: ChildrenFlags, nextChildFlags: ChildrenFlags, prevChildren: VNode[] | VNode | null, nextChildren: VNode[] | VNode | null, container: HTMLElement ): void => {
  switch (prevChildFlags) {
    case ChildrenFlags.SINGLE_VNODE:
      switch (nextChildFlags) {
        case ChildrenFlags.SINGLE_VNODE:
          patch(<VNode>prevChildren, <VNode>nextChildren, container)
          break;
        case ChildrenFlags.NO_CHILDREN:
          container.removeChild((<VNode>prevChildren).el);
          break;
        default:
          container.removeChild((<VNode>prevChildren).el);
          for(let i = 0; i < (<VNode[]>nextChildren).length; i++) {
            mount(nextChildren[i], container);
          }
          break;
      }
      break;
    case ChildrenFlags.NO_CHILDREN:
      switch (nextChildFlags) {
        case ChildrenFlags.SINGLE_VNODE:
          mount(<VNode>nextChildren, container);
          break;
        case ChildrenFlags.NO_CHILDREN:
          break;
        default:
          for (let i = 0; i < (<VNode[]>nextChildren).length; i++) {
            mount(nextChildren[i], container);
          }
          break;
      }
      break;
    default:
      switch (nextChildFlags) {
        case ChildrenFlags.SINGLE_VNODE:
          for (let i = 0; i < (<VNode[]>prevChildren).length; i++) {
            container.removeChild(prevChildren[i]);
          }
          mount(<VNode>nextChildren, container);
          break;
        case ChildrenFlags.NO_CHILDREN:
          for (let i = 0; i < (<VNode[]>prevChildren).length; i++) {
            container.removeChild(prevChildren[i]);
          }
          break;
        default:
          let lastIndex: number = 0;
          let find: boolean = false;
          // 遍历新的 children
          for (let i: number = 0; i < (<VNode[]>nextChildren).length; i++) {
            const nextVNode: VNode = nextChildren[i];
            let j: number = 0;
            // 遍历旧的 children
            for (j; j < (<VNode[]>prevChildren).length; j++) {
              const prevVNode: VNode = prevChildren[j];
              // 如果找到了具有相同 key 值的两个节点，则调用 `patch` 函数更新之
              if (nextVNode.key === prevVNode.key) {
                find = true;
                patch(prevVNode, nextVNode, container);
                if (j >= lastIndex) {
                  lastIndex = j
                } else {
                  // 需要移动
                  // refNode 是为了下面调用 insertBefore 函数准备的
                  const refNode = nextChildren[i - 1].el.nextSibling;
                  // 调用 insertBefore 函数移动 DOM
                  container.insertBefore(prevVNode.el, refNode);
                }
                break;
              }
            }
            if (!find) {
              const refNode = i - 1 < 0 ? prevChildren[0].el : nextChildren[i - 1].el.nextSibling;
              mount(nextVNode, container, false, refNode)
            }
            // 遍历旧的节点
            for (let i = 0; i < (<VNode[]>prevChildren).length; i++) {
              const prevVNode = prevChildren[i];
              // 拿着旧 VNode 去新 children 中寻找相同的节点
              const has = (<VNode[]>nextChildren).filter(
                nextVNode => nextVNode.key === prevVNode.key
              )
              if (!has) {
                // 如果没有找到相同的节点，则移除
                container.removeChild(prevVNode.el);
              }
            }
          }
          break;
      }
      break;
  }
}
const patchElement = (prevNode: VNode, vnode: VNode, container: HTMLElement): void => {
  if (prevNode.tag !== vnode.tag) {
    return replaceVNode(prevNode, vnode, container);
  }
  const el = (vnode.el = prevNode.el);
  const keys = new Set(Object.keys(prevNode.data || {}).concat(Object.keys(vnode.data || {})));
  for (let key of keys) {
    const prevVal = prevNode.data && prevNode.data[key];
    const nextVal = vnode.data && vnode.data[key];
    patchData(el, key, prevVal, nextVal);
  }
  patchChildren(prevNode.childFlags,
    vnode.childFlags,
    prevNode.children,
    vnode.children,
    el
  );
}
const patchCompoent = (prevNode: VNode, vnode: VNode, container: HTMLElement): void => {
  if (prevNode.tag !== vnode.tag) {
    replaceVNode(prevNode, vnode, container);
  } else if (vnode.flags & VNodeFlags.COMPONENT_STATEFUL_NORMAL) {
    const instance = (vnode.children = prevNode.children);
    instance.$props = vnode.data;
    instance._update();
  } else {
    const handle = (vnode.handle = prevNode.handle);
    handle.prev = prevNode;
    handle.next = vnode;
    handle.container = container;
    handle.update();
  }
}
const patchFragment = (prevNode: VNode, vnode: VNode, container: HTMLElement): void => {
  patchChildren(prevNode.childFlags, vnode.childFlags, prevNode, vnode, container);
  switch (vnode.childFlags) {
    case ChildrenFlags.SINGLE_VNODE:
      vnode.el = vnode.children.el
      break
    case ChildrenFlags.NO_CHILDREN:
      vnode.el = prevNode.el
      break
    default:
      vnode.el = vnode.children[0].el
  }
}
const patchPortal = (prevNode: VNode, vnode: VNode): void => {
  if (prevNode.tag != vnode.tag) {
    const container = typeof prevNode.tag === 'string'
        ? document.querySelector(prevNode.tag)
        : prevNode.tag;
    switch (prevNode.childFlags) {
      case ChildrenFlags.SINGLE_VNODE:
        container.removeChild(prevNode.children.el)
        break
      case ChildrenFlags.KEYED_VNODES:
        for (let i = 0; i < prevNode.children.length; i++) {
          container.removeChild(prevNode.children[i].el)
        }
        break
      default:
        break
    }
    mount(vnode, container);
  } else {
    patchChildren(prevNode.childFlags, vnode.childFlags, prevNode, vnode, prevNode.el);
    vnode.el = prevNode.el;
  }
}
const patchText = (prevNode: VNode, vnode: VNode, container: HTMLElement): void => {
  const el = (vnode.el = prevNode.el)
  if (vnode.children !== prevNode.children) {
    el.nodeValue = vnode.children
  }
}
export const patch = (prevNode: VNode, vnode: VNode, container: HTMLElement): void => {
  let prevFlags: VNodeFlags = prevNode.flags;
  let nextFlags: VNodeFlags = vnode.flags;
  if (prevFlags !== nextFlags) {
    replaceVNode(prevNode, vnode, container);
  } else if (nextFlags & VNodeFlags.ELEMENT) {
    patchElement(prevNode, vnode, container);
  } else if (nextFlags & VNodeFlags.COMPONENT) {
    patchCompoent(prevNode, vnode, container);
  } else if (nextFlags & VNodeFlags.FRAGMENT) {
    patchFragment(prevNode, vnode, container);
  } else if (nextFlags & VNodeFlags.PORTAL) {
    patchPortal(prevNode, vnode);
  } else if (nextFlags & VNodeFlags.TEXT) {
    patchText(prevNode, vnode, container);
  }
}