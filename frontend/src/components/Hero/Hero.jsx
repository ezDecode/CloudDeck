import React from 'react';
import { Link } from 'react-router-dom';
import { Fade, Slide } from 'react-awesome-reveal';
const Hero = ({ onConnectWallet }) => {
  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center px-4 sm:px-6 md:px-8">
      <div className="max-w-[900px] mx-auto text-center">
        {/* Main Headline */}
        <Slide direction="up" triggerOnce>
          <Fade triggerOnce>
            <h1 className="text-[36px] sm:text-[48px] md:text-[72px] lg:text-[80px] leading-tight font-[900] text-text-primary mb-6 md:mb-8">
              Your S3 <span className="animated-gradient-text italic">Buckets</span>.
              <br />
              Zero <span className="animated-gradient-text italic">Console</span> Hassle!
            </h1>
          </Fade>
        </Slide>
        
        {/* Description */}
        <Slide direction="up" delay={500} triggerOnce>
          <Fade delay={500} triggerOnce>
            <p className="text-[18px] sm:text-[20px] md:text-[28px] lg:text-[32px] leading-relaxed text-text-primary mb-8 md:mb-12 max-w-[800px] mx-auto px-4 font-[400]">
              Bring your own keys, connect once, and manage files directly from the browser—no setup, no servers.
            </p>
          </Fade>
        </Slide>
        
        {/* CTA Button */}
        <Slide direction="up" delay={1000} triggerOnce>
          <Fade delay={1000} triggerOnce>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <button 
                onClick={onConnectWallet}
                className="w-full sm:w-auto bg-text-primary text-neutral-white text-[16px] sm:text-[18px] md:text-[24px] font-[600] px-6 py-3 sm:px-8 sm:py-4 md:px-12 md:py-6 rounded-[32px] border-none cursor-pointer transition-all duration-300 hover:bg-[#333333] transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-text-primary/30 shadow-lg hover:shadow-xl"
              >
                Add your bucket
              </button>
              <Link to="/setup-guide" className="w-full sm:w-auto">
                <button 
                  className="w-full sm:w-auto bg-transparent text-text-primary text-[16px] sm:text-[18px] md:text-[24px] font-[600] px-6 py-3 sm:px-8 sm:py-4 md:px-12 md:py-6 rounded-[32px] border-2 border-text-primary cursor-pointer transition-all duration-300 hover:bg-text-primary hover:text-neutral-white transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-text-primary/30 shadow-lg hover:shadow-xl"
                >
                  Setup Guide
                </button>
              </Link>
            </div>
          </Fade>
        </Slide>
      </div>
    </div>
  );
};

export default Hero;
