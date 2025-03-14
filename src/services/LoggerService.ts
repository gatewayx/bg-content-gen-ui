// Function to log errors
export const logError = (error: any, info: any = null) => {
    const logs = JSON.parse(localStorage.getItem("error_logs") || "[]");
  
    const newLog = {
      id: logs.length + 1,
      message: error?.message || "Unknown error",
      stack: error?.stack || "No stack trace available",
      info,
      timestamp: new Date().toISOString(),
    };
  
    logs.push(newLog);
    localStorage.setItem("error_logs", JSON.stringify(logs));
  };
  
  // Function to download logs as a JSON file
  export const downloadLogs = () => {
    const logs = JSON.parse(localStorage.getItem("error_logs") || "[]");
  
    if (logs.length === 0) {
      alert("No logs available to download.");
      return;
    }
  
    const jsonString = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement("a");
    a.href = url;
    a.download = `error_logs_${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
  
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  