import React from 'react';
import { Modal } from 'antd';
import './queryConditionTemplateDialog.scss';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const YamlFormatExampleDialog = ({ isModalOpen, handleCancel }) => {
  return (
    <Modal
      title="YAML Format Example"
      open={isModalOpen}
      onCancel={handleCancel}
      style={{ top: 220 }}
      footer={null}
    >
      <SyntaxHighlighter
        language="yaml"
        style={docco}
        customStyle={{ fontSize: '12px' }}
        wrapLines
      >
        {`conditionTemplates:
  - label: Example Title 1
    value: Example log template 1 with {variable}
    indexPattern: '*app-logs*'
  - label: Example Title 2
    value: Example log template 2
    indexPattern: '*other*'`}
      </SyntaxHighlighter>
    </Modal>
  );
};

export default YamlFormatExampleDialog;
