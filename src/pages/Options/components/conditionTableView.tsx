import React, { useEffect, useRef, useState } from 'react';
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
import { Button, Card, message, Popconfirm, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import './conditionTableView.scss';
import {
  loadQueryConditions,
  QueryCondition,
  saveQueryConditions,
} from '../../store';
import QueryConditionTemplateDialog from './queryConditionTemplateDialog';

export interface ConditionTemplate {
  key: string;
  label: string;
  value: string;
}

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
  const [creatDialogVisible, setCreatDialogVisible] = useState<boolean>(false);
  const [editDialogVisible, setEditDialogVisible] = useState<boolean>(false);
  const [editingConditionTemplate, setEditingConditionTemplate] =
    useState<ConditionTemplate>();
  const isInitialMount = useRef(true);
  const [messageApi, contextHolder] = message.useMessage();

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
      isInitialMount.current = true;
    });
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      console.log('conditions changed!');
      saveQueryConditions(
        conditions.map((condition: ConditionTemplate) => ({
          label: condition.label,
          value: condition.value,
        }))
      ).then((result) => console.log('save query condition result:', result));
    }
  }, [conditions]);

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
          <a
            onClick={() => {
              setEditDialogVisible(true);
              setEditingConditionTemplate(record);
            }}
          >
            Edit
          </a>
          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => handleDelete(record.key)}
          >
            <a>Delete</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleDelete = (key: string) => {
    const conditionTemplates = conditions.filter((item) => item.key !== key);
    setConditions(conditionTemplates);
  };

  const handleCreate = (template: any) => {
    const newConditions = [
      ...conditions,
      {
        key: (conditions.length + 1).toString(),
        label: template.label,
        value: template.value,
      },
    ];
    setConditions(newConditions);
    setCreatDialogVisible(false);
    messageApi.open({
      type: 'success',
      content: 'Template save successfully :)',
    });
  };

  const handleEdit = (editedTemplate: ConditionTemplate) => {
    const editedIndex = conditions.findIndex(
      (item) => item.key === editedTemplate.key
    );

    if (editedIndex !== -1) {
      const updatedConditions = [...conditions];
      updatedConditions[editedIndex] = editedTemplate;
      setConditions(updatedConditions);
      setEditDialogVisible(false);
      messageApi.open({
        type: 'success',
        content: 'Template edited successfully :)',
      });
    } else {
      messageApi.open({
        type: 'error',
        content: 'Unable to find template for editing :(',
      });
    }

    setEditingConditionTemplate(undefined);
  };

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

  return (
    <>
      {contextHolder}
      <Card
        title="🌈 Condition Template"
        bordered={false}
        className={'conditionTableViewWrapper'}
      >
        <div className={'operationBar'}>
          <Button
            type="primary"
            className={'addButton'}
            onClick={() => setCreatDialogVisible(true)}
          >
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
              pagination={{ pageSize: 100 }}
            />
          </SortableContext>
        </DndContext>

        <QueryConditionTemplateDialog
          title={'Create Condition Template'}
          isModalOpen={creatDialogVisible}
          handleOk={handleCreate}
          handleCancel={() => setCreatDialogVisible(false)}
        />

        <QueryConditionTemplateDialog
          title={'Edit Condition Template'}
          editTemplate={editingConditionTemplate}
          isModalOpen={editDialogVisible}
          handleOk={handleEdit}
          handleCancel={() => setEditDialogVisible(false)}
        />
      </Card>
    </>
  );
};

export default ConditionTableView;
