import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { loadQueryConditions, saveQueryConditions } from '../store';
import { Cascader } from 'antd';

const decodeHTMLEntities = (text) => {
  const textAreas = document.createElement('textarea');
  textAreas.innerHTML = text;
  return textAreas.value;
};

const formatTableContent = () => {
  const tableCells = document.querySelectorAll(
    '.truncate-by-height:not([data-formatted="true"])'
  );
  console.log('start formatting table content with size:', tableCells.length);
  tableCells.forEach((cell) => {
    cell.innerHTML = decodeHTMLEntities(cell.innerHTML);
    cell.setAttribute('data-formatted', 'true');
  });
};

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

const debouncedFormatTableContent = debounce(formatTableContent, 500);

const ConditionSelector = () => {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    loadQueryConditions().then((data) => {
      setOptions(
        data.map((item) => ({ label: item.label, value: item.value }))
      );
      console.log('successfully inject query selector options.');
    });
  }, []);

  const onChange = (value, selectedOptions) => {
    const selectedOption = selectedOptions[0];
    let selectedValue = selectedOption.value;

    const params = new Set();
    const regex = /{([\w\u4e00-\u9fa5]+)}/g;
    let match;

    while ((match = regex.exec(selectedValue))?.length > 0) {
      params.add(match[1]);
    }

    if (params.size > 0) {
      const userInputs = promptForInputs(params);

      if (userInputs) {
        params.forEach((param) => {
          selectedValue = selectedValue.replaceAll(
            `{${param}}`,
            userInputs[param]
          );
        });
      }
    } else {
      console.log('No parameters found in the template.');
    }

    const searchInput = getSearchInputElement();
    if (searchInput) {
      searchInput.value = selectedValue;
      searchInput.textContent = selectedValue;

      const event = new Event('input', { bubbles: true });
      searchInput.dispatchEvent(event);

      const changeEvent = new Event('change', { bubbles: true });
      searchInput.dispatchEvent(changeEvent);
    }
  };

  const filter = (inputValue, path) => {
    const keywords = inputValue.trim().split(' ').map(keyword => keyword.toLowerCase());
    return path.some((option) => {
      const label = option.label.toLowerCase();
      return keywords.every((keyword) => {
        return label.indexOf(keyword) > -1;
      });
    });
  };

  return (
    <Cascader
      className={'queryCondition'}
      options={options}
      onChange={onChange}
      placeholder="Select Query Condition"
      showSearch={{ filter }}
      allowClear={false}
    />
  );
};

const addConditionSelector = () => {
  const queryContainer = getQueryFilterBarElement();

  if (queryContainer) {
    const selectContainer = document.createElement('div');
    selectContainer.id = 'queryConditionSelector';

    queryContainer.insertBefore(selectContainer, queryContainer.lastChild);

    ReactDOM.render(<ConditionSelector />, selectContainer);
    setInterval(() => {
      const selectorInputElement = document.querySelector(
        '.ant-select-selection-search-input'
      );
      selectorInputElement.style.setProperty('animation', 'none', 'important');
    }, 1000);
    console.log('successfully inject input selector.');
  }
};

const isDiscoverPage = () => {
  return window.location.href.includes('app/discover');
};

const getSearchInputElement = () => {
  return document.querySelector('.euiTextArea');
};

const getQueryFilterBarElement = () => {
  return document.querySelector(
    '.globalQueryBar .euiFlexItem.euiFlexItem--flexGrowZero .euiFlexGroup.euiFlexGroup--gutterSmall.euiFlexGroup--directionRow'
  );
};

const getSelectorElement = () => {
  return document.getElementById('queryConditionSelector');
};

const getSearchBarElement = () => {
  return document.querySelector(
    '.euiFormControlLayout.euiFormControlLayout--group.kbnQueryBar__wrap'
  );
};

