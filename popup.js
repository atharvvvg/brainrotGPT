// popup.js
document.addEventListener('DOMContentLoaded', () => {
    const surpriseMeBtn = document.getElementById('surpriseMeBtn');
  
    surpriseMeBtn.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: "surprise_me_video" },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error("Error sending message:", chrome.runtime.lastError.message);
                // Potentially alert user or update popup UI if content script isn't responding
              } else if (response) {
                console.log(response.status);
              }
            }
          );
        } else {
          console.error("No active tab found or tab ID is missing.");
        }
      });
    });
  });