import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { testConnection, initializeS3Client, clearS3Client, generateCORSConfig } from "../../services/aws/s3Service";

const LOCAL_STORAGE_KEY = "awsCredentials";

export default function CredentialManager({ onConnect }) {
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [bucket, setBucket] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState(null);
  const [showCORSHelp, setShowCORSHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [teamMode, setTeamMode] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [showTeamCreation, setShowTeamCreation] = useState(false);
  const [generatedTeamLink, setGeneratedTeamLink] = useState("");
  const [showTeamJoin, setShowTeamJoin] = useState(false);
  
  // Animation refs
  const logoRef = useRef(null);
  const taglineRef = useRef(null);
  const highlightsRef = useRef(null);
  const dotsRef = useRef(null);
  const formRef = useRef(null);
  const containerRef = useRef(null);

  // Optimized GSAP Animation setup
  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.1 });
    
    // Animate container entrance
    tl.fromTo(containerRef.current, 
      { opacity: 0, scale: 0.98 },
      { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
    )
    // Animate logo entrance
    .fromTo(logoRef.current, 
      { opacity: 0, y: 20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power2.out" }, "-=0.2"
    )
    // Animate tagline
    .fromTo(taglineRef.current?.children || [],
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", stagger: 0.1 }, "-=0.3"
    )
    // Animate form fields
    .fromTo(formRef.current?.querySelectorAll('input, button, p') || [],
      { opacity: 0, x: 20, scale: 0.98 },
      { opacity: 1, x: 0, scale: 1, duration: 0.3, ease: "power2.out", stagger: 0.05 }, "-=0.2"
    )
    // Animate decorative dots
    .fromTo(dotsRef.current?.children || [],
      { opacity: 0, scale: 0 },
      { opacity: 0.6, scale: 1, duration: 0.3, ease: "back.out(1.7)", stagger: 0.08 }, "-=0.2");

    // Lighter floating animation
    gsap.to(dotsRef.current?.children || [], {
      y: "random(-4, 4)",
      duration: "random(3, 4)",
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1,
      stagger: {
        each: 0.3,
        from: "random"
      }
    });

    return () => {
      tl.kill();
    };
  }, []);

  useEffect(() => {
    setIsInitialLoading(false);
  }, []);

  // Load credentials from local storage on mount
  const validate = React.useCallback(() => {
    if (!accessKey || !secretKey || !bucket || !region) {
      setError("All fields are required.");
      setErrorDetails(null);
      setShowCORSHelp(false);
      return false;
    }
    
    // Basic validation for AWS credentials format
    if (accessKey.length < 16 || accessKey.length > 32) {
      setError("Access Key ID should be between 16-32 characters");
      setErrorDetails(null);
      setShowCORSHelp(false);
      return false;
    }
    
    if (secretKey.length < 40) {
      setError("Secret Access Key should be at least 40 characters");
      setErrorDetails(null);
      setShowCORSHelp(false);
      return false;
    }
    
    setError("");
    setErrorDetails(null);
    setShowCORSHelp(false);
    return true;
  }, [accessKey, secretKey, bucket, region]);

  const handleConnect = React.useCallback(async (e, savedCreds = null) => {
    if (e) e.preventDefault();
    
    const credentials = savedCreds || { accessKey, secretKey, bucket, region };
    
    if (!savedCreds && !validate()) return;
    
    setLoading(true);
    setError("");
    setErrorDetails(null);
    setShowCORSHelp(false);
    
    try {
      // Test the connection
      const result = await testConnection(credentials);
      
      if (result.success) {
        // Initialize S3 client
        initializeS3Client(credentials);
        
        // Save to localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(credentials));
        
        // Save team data if in team creation mode
        if (showTeamCreation && teamName) {
          const teamData = {
            teamName,
            accessKey: credentials.accessKey,
            secretKey: credentials.secretKey,
            bucket: credentials.bucket,
            region: credentials.region,
            createdAt: new Date().toISOString()
          };
          localStorage.setItem("teamData", JSON.stringify(teamData));
          setTeamMode(true);
        }
        
        setConnected(true);
        onConnect && onConnect(credentials);
      } else {
        setError(result.message);
        setErrorDetails(result.error);
        
        // Show CORS help if it's likely a CORS issue
        if (result.message.toLowerCase().includes('cors') || 
            result.message.toLowerCase().includes('network') ||
            result.error?.statusCode === 0) {
          setShowCORSHelp(true);
        }
      }
    } catch (err) {
      setError("Failed to connect. Please check your credentials.");
      setErrorDetails(err);
      console.error("Connection error:", err);
    } finally {
      setLoading(false);
    }
  }, [accessKey, bucket, onConnect, region, secretKey, validate, showTeamCreation, teamName]);

  // Function to join team from URL parameter
  const joinTeamFromUrl = React.useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const teamParam = urlParams.get('team');
    
    if (teamParam) {
      try {
        const teamData = JSON.parse(atob(teamParam));
        setAccessKey(teamData.accessKey || "");
        setSecretKey(teamData.secretKey || "");
        setBucket(teamData.bucket || "");
        setRegion(teamData.region || "us-east-1");
        setTeamName(teamData.teamName || "");
        setTeamMode(true);
        setShowTeamJoin(true);
        
        // Clean the URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Auto-connect with team credentials
        setTimeout(() => {
          handleConnect(null, teamData);
        }, 500);
      } catch (error) {
        setError("Invalid team link. Please check the link and try again.");
      }
    }
  }, [handleConnect]);

  // Load credentials from local storage on mount and check for team links
  React.useEffect(() => {
    // Check for team link first
    joinTeamFromUrl();
    
    // Then check for saved credentials
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    const savedTeam = localStorage.getItem("teamData");
    
    if (savedTeam && !saved) {
      const teamData = JSON.parse(savedTeam);
      setTeamName(teamData.teamName || "");
      setTeamMode(true);
    }
    
    if (saved) {
      const creds = JSON.parse(saved);
      setAccessKey(creds.accessKey || "");
      setSecretKey(creds.secretKey || "");
      setBucket(creds.bucket || "");
      setRegion(creds.region || "us-east-1");
      
      // Check if it's team mode
      if (savedTeam) {
        const teamData = JSON.parse(savedTeam);
        setTeamName(teamData.teamName || "");
        setTeamMode(true);
      }
      
      // Auto-connect if credentials exist
      handleConnect(null, creds);
    }
  }, [handleConnect, joinTeamFromUrl]);

  const handleDisconnect = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem("teamData");
    clearS3Client();
    setAccessKey("");
    setSecretKey("");
    setBucket("");
    setRegion("us-east-1");
    setError("");
    setConnected(false);
    setTeamMode(false);
    setTeamName("");
    setGeneratedTeamLink("");
    onConnect && onConnect(null);
  };

  const generateTeamLink = () => {
    if (!teamName || !accessKey || !secretKey || !bucket || !region) {
      setError("Please fill all fields and team name before generating link");
      return;
    }

    const teamData = {
      teamName,
      accessKey,
      secretKey,
      bucket,
      region,
      createdAt: new Date().toISOString()
    };

    // Encode team data to base64
    const encodedData = btoa(JSON.stringify(teamData));
    const teamLink = `${window.location.origin}?team=${encodedData}`;
    
    setGeneratedTeamLink(teamLink);
    
    // Save team data locally
    localStorage.setItem("teamData", JSON.stringify(teamData));
  };

  const copyTeamLink = () => {
    if (generatedTeamLink) {
      navigator.clipboard.writeText(generatedTeamLink);
      alert("Team link copied to clipboard!");
    }
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
              {/* Team Mode Indicator */}
              {teamMode && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-blue-900/30 border border-blue-600/30 rounded-2xl text-center"
                >
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-blue-300 font-medium">Team Mode</span>
                  </div>
                  <p className="text-blue-200 text-sm">Team: {teamName}</p>
                  {showTeamJoin && (
                    <p className="text-green-300 text-xs mt-1">✓ Joined from team link</p>
                  )}
                </motion.div>
              )}

              {/* Team Creation/Join Toggle with icons */}
              {!connected && !teamMode && (
                <div className="mb-6 flex gap-2 bg-gray-700/30 p-1 rounded-2xl">
                  <motion.button
                    type="button"
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      !showTeamCreation 
                        ? 'bg-gray-700/80 text-white border border-gray-600/50 shadow-md' 
                        : 'bg-transparent text-gray-300 hover:bg-gray-600/30'
                    }`}
                    onClick={() => setShowTeamCreation(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-pressed={!showTeamCreation}
                    aria-label="Switch to individual mode"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Individual
                  </motion.button>
                  <motion.button
                    type="button"
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      showTeamCreation 
                        ? 'bg-blue-700/80 text-white border border-blue-600/50 shadow-md' 
                        : 'bg-transparent text-gray-300 hover:bg-gray-600/30'
                    }`}
                    onClick={() => setShowTeamCreation(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-pressed={showTeamCreation}
                    aria-label="Switch to team creation mode"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Create Team
                  </motion.button>
                </div>
              )}

              <form onSubmit={handleConnect} className="space-y-6">
                {/* Team Name Field with icon */}
                {showTeamCreation && !connected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative group"
                  >
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 group-focus-within:text-blue-300 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <input
                      id="teamName"
                      type="text"
                      className="w-full text-white bg-blue-700/60 border border-blue-600/50 rounded-2xl pl-12 pr-6 py-3 text-base font-satoshi font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:bg-blue-600/60 placeholder-blue-200 backdrop-blur-sm"
                      placeholder="Team Name (e.g., Marketing Team)"
                      value={teamName}
                      onChange={e => setTeamName(e.target.value)}
                      autoComplete="off"
                    />
                  </motion.div>
                )}

                {/* Form Fields with enhanced consistency and icons */}
                <div className="space-y-5">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative group"
                  >
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-yellow-400 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <input
                      id="accessKey"
                      type="text"
                      className="w-full text-white bg-gray-700/80 border border-gray-600/50 rounded-2xl pl-12 pr-6 py-3 text-base font-satoshi font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 hover:bg-gray-600/80 placeholder-gray-400 backdrop-blur-sm"
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
                    className="relative group"
                  >
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-yellow-400 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="secretKey"
                      type="password"
                      className="w-full text-white bg-gray-700/80 border border-gray-600/50 rounded-2xl pl-12 pr-6 py-3 text-base font-satoshi font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 hover:bg-gray-600/80 placeholder-gray-400 backdrop-blur-sm"
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
                    className="relative group"
                  >
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-yellow-400 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <input
                      id="bucket"
                      type="text"
                      className="w-full text-white bg-gray-700/80 border border-gray-600/50 rounded-2xl pl-12 pr-6 py-3 text-base font-satoshi font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 hover:bg-gray-600/80 placeholder-gray-400 backdrop-blur-sm"
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
                    className="relative group"
                  >
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-yellow-400 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <select
                      id="region"
                      className="w-full text-white bg-gray-700/80 border border-gray-600/50 rounded-2xl pl-12 pr-6 py-3 text-base font-satoshi font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 hover:bg-gray-600/80 backdrop-blur-sm appearance-none cursor-pointer"
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

                {/* Enhanced Error Message with CORS Help */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="text-center py-4 px-5 rounded-2xl bg-red-900/50 border border-red-700/50 text-red-300 font-satoshi text-sm font-medium backdrop-blur-sm"
                    >
                      <div className="text-red-300 mb-2">{error}</div>
                      
                      {errorDetails && (
                        <div className="text-xs text-red-400 mb-2">
                          {errorDetails.statusCode && `Status: ${errorDetails.statusCode}`}
                          {errorDetails.name && ` • ${errorDetails.name}`}
                        </div>
                      )}
                      
                      {showCORSHelp && (
                        <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-600/30 rounded-lg text-xs text-yellow-300">
                          <div className="font-medium mb-2">🔧 CORS Configuration Required</div>
                          <div className="text-left space-y-1">
                            <div>• Go to your S3 bucket → Permissions → CORS</div>
                            <div>• Add this origin: <code className="bg-yellow-800/50 px-1 rounded">{window.location.origin}</code></div>
                            <div>• Allow methods: GET, PUT, POST, DELETE, HEAD</div>
                            <div>• See CORS_SETUP_GUIDE.md for detailed instructions</div>
                          </div>
                          <button
                            onClick={() => {
                              const corsConfig = JSON.stringify(generateCORSConfig(), null, 2);
                              navigator.clipboard.writeText(corsConfig);
                              alert('CORS configuration copied to clipboard!');
                            }}
                            className="mt-2 text-xs bg-yellow-600/20 hover:bg-yellow-600/30 px-2 py-1 rounded transition-colors"
                          >
                            Copy CORS Config
                          </button>
                        </div>
                      )}
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
                    <div className="space-y-3">
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
                          showTeamCreation ? "Create Team & Connect" : "Connect to AWS"
                        )}
                      </motion.button>
                      
                      {/* Generate Team Link Button */}
                      {showTeamCreation && (
                        <motion.button
                          type="button"
                          className="w-full text-blue-300 font-medium py-3 px-6 rounded-2xl text-sm font-satoshi transition-all duration-300 bg-blue-900/30 hover:bg-blue-800/40 border border-blue-600/30 hover:border-blue-500/50"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={generateTeamLink}
                          disabled={!teamName || !accessKey || !secretKey || !bucket}
                        >
                          Generate Team Invite Link
                        </motion.button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <motion.button
                        type="button"
                        className="w-full text-white font-bold py-4 px-8 rounded-3xl text-base font-satoshi transition-all duration-300 bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 shadow-lg hover:shadow-xl border border-gray-400/30"
                        whileHover={{ scale: 1.02, boxShadow: '0 20px 40px -10px rgba(107, 114, 128, 0.4)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDisconnect}
                      >
                        Disconnect
                      </motion.button>
                      
                      {/* Generate/Copy Team Link for connected teams */}
                      {teamMode && (
                        <motion.button
                          type="button"
                          className="w-full text-blue-300 font-medium py-3 px-6 rounded-2xl text-sm font-satoshi transition-all duration-300 bg-blue-900/30 hover:bg-blue-800/40 border border-blue-600/30 hover:border-blue-500/50"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={generatedTeamLink ? copyTeamLink : generateTeamLink}
                        >
                          {generatedTeamLink ? "Copy Team Link" : "Generate Team Link"}
                        </motion.button>
                      )}
                    </div>
                  )}
                </motion.div>

                {/* Team Link Display */}
                <AnimatePresence>
                  {generatedTeamLink && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="text-center py-4 px-5 rounded-2xl bg-green-900/30 border border-green-600/30 text-green-300 font-satoshi text-sm backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-center mb-2">
                        <svg className="w-4 h-4 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span className="font-medium">Team Link Generated!</span>
                      </div>
                      <div className="text-xs text-green-200 mb-3 break-all bg-green-800/20 p-2 rounded-lg">
                        {generatedTeamLink}
                      </div>
                      <div className="text-xs text-green-300">
                        Share this link with your team members to join with the same credentials.
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
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