const promptForInputs = (params) => {
  const formInputs = {};
  params.forEach((param) => {
    const value = prompt(`Please input {${param}}:`);
    formInputs[param] = value ? value : `{${param}}`;
  });

  return formInputs;
};

const addSaveQueryConditionButton = () => {
  const queryBarElement = getSearchBarElement();

  if (queryBarElement) {
    const saveConditionButton = document.createElement('div');
    saveConditionButton.id = 'saveConditionButton';
    saveConditionButton.className = 'saveConditionButton';

    const textSpan = document.createElement('span');
    textSpan.textContent = 'Save Condition';
    textSpan.className = 'saveConditionText';

    saveConditionButton.appendChild(textSpan);

    queryBarElement.insertBefore(
      saveConditionButton,
      queryBarElement.lastChild
    );

    saveConditionButton.addEventListener('click', saveQueryCondition);
    console.log('successfully inject save condition button.');
  }
};

const refreshSelectorOptions = () => {
  const selectContainer = getSelectorElement();
  if (selectContainer) {
    console.log('start render selector with new options.');
    ReactDOM.unmountComponentAtNode(selectContainer);
    ReactDOM.render(<ConditionSelector />, selectContainer);
  }
};

const hasExistingCondition = async (newQueryCondition) => {
  const queryConditions = await loadQueryConditions();
  return queryConditions.some(
    (condition) => condition.value === newQueryCondition
  );
};

const saveQueryCondition = () => {
  const queryCondition = getSearchInputElement().value;
  if (!queryCondition) {
    return;
  }

  loadQueryConditions()
    .then(async (data) => {
      const queryConditions = data;

      if (await hasExistingCondition(queryCondition)) {
        alert('This condition template already exists.');
        return;
      }

      const queryConditionTitle = prompt('Please input query condition title');

      if (queryConditionTitle) {
        queryConditions.push({
          label: queryConditionTitle,
          value: queryCondition,
          key: (queryConditions.length + 1).toString(),
        });

        saveQueryConditions(queryConditions).then((result) => {
          console.log('saveQueryConditions result:', result);
        });
      } else {
        alert('Save failed :(');
      }
    })
    .finally(() => refreshSelectorOptions());
};

const getTableElement = () => {
  return document.querySelector('.kbn-table.table');
};

const getSaveConditionButtonElement = () => {
  return document.getElementById('saveConditionButton');
};

const isOldTableElement = () => {
  return getTableElement() === logTableElement;
};

const addHookOnLogTable = () => {
  if (isOldTableElement()) {
    return;
  }

  logTableElement = getTableElement();
  if (logTableElement) {
    logTableObserver?.disconnect();
    logTableObserver = generateLogTableObserver();
    logTableObserver.observe(logTableElement, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });
    isLogTableObserving = true;
    lastPatternIndexName = getPatterIndexName();
    debouncedFormatTableContent();
    console.log('successfully add format hook on log table');
  }
};

const getPatterIndexName = () => {
  return (
    document.querySelector(
      '.dscSidebar__indexPatternSwitcher .euiButton__text strong'
    )?.textContent || ''
  );
};

const rootObserver = new MutationObserver((mutations) => {
  if (isDiscoverPage()) {
    if (!getSelectorElement()) {
      addConditionSelector();
    }

    if (!getSaveConditionButtonElement()) {
      addSaveQueryConditionButton();
    }

    if (lastPatternIndexName !== getPatterIndexName()) {
      isLogTableObserving = false;
    }

    if (!isLogTableObserving) {
      addHookOnLogTable();
    }
  }
});

const generateLogTableObserver = () => {
  return new MutationObserver((mutations) => {
    if (isDiscoverPage()) {
      debouncedFormatTableContent();
    }
  });
};

const rootObserverOptions = {
  childList: true,
  subtree: true,
  attributes: true,
  characterData: true,
};

let logTableElement = undefined;
let logTableObserver = undefined;
let isLogTableObserving = false;
let lastPatternIndexName = '';

rootObserver.observe(document, rootObserverOptions);
