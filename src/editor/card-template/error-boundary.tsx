import React from "react";

interface Props {
  title?: string;
  children: React.ReactNode;
}

interface State {
  error?: Error;
}

/**
 * 卡片级错误边界：内部异常只影响卡片占位区域，不拖垮整页
 */
export default class CardErrorBoundary extends React.Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          卡片「{this.props.title ?? "未命名"}」渲染失败：{this.state.error.message}
        </div>
      );
    }

    return this.props.children;
  }
}
