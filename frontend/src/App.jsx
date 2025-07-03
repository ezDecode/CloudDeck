import { useState } from 'react';
import CredentialManager from "./components/CredentialManager/CredentialManager";
import FileExplorer from "./components/FileExplorer/FileExplorer";
import { getStoredCredentials } from "./services/aws/s3Service";

function App() {
  const [connected, setConnected] = useState(!!getStoredCredentials());

  const handleConnectionChange = (credentials) => {
    setConnected(!!credentials);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-800 shadow-sm border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">CloudDeck</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">AWS S3 File Manager</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8">
        {!connected ? (
          <div className="flex-1 flex items-center justify-center">
            <CredentialManager onConnect={handleConnectionChange} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto">
            <div className="flex-1 bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden">
              <FileExplorer />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
