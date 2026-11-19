import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { useDataSourceFields } from "../data-source/hooks";
import { findNearestLoop, getLoopScopeName, getLoopSourceId } from "../loop/scope";
import { useComponetsStore } from "../stores/components";
import { useVariablesStore } from "../stores/variable";

interface Props {
  open: boolean;
  onCancel: () => void;
  onSelect: (record: any) => void;
}

const columns = [
  {
    title: "变量名",
    dataIndex: "name",
  },
  {
    title: "变量值",
    dataIndex: "defaultValue",
  },
  {
    title: "备注",
    dataIndex: "remark",
  },
];

const SelectVariableModal: React.FC<Props> = ({ open, onCancel, onSelect }) => {
  const { variables } = useVariablesStore();
  const { curComponentId, components } = useComponetsStore();

  // 选中组件位于循环容器内时，追加「当前行字段」变量
  const loop = useMemo(
    () => findNearestLoop(curComponentId, components),
    [curComponentId, components],
  );
  const loopSourceId = loop ? getLoopSourceId(loop) : undefined;
  const loopFields = useDataSourceFields(loopSourceId);

  const records = useMemo(() => {
    if (!loop || !loopSourceId) return variables;

    const scopeName = getLoopScopeName(loop);
    const rowVariables = loopFields.map((field) => ({
      name: `${scopeName}.${field.dataKey}`,
      defaultValue: "当前行",
      remark: `循环行字段 · ${field.label}`,
    }));

    return [...rowVariables, ...variables];
  }, [loop, loopFields, loopSourceId, variables]);

  function rowSelect(record: any) {
    onSelect(record);
    onCancel();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>选择变量</DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.dataIndex}>{column.title}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length ? (
              records.map((record) => (
                <TableRow
                  key={record.name}
                  className="cursor-pointer"
                  onClick={() => {
                    rowSelect(record);
                  }}
                >
                  {columns.map((column) => (
                    <TableCell key={column.dataIndex}>
                      {(record as any)[column.dataIndex]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                  暂无变量
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
};

export default SelectVariableModal;
