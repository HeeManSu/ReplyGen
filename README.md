# Gmail Reply Assistant Chrome Extension

An AI-powered Chrome extension that helps you draft Gmail replies in your company's specific tone of voice using a RAG (Retrieval-Augmented Generation) pipeline.

## 🎯 Overview

This extension integrates with Gmail to automatically generate contextually appropriate email replies that match your company's communication style. It uses vector embeddings to find similar company communication examples and feeds them to an LLM to generate tone-consistent responses.

## 🏗️ Architecture

### Core Components

1. **Content Script** (`src/content.ts`) - Interacts with Gmail DOM
2. **Background Service Worker** (`src/background.ts`) - Handles API communication
3. **Popup UI** (`src/popup.tsx`) - React-based user interface
4. **Manifest** (`public/manifest.json`) - Extension configuration

### How It Works Internally

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Gmail Page    │    │  Content Script │    │ Background SW   │
│                 │    │                 │    │                 │
│ 1. User clicks  │───▶│ 2. Extract      │───▶│ 3. Send to      │
│    extension    │    │    email data   │    │    backend API  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐              │
│   Popup UI      │    │  Backend API    │◀─────────────┘
│                 │    │                 │
│ 6. Show reply   │◀───│ 4. RAG Pipeline │
│    options      │    │ 5. Generate     │
└─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│   Content       │
│   Script        │
│ 7. Insert reply │
│    into Gmail   │
└─────────────────┘
```

## 🚀 Setup & Installation

### Prerequisites

- Node.js 18+ and npm
- Chrome browser
- Gmail account

### Development Setup

1. **Clone and Install**

   ```bash
   git clone <your-repo>
   cd gmail-reply-extension
   npm install
   ```

2. **Build the Extension**

   ```bash
   npm run build
   ```

3. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top-right toggle)
   - Click "Load unpacked"
   - Select the `dist` folder from your project

### Production Build

```bash
npm run build
```

The built extension will be in the `dist` folder.

## 🔧 Configuration

### Extension Settings

Open the extension popup and configure:

1. **Company ID**: Your unique company identifier (e.g., `company_a`)
2. **API Key**: Your backend API authentication key
3. **Tone**: Communication style preference
   - Professional
   - Friendly
   - Casual
   - Formal

### Backend Integration

The extension expects a backend API with these endpoints:

- `POST /generate-reply` - Generate contextual reply
- `GET /settings` - Retrieve user settings
- `POST /settings` - Save user settings

## 📁 Project Structure

```
gmail-reply-extension/
├── public/
│   ├── manifest.json          # Extension manifest (Chrome V3)
│   ├── icon-16.png           # Extension icons
│   ├── icon-48.png
│   └── icon-128.png
├── src/
│   ├── background.ts         # Service worker for API calls
│   ├── content.ts           # Gmail DOM interaction
│   ├── popup.tsx            # React popup component
│   ├── popup.css           # Popup styles
│   └── index.css           # Global styles
├── popup.html              # Popup HTML template
├── vite.config.ts         # Vite build configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## 🔍 Technical Details

### Content Script (`src/content.ts`)

**Purpose**: Interacts with Gmail's DOM to extract email content and insert generated replies.

**Key Functions**:

- `extractEmailContent()` - Extracts subject, sender, and body from current Gmail thread
- `insertReplyIntoCompose()` - Inserts generated text into Gmail compose box
- Message listener for communication with popup and background script

**Gmail Selectors** (may need updates if Gmail changes):

```typescript
const GMAIL_SELECTORS = {
  emailBody: '[role="listitem"] [data-message-id] [dir="ltr"]',
  composeBox: '[role="textbox"][aria-label*="Message Body"]',
  replyButton: '[role="button"][aria-label*="Reply"]',
  subjectLine: "h2[data-legacy-thread-id]",
  senderEmail: "[email]",
};
```

### Background Script (`src/background.ts`)

**Purpose**: Handles API communication and data persistence.

**Key Functions**:

- `handleGenerateReply()` - Calls backend API to generate reply
- `handleGetSettings()` / `handleSaveSettings()` - Manages user settings via Chrome storage
- Message routing between content script and popup

**Storage**: Uses `chrome.storage.local` for persistent settings.

### Popup Component (`src/popup.tsx`)

**Purpose**: Provides user interface for settings and reply generation.

**Features**:

- Settings management (Company ID, API Key, Tone)
- One-click reply generation
- Reply preview and editing
- Insert into Gmail functionality

