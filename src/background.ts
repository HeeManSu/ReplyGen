chrome.runtime.onInstalled.addListener(() => {
  console.log("Gmail Reply Assistant: Extension installed");
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background: Received message:", message);

  switch (message.type) {
    case "EMAIL_EXTRACTED": {
      const emailData = message.payload;

      console.log("Background: Extracted email data:", emailData);

      fetch("http://localhost:3002/api/generate-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Background: Reply from backend:", data);
          sendResponse({ success: true, data });
        })
        .catch((err) => {
          console.log(err);
          sendResponse({ success: false, error: err.message });
        });

      return true;
    }

    default:
      console.log("Background: Unknown message type", message.type);
      break;
  }
});
