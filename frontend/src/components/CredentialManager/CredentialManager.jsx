import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { testConnection, initializeS3Client, clearS3Client } from "../../services/aws/s3Service";

const LOCAL_STORAGE_KEY = "awsCredentials";

export default function CredentialManager({ onConnect }) {
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [bucket, setBucket] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Animation refs
  const logoRef = useRef(null);
  const taglineRef = useRef(null);
  const highlightsRef = useRef(null);
  const dotsRef = useRef(null);
  const formRef = useRef(null);
  const containerRef = useRef(null);

  // GSAP Animation setup
  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 });
    
    // Animate container entrance
    tl.fromTo(containerRef.current, 
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.6, ease: "power3.out" }
    )
    // Animate logo entrance with more sophisticated timing
    .fromTo(logoRef.current, 
      { opacity: 0, y: 40, scale: 0.8 },
      { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power3.out" }, "-=0.4"
    )
    // Animate tagline with staggered reveal
    .fromTo(taglineRef.current?.children || [],
      { opacity: 0, y: 25 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", stagger: 0.2 }, "-=0.6"
    )
    // Animate form fields with cascading entrance
    .fromTo(formRef.current?.querySelectorAll('input, button, p') || [],
      { opacity: 0, x: 40, scale: 0.95 },
      { opacity: 1, x: 0, scale: 1, duration: 0.6, ease: "power2.out", stagger: 0.1 }, "-=0.5"
    )
    // Animate decorative dots with bounce
    .fromTo(dotsRef.current?.children || [],
      { opacity: 0, scale: 0, y: 20 },
      { opacity: 0.6, scale: 1, y: 0, duration: 0.5, ease: "back.out(2)", stagger: 0.15 }, "-=0.3");

    // Continuous floating animation for decorative elements
    gsap.to(dotsRef.current?.children || [], {
      y: "random(-8, 8)",
      duration: "random(2, 3)",
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1,
      stagger: {
        each: 0.5,
        from: "random"
      }
    });

    return () => {
      tl.kill();
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Load credentials from local storage on mount
  const validate = React.useCallback(() => {
    if (!accessKey || !secretKey || !bucket || !region) {
      setError("All fields are required.");
      return false;
    }
    setError("");
    return true;
  }, [accessKey, secretKey, bucket, region]);

  const handleConnect = React.useCallback(async (e, savedCreds = null) => {
    if (e) e.preventDefault();
    
    const credentials = savedCreds || { accessKey, secretKey, bucket, region };
    
    if (!savedCreds && !validate()) return;
    
    setLoading(true);
    setError("");
    
    try {
      // Test the connection
      const result = await testConnection(credentials);
      
      if (result.success) {
        // Initialize S3 client
        initializeS3Client(credentials);
        
        // Save to localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(credentials));
        
        setConnected(true);
        onConnect && onConnect(credentials);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to connect. Please check your credentials.");
      console.error("Connection error:", err);
    } finally {
      setLoading(false);
    }
  }, [accessKey, bucket, onConnect, region, secretKey, validate]);

  // Load credentials from local storage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const creds = JSON.parse(saved);
      setAccessKey(creds.accessKey || "");
      setSecretKey(creds.secretKey || "");
      setBucket(creds.bucket || "");
      setRegion(creds.region || "us-east-1");
      // Auto-connect if credentials exist
      handleConnect(null, creds);
    }
  }, [handleConnect]);

  const handleDisconnect = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    clearS3Client();
    setAccessKey("");
    setSecretKey("");
    setBucket("");
    setRegion("us-east-1");
    setError("");
    setConnected(false);
    onConnect && onConnect(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800" ref={containerRef}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden bg-gray-800/90 backdrop-blur-sm border border-gray-700/50"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 100px rgba(249, 248, 113, 0.03)'
        }}
      >
        <div className="flex flex-col lg:flex-row min-h-[600px]">
          {/* Left Column - Enhanced Dark Branding Block */}
          <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 relative overflow-hidden bg-gradient-to-br from-gray-800 via-gray-900 to-slate-900">
            {/* Enhanced background patterns */}
            <div className="absolute inset-0 opacity-8">
              <div className="absolute inset-0" style={{
                background: `radial-gradient(circle at 25% 25%, rgba(249, 248, 113, 0.06) 0%, transparent 50%),
                            radial-gradient(circle at 75% 75%, rgba(227, 0, 0, 0.04) 0%, transparent 50%),
                            radial-gradient(circle at 50% 50%, rgba(156, 163, 175, 0.03) 0%, transparent 50%)`
              }}></div>
            </div>
            
            {/* Animated grid pattern with better visibility */}
            <div className="absolute inset-0 opacity-8">
              <div className="absolute inset-0" style={{
                backgroundImage: `linear-gradient(rgba(156, 163, 175, 0.08) 1px, transparent 1px),
                                 linear-gradient(90deg, rgba(156, 163, 175, 0.08) 1px, transparent 1px)`,
                backgroundSize: '60px 60px'
              }}></div>
            </div>

            <div className="w-full max-w-sm text-center relative z-10">
              {/* Logo with enhanced hierarchy */}
              <div className="mb-12" ref={logoRef}>
                <h1 className="font-satoshi font-bold text-white tracking-tight relative">
                  <span 
                    className="bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent"
                    style={{ 
                      fontSize: 'clamp(2.5rem, 8vw, 4rem)',
                      lineHeight: '1.1',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    CloudDeck
                  </span>
                </h1>
              </div>
              
              {/* Enhanced tagline with perfect typography hierarchy */}
              <div className="font-satoshi space-y-6" ref={taglineRef}>
                <div className="space-y-3">
                  <p className="text-gray-300 leading-relaxed font-light" style={{ fontSize: 'clamp(1.125rem, 4vw, 1.5rem)' }}>
                    Simple interface to work and collaborate with your team.
                  </p>
                </div>
              </div>
              
              {/* Enhanced decorative elements with better spacing */}
              <div className="mt-16 flex justify-center space-x-4 opacity-50" ref={dotsRef}>
                <motion.div 
                  className="w-3 h-3 rounded-full bg-yellow-400 shadow-lg"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0 }}
                />
                <motion.div 
                  className="w-3 h-3 rounded-full bg-red-500 shadow-lg"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                />
                <motion.div 
                  className="w-3 h-3 rounded-full bg-gray-400 shadow-lg"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 2 }}
                />
              </div>
              
              {/* Enhanced corner accents */}
              <div className="absolute top-8 right-8 opacity-15">
                <div className="w-10 h-10 border-t-2 border-r-2 border-gray-500 rounded-tr-xl"></div>
              </div>
              <div className="absolute bottom-8 left-8 opacity-15">
                <div className="w-10 h-10 border-b-2 border-l-2 border-gray-500 rounded-bl-xl"></div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Enhanced Dark Form */}
          <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 relative bg-gradient-to-br from-gray-800 to-slate-900">
            {/* Subtle form background pattern */}
            <div className="absolute inset-0 opacity-6">
              <div className="absolute inset-0" style={{
                background: `radial-gradient(circle at 70% 30%, rgba(156, 163, 175, 0.06) 0%, transparent 50%),
                            radial-gradient(circle at 30% 70%, rgba(107, 114, 128, 0.04) 0%, transparent 50%)`
              }}></div>
            </div>
            
            <div className="w-full max-w-md relative z-10" ref={formRef}>
              <form onSubmit={handleConnect} className="space-y-6">
                {/* Form Fields with enhanced consistency */}
                <div className="space-y-5">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <input
                      id="accessKey"
                      type="text"
                      className="w-full text-white bg-gray-700/80 border border-gray-600/50 rounded-2xl px-6 py-3 text-base font-satoshi font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 hover:bg-gray-600/80 placeholder-gray-400 backdrop-blur-sm"
                      placeholder="Access Key ID"
                      value={accessKey}
                      onChange={e => setAccessKey(e.target.value)}
                      autoComplete="off"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <input
                      id="secretKey"
                      type="password"
                      className="w-full text-white bg-gray-700/80 border border-gray-600/50 rounded-2xl px-6 py-3 text-base font-satoshi font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 hover:bg-gray-600/80 placeholder-gray-400 backdrop-blur-sm"
                      placeholder="Secret Access Key"
                      value={secretKey}
                      onChange={e => setSecretKey(e.target.value)}
                      autoComplete="off"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <input
                      id="bucket"
                      type="text"
                      className="w-full text-white bg-gray-700/80 border border-gray-600/50 rounded-2xl px-6 py-3 text-base font-satoshi font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 hover:bg-gray-600/80 placeholder-gray-400 backdrop-blur-sm"
                      placeholder="Bucket Name"
                      value={bucket}
                      onChange={e => setBucket(e.target.value)}
                      autoComplete="off"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <select
                      id="region"
                      className="w-full text-white bg-gray-700/80 border border-gray-600/50 rounded-2xl px-6 py-3 text-base font-satoshi font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 hover:bg-gray-600/80 backdrop-blur-sm appearance-none cursor-pointer"
                      value={region}
                      onChange={e => setRegion(e.target.value)}
                    >
                      <optgroup label="🇺🇸 United States">
                        <option value="us-east-1">US East (N. Virginia)</option>
                        <option value="us-east-2">US East (Ohio)</option>
                        <option value="us-west-1">US West (N. California)</option>
                        <option value="us-west-2">US West (Oregon)</option>
                      </optgroup>
                      <optgroup label="🇨🇦 Canada">
                        <option value="ca-central-1">Canada (Central)</option>
                        <option value="ca-west-1">Canada West (Calgary)</option>
                      </optgroup>
                      <optgroup label="🇪🇺 Europe">
                        <option value="eu-central-1">Europe (Frankfurt)</option>
                        <option value="eu-central-2">Europe (Zurich)</option>
                        <option value="eu-west-1">Europe (Ireland)</option>
                        <option value="eu-west-2">Europe (London)</option>
                        <option value="eu-west-3">Europe (Paris)</option>
                        <option value="eu-north-1">Europe (Stockholm)</option>
                        <option value="eu-south-1">Europe (Milan)</option>
                        <option value="eu-south-2">Europe (Spain)</option>
                      </optgroup>
                      <optgroup label="🌏 Asia Pacific">
                        <option value="ap-east-1">Asia Pacific (Hong Kong)</option>
                        <option value="ap-south-1">Asia Pacific (Mumbai)</option>
                        <option value="ap-south-2">Asia Pacific (Hyderabad)</option>
                        <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                        <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
                        <option value="ap-southeast-3">Asia Pacific (Jakarta)</option>
                        <option value="ap-southeast-4">Asia Pacific (Melbourne)</option>
                        <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                        <option value="ap-northeast-2">Asia Pacific (Seoul)</option>
                        <option value="ap-northeast-3">Asia Pacific (Osaka)</option>
                      </optgroup>
                      <optgroup label="🕌 Middle East">
                        <option value="me-south-1">Middle East (Bahrain)</option>
                        <option value="me-central-1">Middle East (UAE)</option>
                      </optgroup>
                      <optgroup label="🌍 Africa">
                        <option value="af-south-1">Africa (Cape Town)</option>
                      </optgroup>
                      <optgroup label="🌎 South America">
                        <option value="sa-east-1">South America (São Paulo)</option>
                      </optgroup>
                      <optgroup label="🇮🇱 Israel">
                        <option value="il-central-1">Israel (Tel Aviv)</option>
                      </optgroup>
                      <optgroup label="🇨🇳 China">
                        <option value="cn-north-1">China (Beijing)</option>
                        <option value="cn-northwest-1">China (Ningxia)</option>
                      </optgroup>
                      <optgroup label="🏛️ AWS GovCloud">
                        <option value="us-gov-east-1">AWS GovCloud (US-East)</option>
                        <option value="us-gov-west-1">AWS GovCloud (US-West)</option>
                      </optgroup>
                    </select>
                  </motion.div>
                </div>

                {/* Enhanced Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="text-center py-4 px-5 rounded-2xl bg-red-900/50 border border-red-700/50 text-red-300 font-satoshi text-base font-medium backdrop-blur-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Enhanced Action Button */}
                <motion.div 
                  className="pt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  {!connected ? (
                    <motion.button
                      type="submit"
                      className="w-full text-white font-bold py-4 px-8 rounded-3xl text-base font-satoshi transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-lg hover:shadow-xl border border-red-400/30"
                      whileHover={{ scale: 1.02, boxShadow: '0 20px 40px -10px rgba(220, 38, 38, 0.4)' }}
                      whileTap={{ scale: 0.98 }}
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <motion.div
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          Connecting...
                        </div>
                      ) : (
                        "Connect to AWS"
                      )}
                    </motion.button>
                  ) : (
                    <motion.button
                      type="button"
                      className="w-full text-white font-bold py-4 px-8 rounded-3xl text-base font-satoshi transition-all duration-300 bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 shadow-lg hover:shadow-xl border border-gray-400/30"
                      whileHover={{ scale: 1.02, boxShadow: '0 20px 40px -10px rgba(107, 114, 128, 0.4)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDisconnect}
                    >
                      Disconnect
                    </motion.button>
                  )}
                </motion.div>
                
                {/* Enhanced Info Note */}
                <motion.p 
                  className="text-center pt-6 font-satoshi text-sm text-gray-400 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  🔒 Your credentials are stored securely in your browser
                </motion.p>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}