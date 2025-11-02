// Options page script

document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  // Load saved API key
  chrome.storage.sync.get(['omdbApiKey'], (result) => {
    if (result.omdbApiKey) {
      apiKeyInput.value = result.omdbApiKey;
    }
  });

  // Save API key
  saveBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      showStatus('Please enter an API key', 'error');
      return;
    }

    // Validate API key format (OMDB keys are 8 character alphanumeric)
    if (apiKey.length !== 8) {
      showStatus('Invalid API key format. OMDB API keys are 8 characters long.', 'error');
      return;
    }

    // Test the API key
    saveBtn.disabled = true;
    showStatus('Validating API key...', '');

    try {
      const response = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&t=The+Matrix`);
      const data = await response.json();

      if (data.Response === 'False' && data.Error === 'Invalid API key!') {
        showStatus('Invalid API key. Please check and try again.', 'error');
        saveBtn.disabled = false;
        return;
      }

      // Save the API key
      chrome.storage.sync.set({ omdbApiKey: apiKey }, () => {
        showStatus('Settings saved successfully! Refresh any Criterion Collection pages to see ratings.', 'success');
        saveBtn.disabled = false;
      });

    } catch (error) {
      showStatus('Error validating API key. Please check your internet connection.', 'error');
      saveBtn.disabled = false;
    }
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
  }
});
