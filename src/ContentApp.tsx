import React, { useState, useEffect } from "react";
import "./content.css";

interface EmailData {
  subject: string;
  senderEmail: string;
  companyName: string;
  body: string;
}

const GMAIL_SELECTORS = {
  emailBody: '[role="listitem"] [data-message-id] [dir="ltr"]',
  composeBox: '[role="textbox"][aria-label*="Message Body"]',
  replyButton: '[role="button"][aria-label*="Reply"]',
  subjectLine: "h2[data-legacy-thread-id]",
  senderEmail: "[email]",
  // More specific selectors for Gmail compose
  replyButtonNew: '[data-tooltip="Reply"]',
  composeTextArea: '[role="textbox"][aria-label*="Message Body"]',
  composeBoxContainer: '[role="dialog"] [role="textbox"]',
};

const extractCompanyFromEmail = (email: string): string => {
  const domain = email.split("@")[1];
  if (!domain) return "unknown";
  return domain.split(".")[0].toLowerCase();
};

const extractEmailContent = (): EmailData | null => {
  const emailBodies = document.querySelectorAll(GMAIL_SELECTORS.emailBody);
  const mostRecentEmailBody = emailBodies[0] as HTMLElement;
  if (!mostRecentEmailBody) {
    return null;
  }
  const body = mostRecentEmailBody.innerText || "";

  const subjectElement = document.querySelector(
    GMAIL_SELECTORS.subjectLine
  ) as HTMLElement;
  const subject = subjectElement?.innerText || "";

  const listItem = mostRecentEmailBody.closest('[role="listitem"]');
  const senderElement = listItem?.querySelector(
    GMAIL_SELECTORS.senderEmail
  ) as HTMLElement;
  const senderEmail = senderElement?.getAttribute("email") || "";

  return {
    subject,
    senderEmail,
    companyName: extractCompanyFromEmail(senderEmail),
    body: body.trim(),
  };
};

