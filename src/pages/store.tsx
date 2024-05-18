export const loadQueryConditions = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['queryConditions'], (result) => {
      if (chrome.runtime.lastError) {
        console.error(
          'Error retrieving query conditions:',
          chrome.runtime.lastError
        );
        reject(chrome.runtime.lastError);
      } else {
        const queryConditions = result.queryConditions || [];
        resolve(queryConditions);
      }
    });
  });
};

export const saveQueryConditions = (queryConditions: any) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ queryConditions }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          'Error saving query conditions:',
          chrome.runtime.lastError
        );
        reject(chrome.runtime.lastError);
      } else {
        console.log('Successfully saved query conditions.');
        resolve(true);
      }
    });
  });
};
