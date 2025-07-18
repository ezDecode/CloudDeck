import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Hero from './components/Hero/Hero';
import AuthModal from './components/AuthModal/AuthModal';
import FileExplorer from "./components/FileExplorer/FileExplorer";
import SetupGuide from './components/SetupGuide/SetupGuide'; // Import the new component
import { getStoredCredentials, clearStoredCredentials } from "./utils/authUtils";

function App() {
  return (
    <Router>
      <Main />
      <Analytics />
    </Router>
  );
}

function Main() {
  const [connected, setConnected] = useState(!!getStoredCredentials());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();

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
    navigate('/');
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <div className="min-h-screen w-full">
      <Routes>
        <Route path="/setup-guide" element={<SetupGuide />} />
        <Route path="/" element={
          !connected ? (
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
          )
        } />
      </Routes>
    </div>
  );
}

export default App;