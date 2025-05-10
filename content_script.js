// content_script.js

const BRAINROT_VIDEOS = [
    "https://www.youtube.com/embed/zZ7AimPACzc?si=CU8iCSnNJ8-eeg3B", // Subway Surfers Generic
    "https://www.youtube.com/embed/u7kdVe8q5zs?si=EhbrNP_vY9weu9Lo", // Minecraft Parkour
    "https://www.youtube.com/embed/Zxl28UgHpn0?si=hy6OwuIw3DniUrJM", // Family Guy
    "https://www.youtube.com/embed/J9dvPQuHz-I?si=2GH2-FhvY7G7jAvn", // ASMR Soap Cutting
    "https://www.youtube.com/embed/C6Nsmyi0hmk?si=moTpG3De8hhAAPzB",  // Satisfying Kinetic Sand
    "https://www.youtube.com/embed/3xWJ0FSgJVE?si=_SegHDCkqjGFFRyu" //Ultimate
  ];
  const YOUTUBE_EMBED_PARAMS = "?autoplay=1&mute=1&loop=1&controls=0&rel=0"; // Added rel=0
  
  let videoPlayerContainer;
  let videoIframe;
  let currentVideoUrl = BRAINROT_VIDEOS[0] + YOUTUBE_EMBED_PARAMS + `&playlist=${BRAINROT_VIDEOS[0].split('/').pop()}`;
  
  function createVideoPlayer() {
    if (document.getElementById('brainrot-player-container')) return;
  
    videoPlayerContainer = document.createElement('div');
    videoPlayerContainer.id = 'brainrot-player-container';
  
    videoIframe = document.createElement('iframe');
    videoIframe.id = 'brainrot-iframe';
    videoIframe.setAttribute('allow', 'autoplay; encrypted-media');
    videoIframe.setAttribute('allowfullscreen', 'true'); // Though controls are off
    videoIframe.src = currentVideoUrl;
  
    videoPlayerContainer.appendChild(videoIframe);
    document.body.appendChild(videoPlayerContainer);
  
    // Make it draggable (simple version)
    let isDragging = false;
    let offsetX, offsetY;
  
    const dragHandle = videoPlayerContainer.querySelector('::before') || videoPlayerContainer; // Use container if ::before not styled
  
    dragHandle.addEventListener('mousedown', (e) => {
      // Check if the click is on the resize handle (bottom-right corner)
      const rect = videoPlayerContainer.getBoundingClientRect();
      const resizeHandleSize = 15; // Approx size of the resize area
      if (e.clientX > rect.right - resizeHandleSize && e.clientY > rect.bottom - resizeHandleSize) {
        return; // Don't drag if trying to resize
      }
      
      isDragging = true;
      offsetX = e.clientX - videoPlayerContainer.offsetLeft;
      offsetY = e.clientY - videoPlayerContainer.offsetTop;
      videoPlayerContainer.style.cursor = 'grabbing';
      e.preventDefault(); // Prevent text selection
    });
  
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        videoPlayerContainer.style.left = `${e.clientX - offsetX}px`;
        videoPlayerContainer.style.top = `${e.clientY - offsetY}px`;
      }
    });
  
    document.addEventListener('mouseup', () => {
      if (isDragging) {
          isDragging = false;
          videoPlayerContainer.style.cursor = 'grab';
      }
    });
  }
  
  function showVideoPlayer() {
    if (!videoPlayerContainer) createVideoPlayer();
    videoPlayerContainer.style.display = 'block';
    // Ensure iframe source is set, especially after being hidden/re-shown
    if (videoIframe && videoIframe.src !== currentVideoUrl) {
      videoIframe.src = currentVideoUrl;
    }
  }
  
  function hideVideoPlayer() {
    if (videoPlayerContainer) {
      videoPlayerContainer.style.display = 'none';
      // Pause the video by removing the src, then re-add on show to save resources
      if (videoIframe) videoIframe.src = 'about:blank';
    }
  }
  
  function changeVideo(newVideoBaseUrl) {
    const videoId = newVideoBaseUrl.split('/').pop();
    currentVideoUrl = `${newVideoBaseUrl}${YOUTUBE_EMBED_PARAMS}&playlist=${videoId}`;
    if (videoIframe) {
      videoIframe.src = currentVideoUrl;
    }
    // Save the preference (optional, but good for persistence across sessions)
    chrome.storage.local.set({ lastVideoUrl: currentVideoUrl });
  }
  
  function surpriseMeVideo() {
    const randomIndex = Math.floor(Math.random() * BRAINROT_VIDEOS.length);
    const newVideoBaseUrl = BRAINROT_VIDEOS[randomIndex];
    changeVideo(newVideoBaseUrl);
    // If player is visible, it will update. If not, it'll use this new one when shown.
    if (videoPlayerContainer && videoPlayerContainer.style.display === 'block') {
      showVideoPlayer(); // This will reload the iframe with the new src
    }
  }
  
  // IMPORTANT: ChatGPT's UI selectors can change frequently.
  // This function tries to find a "Stop generating" button.
  function isChatGPTThinking() {
    // Option 1: Look for a button with "Stop generating" text or aria-label
    const buttons = document.querySelectorAll('button');
    for (let button of buttons) {
      const buttonText = button.textContent?.trim().toLowerCase();
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase();
      if (buttonText === 'stop generating' || ariaLabel === 'stop generating') {
        return true;
      }
      // Sometimes it's an icon within a button, check for common SVG paths or classes if known
      // e.g., if (button.querySelector('svg[data-icon="stop"]')) return true;
    }
  
    // Option 2: Check if the main send button is disabled.
    // This selector needs to be THE selector for the primary "send message" button.
    // It often changes. As of early 2024, it's a button next to the textarea.
    // It might be `form button[data-testid="send-button"]` or similar.
    // Let's find the textarea and then its sibling button.
    const textarea = document.querySelector('textarea[id="prompt-textarea"]');
    if (textarea) {
      const sendButton = textarea.parentElement?.querySelector('button[data-testid="send-button"]');
      if (sendButton && sendButton.disabled) {
          return true;
      }
    }
    
    // Option 3: A more specific "Stop generating" button that appears during generation.
    // This one is often found near the last message or above the input bar.
    // Example: A button with specific class or nested structure.
    // e.g., document.querySelector('button.btn-danger') if such a class is used.
    // For now, the text-based search is more generic.
  
    return false;
  }
  
  // Monitor DOM changes to detect thinking state
  const observer = new MutationObserver(() => {
    if (isChatGPTThinking()) {
      showVideoPlayer();
    } else {
      hideVideoPlayer();
    }
  });
  
  // Start observing the main content area of ChatGPT.
  // This selector might need adjustment if ChatGPT's structure changes.
  // A common high-level container for chat messages and input.
  function observeChatArea() {
      // Try to find a good root element for observation.
      // The 'main' element or a specific div that wraps the conversation.
      const chatContainer = document.querySelector('main') || document.body;
      if (chatContainer) {
          observer.observe(chatContainer, { childList: true, subtree: true, attributes: true });
          console.log("brainrotGPT: Observing ChatGPT for thinking state...");
      } else {
          // Fallback or retry if main element not found immediately
          setTimeout(observeChatArea, 1000);
      }
  }
  
  
  // Initial check and setup
  chrome.storage.local.get(['lastVideoUrl'], (result) => {
    if (result.lastVideoUrl) {
      currentVideoUrl = result.lastVideoUrl;
    } else {
      // Set default if nothing stored
      const videoId = BRAINROT_VIDEOS[0].split('/').pop();
      currentVideoUrl = BRAINROT_VIDEOS[0] + YOUTUBE_EMBED_PARAMS + `&playlist=${videoId}`;
    }
    // Create player on load but keep it hidden initially.
    // This ensures it's ready when needed.
    createVideoPlayer();
    // Initial check, sometimes generation is already in progress on page load/reload
    if (isChatGPTThinking()) {
      showVideoPlayer();
    } else {
      hideVideoPlayer();
    }
  });
  
  observeChatArea();
  
  
  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "surprise_me_video") {
      surpriseMeVideo();
      sendResponse({ status: "Video changed" });
    }
    return true; // Indicates you wish to send a response asynchronously
  });
  
  console.log("brainrotGPT content script loaded!");