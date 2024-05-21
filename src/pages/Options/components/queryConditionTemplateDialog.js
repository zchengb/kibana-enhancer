import React, { useEffect } from 'react';
import { Button, Form, Input, Modal } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import './queryConditionTemplateDialog.scss';
import * as DOMPurify from 'dompurify';

const QueryConditionTemplateDialog = ({
  title,
  editTemplate,
  isModalOpen,
  handleOk,
  handleCancel,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (editTemplate) {
      form.setFieldsValue(editTemplate);
    }
  }, [editTemplate, isModalOpen]);

  const onFinish = (formValue) => {
    handleOk({
      key: editTemplate?.key,
      label: formValue.label,
      value: DOMPurify.sanitize(formValue.value, {
        USE_PROFILES: { html: false },
      }),
    });
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  const validateTitle = (rule, value) => {
    if (!value) {
      return Promise.reject('Please input title!');
    } else if (value.length > 32) {
      return Promise.reject('Title must be less than 32 characters!');
    } else {
      return Promise.resolve();
    }
  };

  const validateTemplate = (rule, value) => {
    if (!value) {
      return Promise.reject('Please input template!');
    } else if (value.length > 1000) {
      return Promise.reject('Template must be less than 1000 characters!');
    } else {
      return Promise.resolve();
    }
  };

  const resetFields = () => {
    form.resetFields();
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
      afterClose={resetFields}
    >
      <Form
        name="basic"
        form={form}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
        className={'conditionTemplateForm'}
      >
        <Form.Item
          label="Title"
          name="label"
          rules={[{ required: true, validator: validateTitle }]}
        >
          <Input showCount maxLength={32} />
        </Form.Item>
        <Form.Item
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
