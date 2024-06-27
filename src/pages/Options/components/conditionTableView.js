import React, { useEffect, useRef, useState } from 'react';
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
import { Button, Card, message, Modal, Popconfirm, Space, Table } from 'antd';
import './conditionTableView.scss';
import { loadQueryConditions, saveQueryConditions } from '../../store.js';
import QueryConditionTemplateDialog from './queryConditionTemplateDialog';
import { QuestionCircleOutlined } from '@ant-design/icons';
import YamlFormatExampleDialog from './yamlFormatExampleDialog';

const Row = (props) => {
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

  const style = {
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

const ConditionTableView = () => {
  const [conditions, setConditions] = useState([]);
  const [creatDialogVisible, setCreatDialogVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editingConditionTemplate, setEditingConditionTemplate] = useState();
  const isInitialMount = useRef(true);
  const [messageApi, contextHolder] = message.useMessage();
  const [yamlExampleVisible, setYamlExampleVisible] = useState(false);
  const { confirm } = Modal;

  useEffect(() => {
    loadQueryConditions().then((data) => {
      setConditions(
        data.map((option, index) => {
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
      console.log('conditions changed!', conditions);
      saveQueryConditions(conditions).then((result) =>
        console.log('save query condition result:', result)
      );
    }
  }, [conditions]);

  const renderTemplate = (template) => {
    const variableRegex = /{([\w\u4e00-\u9fa5]+)}/g;
    return template.replace(
      variableRegex,
      '<span class="variable">{$1}</span>'
    );
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'label',
    },
    {
      title: 'Index Pattern',
      dataIndex: 'indexPattern',
      render: (indexPattern) =>
        indexPattern ? <span className="variable">{indexPattern}</span> : '-',
    },
    {
      title: 'Template',
      dataIndex: 'value',
      render: (template) => {
        const sanitizedHtml = DOMPurify.sanitize(template, {
          USE_PROFILES: { html: false },
        });
        return (
          <div
            dangerouslySetInnerHTML={{ __html: renderTemplate(sanitizedHtml) }}
          />
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <a
            onClick={() => {
              setEditingConditionTemplate(record);
              setEditDialogVisible(true);
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

  const handleDelete = (key) => {
    const conditionTemplates = conditions.filter((item) => item.key !== key);
    setConditions(conditionTemplates);
  };

  const findExistingCondition = (newCondition) => {
    return conditions.find(
      (condition) =>
        condition.value === newCondition.value &&
        condition.indexPattern === newCondition.indexPattern
    );
  };

  const handleCreate = (template) => {
    if (findExistingCondition(template)) {
      messageApi.open({
        type: 'error',
        content: 'Condition template already exists :(',
      });
      return;
    }

    const newConditions = [
      {
        key: (conditions.length + 1).toString(),
        label: template.label,
        value: template.value,
        indexPattern: template.indexPattern,
      },
      ...conditions,
    ];
    setConditions(newConditions);
    setCreatDialogVisible(false);
    messageApi.open({
      type: 'success',
      content: 'Template save successfully :)',
    });
  };

  const handleEdit = (editedTemplate) => {
    const existingCondition = findExistingCondition(editedTemplate);
    if (existingCondition && existingCondition.key !== editedTemplate.key) {
      messageApi.open({
        type: 'error',
        content: 'Condition template already exists :(',
      });
      return;
    }

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

  const onDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      setConditions((prev) => {
        const activeIndex = prev.findIndex((i) => i.key === active.id);
        const overIndex = prev.findIndex((i) => i.key === over?.id);
        return arrayMove(prev, activeIndex, overIndex);
      });
    }
  };

  const fullImportConditions = (conditionTemplates) => {
    const newConditions = conditionTemplates.map((template, index) => ({
      key: (index + 1).toString(),
      label: template.label,
      value: template.value,
    }));
    setConditions(newConditions);
    messageApi.open({
      type: 'success',
      content: 'Conditions imported successfully!',
    });
  };

  const incrementalImportConditions = (conditionTemplates) => {
    const originTemplateMap = {};
    let currentIndex = conditions.length;
    let importedCount = 0;

    conditions.forEach((template) => {
      originTemplateMap[template.value] = template;
    });

    const newConditions = [...conditions];

    conditionTemplates.forEach((template) => {
      if (!originTemplateMap[template.value]) {
        newConditions.push({
          key: (currentIndex + 1).toString(),
          label: template.label,
          value: template.value,
        });
        currentIndex += 1;
        importedCount += 1;
      }
    });

    setConditions(newConditions);
    messageApi.open({
      type: 'success',
      content: `${importedCount} conditions imported successfully!`,
    });
  };

  const importConditions = (yamlString) => {
    try {
      const { conditionTemplates } = yaml.load(yamlString);
      if (Array.isArray(conditionTemplates)) {
        const uniqueConditionTemplates = conditionTemplates.filter(
          (condition, index, self) =>
            index === self.findIndex((t) => t.value === condition.value)
        );

        confirm({
          width: 500,
          title: 'Choose import method',
          icon: <></>,
          content: (
            <div>
              <strong>- Incremental Import: </strong>
              <span>
                This operation will add new data to the existing templates.
              </span>
              <br />
              <strong>- Full Import: </strong>
              <span>
                This operation will override all existing templates with new
                templates.
              </span>
            </div>
          ),
          footer: (
            <div className={'importConfirmDialogFooter'}>
              <Button onClick={() => Modal.destroyAll()}>Cancel</Button>
              <Button
                type="primary"
                onClick={() => {
                  Modal.destroyAll();
                  incrementalImportConditions(uniqueConditionTemplates);
                }}
              >
                Incremental Import
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  Modal.destroyAll();
                  fullImportConditions(uniqueConditionTemplates);
                }}
              >
                Full Import
              </Button>
            </div>
          ),
          onOk() {},
          onCancel() {},
        });
      } else {
        messageApi.open({
          type: 'error',
          content: 'Invalid YAML format: conditionTemplates not found.',
        });
      }
    } catch (error) {
      console.error('Error importing conditions from YAML:', error);
      messageApi.open({
        type: 'error',
        content: 'Failed to import conditions from YAML.',
      });
    } finally {
      clearFileSelect();
    }
  };

  const handleUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const yamlString = event.target.result;
      importConditions(yamlString);
    };
    reader.readAsText(file);
  };

  const exportConditionsToYaml = () => {
    if (conditions.length === 0) {
      messageApi.open({
        type: 'warning',
        content: 'There are no conditions to export.',
      });
      return;
    }

    const conditionsToExport = conditions.map(({ key, ...rest }) => rest);
    const yamlString = yaml.dump({ conditionTemplates: conditionsToExport });
    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/yaml;charset=utf-8,' + encodeURIComponent(yamlString)
    );
    element.setAttribute('download', 'conditions.yaml');
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    messageApi.open({
      type: 'success',
      content: 'Conditions exported successfully :)',
    });
  };

  const handleExport = () => {
    exportConditionsToYaml();
  };

  const openFileUploader = () => {
    document.getElementById('fileInput')?.click();
  };

  const showYAMLExample = () => {
    setYamlExampleVisible(true);
  };

  const hideYAMLExample = () => {
    setYamlExampleVisible(false);
  };

  const clearFileSelect = () => {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.value = '';
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
        <div className={'operationTips'}>
          Click button to Create, Import and Export templates (YAML) :
        </div>
        <div className={'operationBar'}>
          <Button
            type="primary"
            className={'addButton'}
            onClick={() => setCreatDialogVisible(true)}
          >
            Create
          </Button>
          <Button className={'importButton'} onClick={openFileUploader}>
            Import
            <input
              type="file"
              id={'fileInput'}
              accept=".yaml,.yml"
              onChange={handleUpload}
              style={{ display: 'none' }}
            />
          </Button>
          <Button className={'exportButton'} onClick={handleExport}>
            Export
          </Button>
          <a className={'tooltip'} onClick={() => showYAMLExample()}>
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
                  row: Row,
                },
              }}
              rowKey="key"
              columns={columns}
              dataSource={conditions}
              pagination={false}
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

        <YamlFormatExampleDialog
          isModalOpen={yamlExampleVisible}
          handleCancel={hideYAMLExample}
        />
      </Card>
    </>
  );
};

export default ConditionTableView;
