
import { mount } from './mount';
import { patch } from './patch';

export const render = (vnode: VNode, container: any): void => {
  const prevNode: VNode = container.vnode;
  if (prevNode == null) {
    if (vnode) {
      mount(vnode, container);
      container.vnode = vnode;
    }
  } else {
    if (vnode) {
      patch(prevNode, vnode, container);
      container.vnode = vnode;
    } else {
      container.removeChild(prevNode.el);
      container.vnode = null;
    }
  }
}

