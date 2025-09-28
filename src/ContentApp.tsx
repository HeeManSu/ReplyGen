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
  const [reply, setReply] = useState<any>(null);

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

  const handleClick = async () => {
    const emailData = extractEmailContent();
    console.log("Email data:", emailData);
    if (!emailData) return;

    try {
      const response = await chrome.runtime.sendMessage({
        type: "EMAIL_EXTRACTED",
        payload: emailData,
      });
      setReply(response.data);
    } catch (error) {
      console.error("Error in sendMessage:", error);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
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
        style={{
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          padding: "10px 20px",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        Generate Reply
      </button>
      {reply && (
        <div style={{ marginTop: "20px" }}>
          <h4>Reply</h4>
          <p>{reply.reply}</p>
          <p>Snippets used: {reply.snippets.join(", ")}</p>
        </div>
      )}
    </div>
  );
};

export default ContentApp;
