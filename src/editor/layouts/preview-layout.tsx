import ProdStage from "./stage/prod";
import PreviewToolbar from "./toolbar/preview";

interface PreviewLayoutProps {
  pageId?: string;
  pageName?: string;
  fromEdit?: boolean;
}

/**
 * 预览态布局：只依赖运行时 store，不加载侧边栏、属性面板与设计态 store
 */
const PreviewLayout: React.FC<PreviewLayoutProps> = ({ pageId, pageName, fromEdit }) => {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <PreviewToolbar pageId={pageId} pageName={pageName} fromEdit={fromEdit} />
      <div className="min-h-0 flex-1 overflow-auto">
        <ProdStage />
      </div>
    </div>
  );
};

export default PreviewLayout;
