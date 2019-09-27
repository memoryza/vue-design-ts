import { VNodeFlags, ChildrenFlags } from "./enum";
import { mount } from './mount';
import { patchData } from './util';

const replaceVNode = (prevNode: VNode, vnode: VNode, container: HTMLElement): void => {
  container.removeChild(prevNode.el);
  if (prevNode.flags & VNodeFlags.COMPONENT_STATEFUL_NORMAL) {
    const instance: any = prevNode.children;
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
          for(let i: number = 0; i < (<VNode[]>nextChildren).length; i++) {
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
          for (let i: number = 0; i < (<VNode[]>nextChildren).length; i++) {
            mount(nextChildren[i], container);
          }
          break;
      }
      break;
    default:
      switch (nextChildFlags) {
        case ChildrenFlags.SINGLE_VNODE:
          for (let i: number = 0; i < (<VNode[]>prevChildren).length; i++) {
            container.removeChild(prevChildren[i]);
          }
          mount(<VNode>nextChildren, container);
          break;
        case ChildrenFlags.NO_CHILDREN:
          for (let i: number = 0; i < (<VNode[]>prevChildren).length; i++) {
            container.removeChild(prevChildren[i]);
          }
          break;
        default:
          let oldStartIdx: number = 0;
          let oldEndIdx: number = (<VNode[]>prevChildren).length - 1;
          let newStartIdx: number = 0;
          let newEndIdx: number = (<VNode[]>nextChildren).length - 1;
          let oldStartVNode: VNode = prevChildren[oldStartIdx];
          let oldEndVNode: VNode = prevChildren[oldEndIdx];
          let newStartVNode: VNode = nextChildren[newStartIdx];
          let newEndVNode: VNode = nextChildren[newEndIdx];
          while(newStartIdx <= newEndIdx && oldStartIdx <= oldEndIdx) {
            if (!oldStartVNode) {
              oldStartVNode = prevChildren[++oldStartIdx];
            } else if (!oldEndVNode) {
              oldEndVNode = prevChildren[--oldEndIdx];
            } else if (oldStartVNode.key === newStartVNode.key) {
              patch(oldStartVNode, newStartVNode, container);
              oldStartVNode = prevChildren[++oldStartIdx];
              newStartVNode = nextChildren[++newStartIdx];
            } else if (oldEndVNode.key === newEndVNode.key) {
              patch(oldEndVNode, newEndVNode, container);
              oldEndVNode = prevChildren[--oldEndIdx];
              newEndVNode = newEndVNode[--newEndIdx];
            } else if (oldStartVNode.key === newEndVNode.key) {
              patch(oldStartVNode, newEndVNode, container);
              // 将 oldStartVNode.el 移动到 oldEndVNode.el 的后面，也就是 oldEndVNode.el.nextSibling 的前面
              container.insertBefore(oldStartVNode.el, oldEndVNode.el.nextSibling);
              oldStartVNode = prevChildren[++oldStartIdx];
              newEndVNode = nextChildren[--newEndIdx];
            } else if (oldEndVNode.key === newStartVNode.key) {
              patch(oldEndVNode, newStartVNode, container);
              container.insertBefore(oldEndVNode.el, oldStartVNode.el);
              oldEndVNode = prevChildren[--oldEndIdx];
              newStartVNode = nextChildren[++newStartIdx];
            } else {
              const idxInOld: number = (<VNode[]>prevChildren).findIndex(node => node.key === newStartVNode.key);
              if (idxInOld >= 0) {
                const vnodeToMove: VNode = prevChildren[idxInOld];
                patch(vnodeToMove, newStartVNode, container);
                container.insertBefore(vnodeToMove.el, oldStartVNode.el)
                prevChildren[idxInOld] = undefined;
              } else {
                mount(newStartVNode, container, false, oldStartVNode.el);
              }
              newStartVNode = nextChildren[++newStartIdx];
            }
          }
          // 旧的集合里没有，但是双端比较已经结束，需要将新的挂载
          if (oldEndIdx < oldStartIdx) {
            for (let i:number = newStartIdx; i <= newEndIdx; i++) {
              mount(nextChildren[i], container, false, oldStartVNode.el);
            }
          } else if (newEndIdx < newStartIdx ){
            // 新的集合里没有，但是双端比较已经结束，需要将旧的删除
            for (let i = oldStartIdx; i <= oldEndIdx; i++) {
              container.removeChild(prevChildren[i].el);
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
  const el: HTMLElement = (vnode.el = prevNode.el);
  const keys: Set<string> = new Set(Object.keys(prevNode.data || {}).concat(Object.keys(vnode.data || {})));
  for (let key of keys) {
    const prevVal: any = prevNode.data && prevNode.data[key];
    const nextVal: any = vnode.data && vnode.data[key];
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
    const instance: any = (vnode.children = prevNode.children);
    instance.$props = vnode.data;
    instance._update();
  } else {
    const handle: HandleProps = (vnode.handle = prevNode.handle);
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
    const container: HTMLElement = typeof prevNode.tag === 'string'
        ? document.querySelector(prevNode.tag)
        : prevNode.tag;
    switch (prevNode.childFlags) {
      case ChildrenFlags.SINGLE_VNODE:
        container.removeChild(prevNode.children.el)
        break
      case ChildrenFlags.KEYED_VNODES:
        for (let i: number = 0; i < prevNode.children.length; i++) {
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
  const el: HTMLElement = (vnode.el = prevNode.el)
  if (vnode.children !== prevNode.children) {
    el.innerText = vnode.children
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