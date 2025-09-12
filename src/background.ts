// Background service worker for Gmail Reply Assistant
console.log("Gmail Reply Assistant: Background script loaded");

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Gmail Reply Assistant: Extension installed");
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  switch (message.type) {
    case "GENERATE_REPLY":
      handleGenerateReply(message.data, sendResponse);
      return true; // Keep message channel open for async response

    case "GET_SETTINGS":
      handleGetSettings(sendResponse);
      return true;

    case "SAVE_SETTINGS":
      handleSaveSettings(message.data, sendResponse);
      return true;
  }
});

// Handle reply generation
async function handleGenerateReply(
  data: any,
  sendResponse: (response: any) => void
) {
  try {
    const { incomingText, companyId } = data;

    // TODO: In real implementation, this would call your backend API
    // For now, we'll simulate with a simple response
    const mockReply = `Thank you for your email. I'll review this and get back to you shortly.\n\nBest regards,\n[Your Name]`;

    sendResponse({
      success: true,
      replyText: mockReply,
      sources: ["Company tone guide", "Previous email examples"],
    });
  } catch (error) {
    console.error("Error generating reply:", error);
    sendResponse({
      success: false,
      error: "Failed to generate reply",
    });
  }
}

// Handle getting settings from storage
async function handleGetSettings(sendResponse: (response: any) => void) {
  try {
    const settings = await chrome.storage.local.get([
      "companyId",
      "apiKey",
      "tone",
    ]);
    sendResponse({
      success: true,
      settings: {
        companyId: settings.companyId || "",
        apiKey: settings.apiKey || "",
        tone: settings.tone || "professional",
      },
    });
  } catch (error) {
    console.error("Error getting settings:", error);
    sendResponse({
      success: false,
      error: "Failed to get settings",
    });
  }
}

// Handle saving settings to storage
async function handleSaveSettings(
  data: any,
  sendResponse: (response: any) => void
) {
  try {
    await chrome.storage.local.set(data);
    sendResponse({
      success: true,
      message: "Settings saved successfully",
    });
  } catch (error) {
    console.error("Error saving settings:", error);
    sendResponse({
      success: false,
      error: "Failed to save settings",
    });
  }
}
