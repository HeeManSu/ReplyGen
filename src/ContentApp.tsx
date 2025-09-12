import React, { useState, useEffect } from "react";
import "./content.css";

interface EmailData {
  subject: string;
  senderEmail: string;
  body: string;
}

interface GeneratedReply {
  text: string;
  sources: string[];
}

const ContentApp: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [emailData, setEmailData] = useState<EmailData | null>(null);
  const [generatedReply, setGeneratedReply] = useState<GeneratedReply | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Gmail selectors (these may need updating based on Gmail changes)
  const GMAIL_SELECTORS = {
    emailBody: '[role="listitem"] [data-message-id] [dir="ltr"]',
    composeBox: '[role="textbox"][aria-label*="Message Body"]',
    replyButton: '[role="button"][aria-label*="Reply"]',
    subjectLine: "h2[data-legacy-thread-id]",
    senderEmail: "[email]",
  };

  // Extract email content from Gmail
  const extractEmailContent = (): EmailData | null => {
    try {
      // Get the currently focused/open email
      const emailBodies = document.querySelectorAll(GMAIL_SELECTORS.emailBody);
      const lastEmailBody = emailBodies[emailBodies.length - 1] as HTMLElement;

      if (!lastEmailBody) {
        console.log("No email body found");
        return null;
      }

      const body = lastEmailBody.innerText || "";

      // Extract subject
      const subjectElement = document.querySelector(
        GMAIL_SELECTORS.subjectLine
      ) as HTMLElement;
      const subject = subjectElement?.innerText || "";

      // Extract sender email (simplified - in real implementation you'd need more robust extraction)
      const senderElement = document.querySelector(
        GMAIL_SELECTORS.senderEmail
      ) as HTMLElement;
      const senderEmail = senderElement?.getAttribute("email") || "";

      return {
        subject,
        senderEmail,
        body: body.trim(),
      };
    } catch (error) {
      console.error("Error extracting email content:", error);
      return null;
    }
  };

  // Insert generated reply into Gmail compose box
  const insertReplyIntoCompose = (replyText: string): boolean => {
    try {
      const composeBox = document.querySelector(
        GMAIL_SELECTORS.composeBox
      ) as HTMLElement;

      if (!composeBox) {
        // If compose box is not open, try to open it
        const replyButton = document.querySelector(
          GMAIL_SELECTORS.replyButton
        ) as HTMLElement;
        if (replyButton) {
          replyButton.click();
          // Wait a bit for the compose box to open
          setTimeout(() => {
            const newComposeBox = document.querySelector(
              GMAIL_SELECTORS.composeBox
            ) as HTMLElement;
            if (newComposeBox) {
              newComposeBox.focus();
              newComposeBox.innerText = replyText;
              // Trigger input event to ensure Gmail recognizes the content
              newComposeBox.dispatchEvent(
                new Event("input", { bubbles: true })
              );
            }
          }, 500);
          return true;
        }
        console.log("Compose box not found and unable to open");
        return false;
      }

      // Insert the reply text
      composeBox.focus();
      composeBox.innerText = replyText;

      // Trigger input event to ensure Gmail recognizes the content
      composeBox.dispatchEvent(new Event("input", { bubbles: true }));

      return true;
    } catch (error) {
      console.error("Error inserting reply:", error);
      return false;
    }
  };

  // Generate reply using background script
  const generateReply = async () => {
    setIsGenerating(true);
    setError("");
    setGeneratedReply(null);

    try {
      const emailContent = extractEmailContent();
      if (!emailContent) {
        setError("No email content found. Please make sure an email is open.");
        return;
      }

      setEmailData(emailContent);

      // Send message to background script
      const response = await chrome.runtime.sendMessage({
        type: "GENERATE_REPLY",
        data: {
          incomingText: emailContent.body,
          companyId: "demo_company", // This would come from settings
          tone: "professional",
        },
      });

      if (response.success) {
        setGeneratedReply({
          text: response.replyText,
          sources: response.sources || [],
        });
      } else {
        setError(response.error || "Failed to generate reply");
      }
    } catch (error) {
      console.error("Error generating reply:", error);
      setError("Failed to generate reply. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Insert reply into Gmail
  const insertReply = () => {
    if (!generatedReply) return;

    const success = insertReplyIntoCompose(generatedReply.text);
    if (success) {
      setSuccess("Reply inserted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(
        "Failed to insert reply. Make sure Gmail compose box is accessible."
      );
    }
  };

  // Show/hide the assistant based on Gmail page
  useEffect(() => {
    const checkGmailPage = () => {
      const isGmail = window.location.href.includes("mail.google.com");
      setIsVisible(isGmail);
    };

    checkGmailPage();
    window.addEventListener("popstate", checkGmailPage);
    return () => window.removeEventListener("popstate", checkGmailPage);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="gmail-reply-assistant">
      <div className="assistant-header">
        <h3>✨ Gmail Reply Assistant</h3>
        <button
          className="close-btn"
          onClick={() => setIsVisible(false)}
          title="Close Assistant"
        >
          ×
        </button>
      </div>

      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      <div className="assistant-content">
        {!emailData ? (
          <div className="extract-section">
            <p>Click to extract email content and generate a reply</p>
            <button
              onClick={generateReply}
              disabled={isGenerating}
              className="btn btn-primary"
            >
              {isGenerating ? "Generating..." : "Generate Reply"}
            </button>
          </div>
        ) : (
          <div className="email-preview">
            <h4>Email Preview:</h4>
            <div className="email-info">
              <p>
                <strong>From:</strong> {emailData.senderEmail}
              </p>
              <p>
                <strong>Subject:</strong> {emailData.subject}
              </p>
              <p>
                <strong>Body:</strong>
              </p>
              <div className="email-body">{emailData.body}</div>
            </div>
          </div>
        )}

        {generatedReply && (
          <div className="generated-reply">
            <h4>Generated Reply:</h4>
            <div className="reply-text">{generatedReply.text}</div>
            {generatedReply.sources.length > 0 && (
              <div className="sources">
                <strong>Sources:</strong> {generatedReply.sources.join(", ")}
              </div>
            )}
            <div className="reply-actions">
              <button onClick={insertReply} className="btn btn-primary">
                Insert into Gmail
              </button>
              <button
                onClick={() => setGeneratedReply(null)}
                className="btn btn-secondary"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentApp;
