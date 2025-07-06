import React, { useState, useRef, useEffect } from 'react';

const CustomDropdown = ({ options, selectedValue, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleOptionClick = (value) => {
    onChange(value);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(option => option.value === selectedValue);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div>
        <button
          type="button"
          className="inline-flex justify-between w-full rounded-md border border-neutral-borders px-4 py-2 bg-[#E0E0E0] text-sm font-medium text-text-primary hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
          onClick={() => setIsOpen(!isOpen)}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <svg
            className="-mr-1 ml-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-44 rounded-md shadow-lg bg-[#E0E0E0] ring-1 ring-black ring-opacity-5 z-50">
          <div className="pb-1 text-center" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {options.map((option) => (
              <a
                key={option.value}
                href="#"
                className={`${
                  selectedValue === option.value ? 'bg-gray-200 text-text-primary' : 'text-text-secondary'
                } block px-4 py-2 text-sm hover:bg-gray-200`}
                onClick={(e) => {
                  e.preventDefault();
                  handleOptionClick(option.value);
                }}
                role="menuitem"
              >
                {option.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
