// import React from "react";
// import ReactDOM from "react-dom/client";
// import App from "./App";
// import "./styles.css";

// const root = ReactDOM.createRoot(document.getElementById("root"));

// root.render(<App />);

// // Register Service Worker
// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker
//       .register("/service-worker.js")
//       .then((registration) => {
//         console.log("SW registered:", registration);
//       })
//       .catch((error) => {
//         console.log("SW registration failed:", error);
//       });
//   });
// }
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(<App />);