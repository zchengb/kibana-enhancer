const selectorChangeListener = () => {
  let selectedValue = getSelectorElement().value;

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
        selectedValue = selectedValue.replaceAll(`{${param}}`, userInputs[param]);
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

const injectQuerySelectorOptions = (selectorElement) => {
  queryConditions.forEach((optionItem) => {
    const option = document.createElement('option');
    option.textContent = optionItem.label;
    option.value = optionItem.value;
    selectorElement.appendChild(option);
  });
};

const addConditionSelector = () => {
  const queryContainer = getQueryFilterBarElement();

  if (queryContainer) {
    const selectElement = document.createElement('select');
    selectElement.id = 'queryConditionSelector';
    selectElement.classList.add('queryCondition');

    const placeholderOption = document.createElement('option');
    placeholderOption.textContent = 'Select Query Condition';
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    selectElement.appendChild(placeholderOption);

    injectQuerySelectorOptions(selectElement);

    queryContainer.insertBefore(selectElement, queryContainer.lastChild);
    hasInitialized = true;
    selectElement.addEventListener('change', selectorChangeListener);
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

const loadQueryConditions = () => {
  const storedQueryConditions =
    window.localStorage.getItem('queryConditions') || '[]';
  console.log('successfully load query conditions.');
  return JSON.parse(storedQueryConditions);
};

const saveQueryConditions = () => {
  return window.localStorage.setItem(
    'queryConditions',
    JSON.stringify(queryConditions)
  );
};

const refreshSelectorOptions = () => {
  const queryConditionSelector = getSelectorElement();
  removeAllOptionsExceptFirst(queryConditionSelector);
  injectQuerySelectorOptions(queryConditionSelector);
};

const removeAllOptionsExceptFirst = (selectElement) => {
  const options = selectElement.querySelectorAll('option');

  for (let i = options.length - 1; i > 0; i--) {
    selectElement.removeChild(options[i]);
  }
};

const saveQueryCondition = () => {
  const queryCondition = getSearchInputElement().value;
  if (!queryCondition) {
    return;
  }

  const queryConditionTitle = prompt('Please input query condition title');

  if (queryConditionTitle) {
    queryConditions.push({
      label: queryConditionTitle,
      value: queryCondition,
    });

    saveQueryConditions();
    refreshSelectorOptions();
  } else {
    alert('Save failed :(');
  }
};

const addEventListenerOnSearchInput = () => {
  const searchInputElement = getSearchInputElement();
  if (searchInputElement) {
    searchInputElement.addEventListener('change', () => {
      getSelectorElement().options[0].selected = true;
    });
    console.log('Successfully add event listener on search input element.');
  }
};

const observer = new MutationObserver((mutations) => {
  if (isDiscoverPage() && !hasInitialized) {
    addConditionSelector();
    addSaveQueryConditionButton();
    addEventListenerOnSearchInput();
  }
});

const observerOptions = {
  childList: true,
  subtree: true,
  attributes: true,
  characterData: true,
};

let hasInitialized = false;
const queryConditions = loadQueryConditions();
observer.observe(document, observerOptions);
