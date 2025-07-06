import { useState } from 'react';
import Hero from './components/Hero/Hero';
import AuthModal from './components/AuthModal/AuthModal';
import FileExplorer from "./components/FileExplorer/FileExplorer";
import { getStoredCredentials, clearStoredCredentials } from "./services/aws/s3Service";

function App() {
  const [connected, setConnected] = useState(!!getStoredCredentials());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleConnectionChange = (credentials) => {
    if (credentials) {
      // Store credentials in localStorage
      localStorage.setItem("awsCredentials", JSON.stringify(credentials));
      setConnected(true);
      setIsAuthModalOpen(false);
    }
  };

  const handleDisconnect = () => {
    clearStoredCredentials();
    setConnected(false);
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <div className="min-h-screen w-full">
      {!connected ? (
        <>
          <Hero onConnectWallet={openAuthModal} />
          <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={closeAuthModal} 
            onConnect={handleConnectionChange} 
          />
        </>
      ) : (
        <div className="min-h-screen bg-primary-bg p-4">
          <div className="max-w-7xl mx-auto h-full">
            <div className="bg-neutral-white rounded-card shadow-lg overflow-hidden border border-neutral-borders h-full min-h-[calc(100vh-2rem)]">
              <FileExplorer onDisconnect={handleDisconnect} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
