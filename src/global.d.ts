import { VNodeFlags, ChildrenFlags } from './enum';

declare global {
  interface VNode {
    _isNode: boolean;
    tag: any; // 挂载组件类型
    children: any; // 子元素 ( class | function 则是实例后的组件引用)
    flags: VNodeFlags; // 挂载组件类型
    childFlags: ChildrenFlags;  // 挂载子组件类型
    data?: any; // 组件属性
    el?: any; // 挂载到文档中的元素引用
    key?: any;
    handle?: {
      prev: VNode;
      next: VNode;
      container: HTMLElement;
      update: () => void;
    };
  }
  interface HTMLElement {
    el?: VNode;
  }
  interface StatefulComponentProps {
    render: () => VNode;
    [key: string]: any;
  }
}

export {}