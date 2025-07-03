import { useState } from 'react';
import CredentialManager from "./components/CredentialManager/CredentialManager";
import FileExplorer from "./components/FileExplorer/FileExplorer";
import { getStoredCredentials } from "./services/aws/s3Service";

function App() {
  const [connected, setConnected] = useState(!!getStoredCredentials());

  const handleConnectionChange = (credentials) => {
    setConnected(!!credentials);
  };

  const handleDisconnect = () => {
    setConnected(false);
  };

  return (
    <div className="min-h-screen w-full overflow-hidden">
      {!connected ? (
        <CredentialManager onConnect={handleConnectionChange} />
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
          <div className="max-w-7xl mx-auto h-full">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-full min-h-[calc(100vh-2rem)]">
              <FileExplorer onDisconnect={handleDisconnect} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
