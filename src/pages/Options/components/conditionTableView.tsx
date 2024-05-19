import React, { useEffect, useRef, useState } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import * as DOMPurify from 'dompurify';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import * as yaml from 'js-yaml';
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
import { QuestionCircleOutlined } from '@ant-design/icons';
import YamlFormatExampleDialog from './yamlFormatExampleDialog';

export interface ConditionTemplate {
  key: string;
  label: string;
  value: string;
}

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  "data-row-key": string;
}

const Row = (props: RowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: props["data-row-key"]
  });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    cursor: "move",
    ...(isDragging ? { position: "relative", zIndex: 9999 } : {})
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
  const [yamlExampleVisible, setYamlExampleVisible] = useState(false);

  useEffect(() => {
    loadQueryConditions().then((data: QueryCondition[]) => {
      setConditions(
        data.map((option: QueryCondition, index: number) => {
          return {
            key: (index + 1).toString(),
            ...option
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
      console.log("conditions changed!");
      saveQueryConditions(
        conditions.map((condition: ConditionTemplate) => ({
          label: condition.label,
          value: condition.value
        }))
      ).then((result) => console.log("save query condition result:", result));
    }
  }, [conditions]);

  const renderTemplate = (template: string) => {
    const variableRegex = /{([\w\u4e00-\u9fa5]+)}/g;
    return template.replace(variableRegex, "<span class=\"variable\">{$1}</span>");
  };


  const columns: ColumnsType<ConditionTemplate> = [
    {
      title: "Title",
      dataIndex: "label"
    },
    {
      title: "Template",
      dataIndex: "value",
      render: (template) => {
        const sanitizedHtml = DOMPurify.sanitize(template,  { USE_PROFILES: { html: false } });
        return <div dangerouslySetInnerHTML={{ __html: renderTemplate(sanitizedHtml) }} />;
      },
    },
    {
      title: "Action",
      key: "action",
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
      )
    }
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
        value: template.value
      }
    ];
    setConditions(newConditions);
    setCreatDialogVisible(false);
    messageApi.open({
      type: "success",
      content: "Template save successfully :)"
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
        type: "success",
        content: "Template edited successfully :)"
      });
    } else {
      messageApi.open({
        type: "error",
        content: "Unable to find template for editing :("
      });
    }

    setEditingConditionTemplate(undefined);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1
      }
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

  const importConditionsFromYaml = (yamlString: string) => {
    const confirmImport = window.confirm(
      "Are you sure you want to import conditions? \n\n !!! This will overwrite existing data !!!"
    );
    if (!confirmImport) return;

    try {
      // @ts-ignore
      const { conditionTemplates } = yaml.load(yamlString);
      if (Array.isArray(conditionTemplates)) {
        const newConditions = conditionTemplates.map((template, index) => ({
          key: (index + 1).toString(),
          label: template.label,
          value: template.value
        }));
        setConditions(newConditions);
        messageApi.open({
          type: "success",
          content: "Conditions imported successfully!"
        });
      } else {
        messageApi.open({
          type: "error",
          content: "Invalid YAML format: conditionTemplates not found."
        });
      }
    } catch (error) {
      console.error("Error importing conditions from YAML:", error);
      messageApi.open({
        type: "error",
        content: "Failed to import conditions from YAML."
      });
    }
  };

  const handleUpload = (event: any) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      // @ts-ignore
      const yamlString = event.target.result;
      // @ts-ignore
      importConditionsFromYaml(yamlString);
    };
    reader.readAsText(file);
  };

  const exportConditionsToYaml = () => {
    if (conditions.length === 0) {
      messageApi.open({
        type: "warning",
        content: "There are no conditions to export."
      });
      return;
    }

    const conditionsToExport = conditions.map(({ key, ...rest }) => rest);
    const yamlString = yaml.dump({ conditionTemplates: conditionsToExport });
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/yaml;charset=utf-8," + encodeURIComponent(yamlString)
    );
    element.setAttribute("download", "conditions.yaml");
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    messageApi.open({
      type: "success",
      content: "Conditions exported successfully :)"
    });
  };

  const handleExport = () => {
    exportConditionsToYaml();
  };

  const openFileUploader = () => {
    document.getElementById("fileInput")?.click();
  };

  const showYAMLExample = () => {
    setYamlExampleVisible(true);
  };

  const hideYAMLExample = () => {
    setYamlExampleVisible(false);
  };

  return (
    <>
      {contextHolder}
      <Card
        title="🌈 Condition Template"
        bordered={false}
        className={"conditionTableViewWrapper"}
      >
        <div className={"operationTips"}>Click button to Create, Import and Export templates (YAML) :</div>
        <div className={"operationBar"}>
          <Button
            type="primary"
            className={"addButton"}
            onClick={() => setCreatDialogVisible(true)}
          >
            Create
          </Button>
          <Button className={"importButton"} onClick={openFileUploader}>
            Import
            <input
              type="file"
              id={"fileInput"}
              accept=".yaml,.yml"
              onChange={handleUpload}
              style={{ display: "none" }}
            />
          </Button>
          <Button className={"exportButton"} onClick={handleExport}>
            Export
          </Button>
          <a className={"tooltip"} onClick={() => showYAMLExample()}>
            <QuestionCircleOutlined />
            YAML format example
          </a>
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
                  row: Row
                }
              }}
              rowKey="key"
              columns={columns}
              dataSource={conditions}
              pagination={false}
            />
          </SortableContext>
        </DndContext>

        <QueryConditionTemplateDialog
          title={"Create Condition Template"}
          isModalOpen={creatDialogVisible}
          handleOk={handleCreate}
          handleCancel={() => setCreatDialogVisible(false)}
        />

        <QueryConditionTemplateDialog
          title={"Edit Condition Template"}
          editTemplate={editingConditionTemplate}
          isModalOpen={editDialogVisible}
          handleOk={handleEdit}
          handleCancel={() => setEditDialogVisible(false)}
        />

        <YamlFormatExampleDialog
          isModalOpen={yamlExampleVisible}
          handleCancel={hideYAMLExample}
        />
      </Card>
    </>
  );
};

export default ConditionTableView;
