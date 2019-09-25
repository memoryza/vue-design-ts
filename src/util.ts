import { VNodeFlags, ChildrenFlags } from './enum';

export const Fragment: Symbol = Symbol();
export const Portal: Symbol = Symbol();
export const domPropsRE: RegExp = /\[A-Z]|^(?:value|checked|selected|muted)$/;

export const normalizeVNodes = (children: VNode[]): VNode[] => {
  let newChildren: VNode[] = [];
  for (let i: number = 0; i < children.length; i++) {
    let child: VNode = children[i];
    if (child.key == null) {
      child.key = '|' + i;
    }
    newChildren.push(child);
  }
  return newChildren;
}
export const createTextVNode = (child: string): VNode => {
  return {
    _isNode: true,
    tag: null,
    data: null,
    children: child,
    flags: VNodeFlags.TEXT,
    childFlags: ChildrenFlags.NO_CHILDREN,
    el: null
  }
}
/**
 * 更新vnode的数据
 * @param el 元素
 * @param key key
 * @param prevVal 上一次vdom key对应的值
 * @param nextVal 新的vdom对应的key的值
 */
export const patchData = (el: HTMLElement, key: string, prevVal: any, nextVal: any): void => {
  switch (key) {
    case 'style':
      for (let k in nextVal) {
        el.style[k] = nextVal[k];
      }
      for (let k in prevVal) {
        if (!nextVal || !nextVal.hasOwnProperty(k)) {
          el.style[k] = '';
        }
      }
      break;
    case 'class':
      el.className = nextVal;
      break;
    default:
      if (key.slice(0, 2) == 'on') {
        if (prevVal) {
          el.removeEventListener(key.slice(2), prevVal);
        }
        if (nextVal) {
          el.addEventListener(key.slice(2), nextVal, false);
        }
      } else if (domPropsRE.test(key)) {
        // 当作 DOM Prop 处理
        el[key] = nextVal;
      } else {
        // 当作 Attr 处理
        el.setAttribute(key, nextVal);
      }
      break;
  }
}
