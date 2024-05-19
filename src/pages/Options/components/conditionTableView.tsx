import React, { useEffect, useState } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Card, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import './conditionTableView.scss';
import { loadQueryConditions, QueryCondition } from '../../store';

interface ConditionTemplate {
  key: string;
  label: string;
  value: string;
}

const columns: ColumnsType<ConditionTemplate> = [
  {
    title: 'Title',
    dataIndex: 'label',
  },
  {
    title: 'Template',
    dataIndex: 'value',
  },
  {
    title: 'Action',
    key: 'action',
    render: (_, record) => (
      <Space size="middle">
        <a>Edit</a>
        <a>Delete</a>
      </Space>
    ),
  },
];

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': string;
}

const Row = (props: RowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props['data-row-key'],
  });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    cursor: 'move',
    ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
  };

  return (
    <tr
      {...props}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    />
  );
};

const ConditionTableView: React.FC = () => {
  const [conditions, setConditions] = useState<ConditionTemplate[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    })
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setConditions((prev) => {
        const activeIndex = prev.findIndex((i) => i.key === active.id);
        const overIndex = prev.findIndex((i) => i.key === over?.id);
        return arrayMove(prev, activeIndex, overIndex);
      });
    }
  };

  useEffect(() => {
    loadQueryConditions().then((data: QueryCondition[]) => {
      setConditions(
        data.map((option: QueryCondition, index: number) => {
          return {
            key: (index + 1).toString(),
            ...option,
          };
        })
      );
    });
  }, []);

  return (
    <Card
      title="🌈 Condition Template"
      bordered={false}
      className={'conditionTableViewWrapper'}
    >
      <div className={'operationBar'}>
        <Button type="primary" className={'addButton'}>
          Create
        </Button>
        <Button className={'importButton'}>Import in YAML</Button>
        <Button className={'exportButton'}>Export as YAML</Button>
      </div>
      <DndContext
        sensors={sensors}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={conditions.map((i) => i.key)}
          strategy={verticalListSortingStrategy}
        >
          <Table
            components={{
              body: {
                row: Row,
              },
            }}
            rowKey="key"
            columns={columns}
            dataSource={conditions}
          />
        </SortableContext>
      </DndContext>
    </Card>
  );
};

export default ConditionTableView;
