import { VNodeFlags, ChildrenFlags } from './enum';
import { Fragment, Portal, normalizeVNodes, createTextVNode } from './util';
export { Portal, Fragment };

export const h = (tag: any, data: any = null, children: any = null): VNode => {
  let flags: VNodeFlags = null;
  if (typeof tag === 'string') {
    flags = tag === 'svg' ? VNodeFlags.ELEMENT_SVG : VNodeFlags.ELEMENT_HTML;
  } else if (tag === Fragment) {
    flags = VNodeFlags.FRAGMENT;
  } else if (tag === Portal) {
    flags = VNodeFlags.PORTAL;
    tag = data && data.target;
  } else {
    // 兼容 Vue2 的对象式组件
    if (tag !== null && typeof tag === 'object') {
      flags = tag.functional
        ? VNodeFlags.COMPONENT_FUNCTIONAL       // 函数式组件
        : VNodeFlags.COMPONENT_STATEFUL_NORMAL  // 有状态组件
    } else if (typeof tag === 'function') {
      // Vue3 的类组件
      flags = tag.prototype && tag.prototype.render
        ? VNodeFlags.COMPONENT_STATEFUL_NORMAL  // 有状态组件
        : VNodeFlags.COMPONENT_FUNCTIONAL       // 函数式组件
    }
  }
  let childFlags: ChildrenFlags = null;
  if (Array.isArray(children)) {
    if (children.length === 0) {
      childFlags = ChildrenFlags.NO_CHILDREN;
    } else if (children.length === 1) {
      childFlags = ChildrenFlags.SINGLE_VNODE;
      children = children[0];
    } else {
      childFlags = ChildrenFlags.KEYED_VNODES;
      children = normalizeVNodes(children)
    }
  } else if (children == null) {
    childFlags = ChildrenFlags.NO_CHILDREN;
  } else if (children._isNode) {
    childFlags = ChildrenFlags.SINGLE_VNODE;
  } else {
    childFlags = ChildrenFlags.SINGLE_VNODE;
    children = createTextVNode(children + '');
  }
  if (data && data.class) {
    let className: string[] = [];
    if (Array.isArray(data.class)) {
      data.class.forEach((cls: any) => {
        if (typeof cls === 'string') {
          className.push(cls)
        } else if (Array.isArray(cls)) {
          className = className.concat(cls);
        } else if (typeof cls === 'object') {
          Object.keys(cls).forEach(key => {
            if (cls[key]) {
              className.push(key);
            }
          });
        }
      });
    } else if (typeof data.class === 'string') {
      className.push(data.class);
    }
    data.class = className.join(' ');
  }
  return {
    key: data && data.key ? data.key : null,
    _isNode: true,
    tag,
    data,
    children,
    flags,
    childFlags,
    el: null,
  }
}