import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./popup.css";

interface Settings {
  companyId: string;
  apiKey: string;
  tone: string;
}

interface EmailData {
  subject: string;
  senderEmail: string;
  body: string;
}

const Popup: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    companyId: "",
    apiKey: "",
    tone: "professional",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReply, setGeneratedReply] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "GET_SETTINGS",
      });
      if (response.success) {
        setSettings(response.settings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const saveSettings = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "SAVE_SETTINGS",
        data: settings,
      });

      if (response.success) {
        setSuccess("Settings saved successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setError("Failed to save settings");
    }
  };

  const extractEmailAndGenerate = async () => {
    setIsGenerating(true);
    setError("");
    setGeneratedReply("");

    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.id || !tab.url?.includes("mail.google.com")) {
        setError("Please open Gmail in the current tab");
        return;
      }

      // Extract email content from Gmail
      const extractResponse = await chrome.tabs.sendMessage(tab.id, {
        type: "EXTRACT_EMAIL",
      });

      if (!extractResponse.success || !extractResponse.data) {
        setError(
          "Failed to extract email content. Make sure an email is open."
        );
        return;
      }

      const emailData: EmailData = extractResponse.data;

      // Generate reply using background script
      const generateResponse = await chrome.runtime.sendMessage({
        type: "GENERATE_REPLY",
        data: {
          incomingText: emailData.body,
          companyId: settings.companyId,
          tone: settings.tone,
        },
      });

      if (generateResponse.success) {
        setGeneratedReply(generateResponse.replyText);
      } else {
        setError(generateResponse.error || "Failed to generate reply");
      }
    } catch (error) {
      console.error("Error generating reply:", error);
      setError("Failed to generate reply. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const insertReply = async () => {
    if (!generatedReply) return;

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.id) {
        setError("No active tab found");
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: "INSERT_REPLY",
        replyText: generatedReply,
      });

      if (response.success) {
        setSuccess("Reply inserted successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(
          "Failed to insert reply. Make sure Gmail compose box is accessible."
        );
      }
    } catch (error) {
      console.error("Error inserting reply:", error);
      setError("Failed to insert reply");
    }
  };

  return (
    <div className="popup-container">
      <div className="header">
        <h1>✨ Gmail Reply Assistant</h1>
        <p>AI-powered replies in your company's tone</p>
      </div>

      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      <div className="section">
        <h3>Settings</h3>

        <div className="form-group">
          <label htmlFor="companyId">Company ID:</label>
          <input
            id="companyId"
            type="text"
            value={settings.companyId}
            onChange={(e) =>
              setSettings({ ...settings, companyId: e.target.value })
            }
            placeholder="e.g., company_a"
          />
        </div>

        <div className="form-group">
          <label htmlFor="apiKey">API Key:</label>
          <input
            id="apiKey"
            type="password"
            value={settings.apiKey}
            onChange={(e) =>
              setSettings({ ...settings, apiKey: e.target.value })
            }
            placeholder="Your API key"
          />
        </div>

        <div className="form-group">
          <label htmlFor="tone">Tone:</label>
          <select
            id="tone"
            value={settings.tone}
            onChange={(e) => setSettings({ ...settings, tone: e.target.value })}
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="casual">Casual</option>
            <option value="formal">Formal</option>
          </select>
        </div>

        <button onClick={saveSettings} className="btn btn-secondary">
          Save Settings
        </button>
      </div>

      <div className="section">
        <h3>Generate Reply</h3>

        <button
          onClick={extractEmailAndGenerate}
          disabled={isGenerating || !settings.companyId}
          className="btn btn-primary"
        >
          {isGenerating ? "Generating..." : "Generate Reply"}
        </button>

        {generatedReply && (
          <div className="generated-reply">
            <h4>Generated Reply:</h4>
            <div className="reply-text">{generatedReply}</div>
            <div className="reply-actions">
              <button onClick={insertReply} className="btn btn-primary">
                Insert into Gmail
              </button>
              <button
                onClick={() => setGeneratedReply("")}
                className="btn btn-secondary"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="footer">
        <p>Make sure you're on Gmail and have an email open</p>
      </div>
    </div>
  );
};

// Initialize React app
const container = document.getElementById("root");
// attach to container if not already attached
if (container) {
  if (!(container as any)._reactRoot) {
    (container as any)._reactRoot = createRoot(container);
  }
  (container as any)._reactRoot.render(<Popup />);
}
