import React from 'react';

const Hero = ({ onConnectWallet }) => {
  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center px-6 md:px-8">
      <div className="max-w-[900px] mx-auto text-center">
        {/* Main Headline */}
        <h1 className="text-[48px] md:text-[72px] lg:text-[80px] leading-[1.1] font-[900] text-text-primary mb-6 md:mb-8">
          Your S3 <span className="italic font-[900]">Buckets</span>.
          <br />
          Zero <span className="italic font-[900]">Console</span> Hassle!
        </h1>
        
        {/* Description */}
        <p className="text-[20px] md:text-[28px] lg:text-[32px] leading-[1.4] text-text-primary mb-8 md:mb-12 max-w-[800px] mx-auto px-4 font-[400]">
          Bring your own keys, connect once, and manage files directly from the browser—no setup, no servers.
        </p>
        
        {/* CTA Button */}
        <button 
          onClick={onConnectWallet}
          className="bg-text-primary text-neutral-white text-[18px] md:text-[24px] font-[600] px-8 md:px-12 py-4 md:py-6 rounded-[32px] border-none cursor-pointer transition-all duration-300 hover:bg-[#333333] transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-text-primary/30 shadow-lg hover:shadow-xl"
        >
          Add your bucket
        </button>
      </div>
    </div>
  );
};

export default Hero;
