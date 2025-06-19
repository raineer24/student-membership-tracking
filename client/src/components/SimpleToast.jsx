import React, { useState, useEffect } from "react";

const SimpleToast = ({ message, type = "success", onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 3000);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  const styles = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 ${
        styles[type]
      } px-4 py-3 rounded shadow-lg transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={() => setVisible(false)}
          className="ml-3 text-white/80 hover:text-white"
        >
          x
        </button>
      </div>
    </div>
  );
};

export default SimpleToast;
