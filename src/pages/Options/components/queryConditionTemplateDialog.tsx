import React, { useEffect, useState } from 'react';
import { Button, Form, FormProps, Input, Modal } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import './queryConditionTemplateDialog.scss';
import { ConditionTemplate } from './conditionTableView';

interface QueryConditionTemplateDialogProps {
  title: string;
  editTemplate?: ConditionTemplate;
  isModalOpen: boolean;
  handleOk: (conditionTemplate: any) => void;
  handleCancel: () => void;
}

const QueryConditionTemplateDialog: React.FC<
  QueryConditionTemplateDialogProps
> = ({ title, editTemplate, isModalOpen, handleOk, handleCancel }) => {
  const [form] = Form.useForm();
  const [initialValues, setInitialValues] = useState<
    ConditionTemplate | undefined
  >(undefined);

  useEffect(() => {
    if (editTemplate) {
      setInitialValues(editTemplate);
    }
  }, [editTemplate]);

  const onFinish: FormProps<ConditionTemplate>['onFinish'] = (formValue) => {
    handleOk({
      key: editTemplate?.key,
      label: formValue.label,
      value: formValue.value,
    });
  };

  const onFinishFailed: FormProps<ConditionTemplate>['onFinishFailed'] = (
    errorInfo
  ) => {
    console.log('Failed:', errorInfo);
  };

  const validateTitle = (rule: any, value: string) => {
    if (!value) {
      return Promise.reject('Please input title!');
    } else if (value.length > 32) {
      return Promise.reject('Title must be less than 32 characters!');
    } else {
      return Promise.resolve();
    }
  };

  const validateTemplate = (rule: any, value: string) => {
    if (!value) {
      return Promise.reject('Please input template!');
    } else if (value.length > 1000) {
      return Promise.reject('Template must be less than 1000 characters!');
    } else {
      return Promise.resolve();
    }
  };

  return (
    <Modal
      title={title}
      open={isModalOpen}
      onOk={handleOk}
      style={{ top: 220 }}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose={true}
    >
      <Form
        name="basic"
        form={form}
        onFinish={onFinish}
        initialValues={initialValues}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
        className={'conditionTemplateForm'}
      >
        <Form.Item<ConditionTemplate>
          label="Title"
          name="label"
          rules={[{ required: true, validator: validateTitle }]}
        >
          <Input showCount maxLength={32} />
        </Form.Item>

        <Form.Item<ConditionTemplate>
          label="Template"
          name="value"
          rules={[{ required: true, validator: validateTemplate }]}
        >
          <TextArea rows={3} showCount maxLength={1000} />
        </Form.Item>

        <Form.Item className={'operationBar'}>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit">
            Save
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default QueryConditionTemplateDialog;