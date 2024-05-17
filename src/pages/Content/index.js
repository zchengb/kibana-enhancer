let hasInitialized = false;

const addInputSelector = () => {
  const selectElement = document.createElement('select');
  selectElement.id = 'queryCriteriaSelector';
  selectElement.classList.add('queryCriteria');

  const placeholderOption = document.createElement('option');
  placeholderOption.textContent = 'Select Query criteria';
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  selectElement.appendChild(placeholderOption);

  const options = ['Option 1', 'Option 2', 'Option 3'];
  options.forEach((optionText) => {
    const option = document.createElement('option');
    option.textContent = optionText;
    option.value = optionText.toLowerCase().replace(/\s+/g, '-');
    selectElement.appendChild(option);
  });

  const queryContainer = document.querySelector(
    '.globalQueryBar .euiFlexItem.euiFlexItem--flexGrowZero .euiFlexGroup.euiFlexGroup--gutterSmall.euiFlexGroup--directionRow'
  );
  if (queryContainer) {
    queryContainer.insertBefore(selectElement, queryContainer.lastChild);
    hasInitialized = true;
    console.log('append input selector done.');
  } else {
    console.log('NOT FOUND Kibana pages.');
  }
};

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

const isDiscoverPage = () => {
  return window.location.href.includes('app/discover');
};
