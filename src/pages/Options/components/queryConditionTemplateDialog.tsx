import React from 'react';
import { Button, Form, FormProps, Input, Modal } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import './queryConditionTemplateDialog.scss';

interface QueryConditionTemplateDialogProps {
  title: string;
  isModalOpen: boolean;
  handleOk: () => void;
  handleCancel: () => void;
}

const QueryConditionTemplateDialog: React.FC<
  QueryConditionTemplateDialogProps
> = ({ title, isModalOpen, handleOk, handleCancel }) => {
  type FieldType = {
    title?: string;
    template?: string;
  };
  const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (
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
        onFinish={handleOk}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
        className={'conditionTemplateForm'}
      >
        <Form.Item<FieldType>
          label="Title"
          name="title"
          rules={[{ required: true, validator: validateTitle }]}
        >
          <Input showCount maxLength={32} />
        </Form.Item>

        <Form.Item<FieldType>
          label="Template"
          name="template"
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
