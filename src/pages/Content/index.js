console.log('Content script works!');
console.log('Must reload extension for modifications to take effect.');

// const selectElement = document.createElement('select');
// selectElement.id = 'customSelect';
// selectElement.classList.add('euiFlexItem');
//
// const options = ['Option 1', 'Option 2', 'Option 3'];
// options.forEach((optionText) => {
//   const option = document.createElement('option');
//   option.textContent = optionText;
//   option.value = optionText.toLowerCase().replace(/\s+/g, '-');
//   selectElement.appendChild(option);
// });
//
// const queryContainer = Array.from(
//   document.querySelectorAll(
//     '.euiFlexGroup.euiFlexGroup--gutterSmall.euiFlexGroup--directionRow'
//   )
// ).filter((element) => {
//   // 检查当前元素的类名数量是否等于指定值
//   return element.classList.length === 3;
// })[0];
// queryContainer.appendChild(selectElement);
console.log('append input selector done.');
