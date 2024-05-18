console.log('This is the background page.');
console.log('Put the background scripts here.');
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});
