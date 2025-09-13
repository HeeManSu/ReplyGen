import { createRoot } from "react-dom/client";
import "./popup.css";

const Popup: React.FC = () => {
  return (
    <div className="popup-container">
      <div className="header">
        <h1>Gmail AI Assistant</h1>
        <p>AI-powered replies that match company tone</p>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<Popup />);
