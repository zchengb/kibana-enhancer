let hasInitialized = false;

function selectChangeListener() {
  let selectedValue = getSelectorElement().value;

  const params = [];
  const regex = /{(\w+)}/g;
  let match;

  while ((match = regex.exec(selectedValue))?.length > 0) {
    params.push(match[1]);
  }

  if (params.length > 0) {
    const userInputs = promptForInputs(params);

    if (userInputs) {
      params.forEach((param) => {
        selectedValue = selectedValue.replace(`{${param}}`, userInputs[param]);
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
}

const addInputSelector = () => {
  const selectElement = document.createElement('select');
  selectElement.id = 'queryCriteriaSelector';
  selectElement.classList.add('queryCriteria');

  const placeholderOption = document.createElement('option');
  placeholderOption.textContent = 'Select Query criteria';
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  selectElement.appendChild(placeholderOption);

  const options = [];
  options.forEach((optionItem) => {
    const option = document.createElement('option');
    option.textContent = optionItem.label;
    option.value = optionItem.value;
    selectElement.appendChild(option);
  });

  const queryContainer = getQueryBarElement();

  if (queryContainer) {
    queryContainer.insertBefore(selectElement, queryContainer.lastChild);
    hasInitialized = true;
    selectElement.addEventListener('change', selectChangeListener);
    console.log('successfully append input selector.');
  } else {
    console.log('NOT FOUND Kibana pages.');
  }
};

const isDiscoverPage = () => {
  return window.location.href.includes('app/discover');
};

const getSearchInputElement = () => {
  return document.querySelector('.euiTextArea');
};

const getQueryBarElement = () => {
  return document.querySelector(
    '.globalQueryBar .euiFlexItem.euiFlexItem--flexGrowZero .euiFlexGroup.euiFlexGroup--gutterSmall.euiFlexGroup--directionRow'
  );
};

const getSelectorElement = () => {
  return document.getElementById('queryCriteriaSelector');
};

function promptForInputs(params) {
  const formInputs = {};
  params.forEach((param) => {
    const value = prompt(`Please input {${param}}:`);
    formInputs[param] = value ? value : `{${param}}`;
  });

  return formInputs;
}

const observer = new MutationObserver((mutations) => {
  if (isDiscoverPage() && !hasInitialized) {
    addInputSelector();
  }
});

const observerOptions = {
  childList: true,
  subtree: true,
  attributes: true,
  characterData: true,
};

observer.observe(document, observerOptions);
