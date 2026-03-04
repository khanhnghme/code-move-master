import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initGlobalErrorHandler } from "./lib/errorLogger";

initGlobalErrorHandler();

createRoot(document.getElementById("root")!).render(<App />);