**State Management**:

```typescript
interface Settings {
  companyId: string;
  apiKey: string;
  tone: string;
}
```

### Communication Flow

1. **Settings Flow**:

   ```
   Popup ──(chrome.runtime.sendMessage)──▶ Background ──(chrome.storage)──▶ Persist
   ```

2. **Reply Generation Flow**:

   ```
   Popup ──▶ Background ──(API call)──▶ Backend ──▶ LLM ──▶ Response ──▶ Popup
   ```

3. **Gmail Integration Flow**:
   ```
   Popup ──(chrome.tabs.sendMessage)──▶ Content Script ──(DOM manipulation)──▶ Gmail
   ```

## 🔒 Security & Privacy

### Data Handling

- Email content is only sent to your backend when user explicitly clicks "Generate Reply"
- No automatic data collection or background processing
- API keys stored securely in Chrome's local storage
- All communication over HTTPS

### Permissions

- `activeTab` - Access current Gmail tab when extension is used
- `storage` - Store user settings locally
- `scripting` - Inject content script into Gmail
- `host_permissions` - Access Gmail and your backend API

## 🎨 UI/UX Features

### Visual Indicators

- Extension shows "✨ Reply Assistant Active" indicator when loaded on Gmail
- Error/success messages for user feedback
- Loading states during reply generation

### Responsive Design

- Fixed popup size (350x500px) for consistent experience
- Clean, modern interface following Google's design patterns
- Accessible form controls and keyboard navigation

## 🧪 Testing

### Manual Testing Checklist

1. **Installation**:

   - [ ] Extension loads without errors
   - [ ] Icon appears in Chrome toolbar
   - [ ] Popup opens correctly

2. **Gmail Integration**:

   - [ ] Content script loads on Gmail
   - [ ] Can extract email content
   - [ ] Can insert reply into compose box
   - [ ] Visual indicator appears

3. **Settings**:

   - [ ] Can save/load settings
   - [ ] Settings persist across browser sessions
   - [ ] Form validation works

4. **Reply Generation**:
   - [ ] API communication works
   - [ ] Error handling for failed requests
   - [ ] Generated reply displays correctly
   - [ ] Insert functionality works

### Development Testing

```bash
# Run in development mode
npm run dev

# Build and test
npm run build
```

## 🐛 Troubleshooting

### Common Issues

1. **Extension not loading**:

   - Check Chrome Developer mode is enabled
   - Verify manifest.json is valid
   - Check for console errors in extension

2. **Gmail integration not working**:

   - Gmail selectors may have changed
   - Check content script is injecting properly
   - Verify Gmail is fully loaded before using extension

3. **API calls failing**:
   - Check network connectivity
   - Verify API key is correct
   - Check CORS settings on backend

### Debug Tools

1. **Extension Console**:

   - Go to `chrome://extensions/`
   - Click "Inspect views: background page" or "Inspect views: popup"

2. **Content Script Console**:

   - Open Gmail, press F12, check console for content script logs

3. **Network Monitoring**:
   - Use Chrome DevTools Network tab to monitor API calls

## 🔄 Future Enhancements

### Planned Features

- OAuth integration with Gmail API for better stability
- Multiple company profiles support
- Reply templates and snippets
- Advanced tone customization
- Usage analytics and insights

### Scalability Considerations

- Implement proper error boundaries
- Add retry logic for API calls
- Optimize for larger email threads
- Support for multiple email providers

## 📦 Dependencies

### Core Dependencies

- `react` - UI framework
- `react-dom` - React DOM rendering
- `typescript` - Type safety

### Development Dependencies

- `vite` - Build tool and dev server
- `@vitejs/plugin-react` - React support for Vite
- `@types/chrome` - Chrome extension API types
- `@types/node` - Node.js types

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style

- Use TypeScript for all code
- Follow React best practices
- Add comments for complex logic
- Keep functions small and focused

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🚀 Quick Start Guide

1. **Install dependencies**: `npm install`
2. **Build extension**: `npm run build`
3. **Load in Chrome**: Go to `chrome://extensions/`, enable Developer mode, click "Load unpacked", select `dist` folder
4. **Configure**: Click extension icon, enter your Company ID and API Key
5. **Use**: Open Gmail, select an email, click extension icon, click "Generate Reply"

For detailed setup instructions, see the [Setup & Installation](#-setup--installation) section above.