const ContentApp: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastReply, setLastReply] = useState<string>("");

  useEffect(() => {
    const messageListener = (
      message: any,
      sender: any,
      sendResponse: (response: any) => void
    ) => {
      console.log("Content script received message:", message);

      if (message.type === "EXTRACT_EMAIL") {
        const emailData = extractEmailContent();
        sendResponse({
          success: !!emailData,
          data: emailData,
        });
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const openGmailReply = (): boolean => {
    // Try multiple selectors to find and click the reply button
    const replySelectors = [
      '[data-tooltip="Reply"]',
      '[aria-label*="Reply"]',
      '[role="button"][aria-label*="Reply"]',
      '[data-tooltip*="Reply"]',
      'div[role="button"][aria-label*="Reply"]',
      'span[role="button"][aria-label*="Reply"]',
      // Gmail specific selectors
      '.ams[role="button"]',
      '.aio[role="button"]',
      '.aip[role="button"]',
    ];

    for (const selector of replySelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const replyButton = element as HTMLElement;
        const text = replyButton.textContent?.toLowerCase() || "";
        const ariaLabel =
          replyButton.getAttribute("aria-label")?.toLowerCase() || "";
        const tooltip =
          replyButton.getAttribute("data-tooltip")?.toLowerCase() || "";

        if (
          (text.includes("reply") ||
            ariaLabel.includes("reply") ||
            tooltip.includes("reply")) &&
          replyButton.offsetParent !== null
        ) {
          replyButton.click();
          return true;
        }
      }
    }

    const allButtons = document.querySelectorAll('[role="button"]');

    for (const button of allButtons) {
      const htmlButton = button as HTMLElement;
      const text = htmlButton.textContent?.toLowerCase() || "";
      const ariaLabel =
        htmlButton.getAttribute("aria-label")?.toLowerCase() || "";
      const tooltip =
        htmlButton.getAttribute("data-tooltip")?.toLowerCase() || "";

      if (
        (text.includes("reply") ||
          ariaLabel.includes("reply") ||
          tooltip.includes("reply")) &&
        htmlButton.offsetParent !== null
      ) {
        htmlButton.click();
        return true;
      }
    }

    return false;
  };

  const insertReplyIntoCompose = (replyText: string): boolean => {
    setTimeout(() => {
      const composeSelectors = [
        '[role="textbox"][aria-label*="Message Body"]',
        '[contenteditable="true"][aria-label*="Message Body"]',
        '[role="textbox"][aria-label*="Compose"]',
        '[contenteditable="true"][aria-label*="Compose"]',

        // Alternative selectors
        '.Am [contenteditable="true"]',
        '.Am [role="textbox"]',
        '[data-message-id] [contenteditable="true"]',
        '[data-message-id] [role="textbox"]',

        // Gmail specific selectors
        'div[aria-label*="Message Body"]',
        'div[contenteditable="true"]',
        'div[role="textbox"]',

        // Fallback selectors
        ".Am",
        "[data-message-id]",
        ".aO",
        ".aP",
      ];

      let composeBox: HTMLElement | null = null;
      let usedSelector = "";

      for (const selector of composeSelectors) {
        const elements = document.querySelectorAll(selector);

        for (const element of elements) {
          const htmlElement = element as HTMLElement;
          if (
            htmlElement.offsetParent !== null &&
            (htmlElement.getAttribute("contenteditable") === "true" ||
              htmlElement.getAttribute("role") === "textbox" ||
              htmlElement.tagName === "DIV")
          ) {
            composeBox = htmlElement;
            usedSelector = selector;
            break;
          }
        }

        if (composeBox) break;
      }

      if (composeBox) {
        try {
          composeBox.focus();
          composeBox.innerHTML = "";
          composeBox.innerText = replyText;
          composeBox.textContent = replyText;
          composeBox.innerHTML = replyText.replace(/\n/g, "<br>");

          const events = ["input", "change", "keyup", "paste"];
          events.forEach((eventType) => {
            const event = new Event(eventType, { bubbles: true });
            composeBox!.dispatchEvent(event);
          });

          const textNode = document.createTextNode(replyText);
          composeBox.appendChild(textNode);

          return true;
        } catch (error) {
          return false;
        }
      } else {
        return false;
      }
    }, 1500);

    return true;
  };

  const handleClick = async () => {
    const emailData = extractEmailContent();
    console.log("Email data:", emailData);
    if (!emailData) return;

    setIsGenerating(true);
    setLastReply("");

    try {
      const replyOpened = openGmailReply();
      if (!replyOpened) {
        console.log("Could not open reply compose box");
        setIsGenerating(false);
        return;
      }

      const response = await chrome.runtime.sendMessage({
        type: "EMAIL_EXTRACTED",
        payload: emailData,
      });

      console.log("AI Response:", response);

      if (
        response &&
        response.success &&
        response.data &&
        response.data.reply
      ) {
        const replyText = response.data.reply;
        setLastReply(replyText);

        insertReplyIntoCompose(replyText);
      } else {
        console.error("Failed to generate reply:", response);
        setLastReply("Sorry, I couldn't generate a reply. Please try again.");
      }
    } catch (error) {
      console.error("Error generating reply:", error);
      setLastReply("Sorry, I couldn't generate a reply. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "70px",
        right: "20px",
        zIndex: 9999,
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
        width: "280px",
      }}
    >
      <h3 style={{ margin: "0 0 10px", color: "#2563eb" }}>
        Gmail AI Assistant
      </h3>
      <p style={{ fontSize: "14px", marginBottom: "16px", color: "#555" }}>
        AI-powered replies in your company's tone
      </p>
      <button
        onClick={handleClick}
        disabled={isGenerating}
        style={{
          backgroundColor: isGenerating ? "#94a3b8" : "#2563eb",
          color: "white",
          border: "none",
          padding: "10px 20px",
          borderRadius: "6px",
          cursor: isGenerating ? "not-allowed" : "pointer",
          fontSize: "14px",
        }}
      >
        {isGenerating ? "Generating..." : "Generate & Insert Reply"}
      </button>
      {lastReply && (
        <div style={{ marginTop: "20px", textAlign: "left" }}>
          <h4 style={{ fontSize: "14px", margin: "0 0 8px", color: "#374151" }}>
            Last Generated Reply:
          </h4>
          <div
            style={{
              background: "#f8fafc",
              padding: "8px",
              borderRadius: "4px",
              fontSize: "12px",
              color: "#4b5563",
              border: "1px solid #e5e7eb",
            }}
          >
            {lastReply}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentApp;
