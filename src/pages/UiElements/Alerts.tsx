// components/Alert.tsx
import React from 'react';

type AlertProps = {
  type: 'success' | 'error';
  message: string;
};

const Alerts: React.FC<AlertProps> = ({ type, message }) => {
  const alertStyles = {
    success: 'border-[#34D399] bg-[#34D399] bg-opacity-[15%] text-[#34D399]',
    error: 'border-[#F87171] bg-[#F87171] bg-opacity-[15%] text-[#B45454]',
  };

  return (
    <div className={`flex w-full border-l-6 ${alertStyles[type]} px-7 py-8 shadow-md dark:bg-[#1B1B24] dark:bg-opacity-30 md:p-9`}>
      <div className="mr-5 flex h-9 w-9 items-center justify-center rounded-lg bg-opacity-30">
        {/* SVG Icon based on alert type */}
        {type === 'error' ? (
          <svg
            width="19"
            height="16"
            viewBox="0 0 19 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1.50493 16H17.5023C18.6204 16 19.3413 14.9018 18.8354 13.9735L10.8367 0.770573C10.2852 -0.256858 8.70677 -0.256858 8.15528 0.770573L0.156617 13.9735C-0.334072 14.8998 0.386764 16 1.50493 16ZM10.7585 12.9298C10.7585 13.6155 10.2223 14.1433 9.45583 14.1433C8.6894 14.1433 8.15311 13.6155 8.15311 12.9298V12.9015C8.15311 12.2159 8.6894 11.688 9.45583 11.688C10.2223 11.688 10.7585 12.2159 10.7585 12.9015V12.9298ZM8.75236 4.01062H10.2548C10.6674 4.01062 10.9127 4.33826 10.8671 4.75288L10.2071 10.1186C10.1615 10.5049 9.88572 10.7455 9.50142 10.7455C9.11929 10.7455 8.84138 10.5028 8.79579 10.1186L8.13574 4.75288C8.09449 4.33826 8.33984 4.01062 8.75236 4.01062Z"
              fill="#FBBF24"
            ></path>
          </svg>
        ) : (
          <svg
            width="16"
            height="12"
            viewBox="0 0 16 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.2984 0.826822L15.2868 0.811827L15.2741 0.797751C14.9173 0.401867 14.3238 0.400754 13.9657 0.794406L5.91888 9.45376L2.05667 5.2868C1.69856 4.89287 1.10487 4.89389 0.747996 5.28987C0.417335 5.65675 0.417335 6.22337 0.747996 6.59026L0.747959 6.59029L0.752701 6.59541L4.86742 11.0348C5.14445 11.3405 5.52858 11.5 5.89581 11.5C6.29242 11.5 6.65178 11.3355 6.92401 11.035L15.2162 2.11161C15.5833 1.74452 15.576 1.18615 15.2984 0.826822Z"
              fill="white"
              stroke="white"
            ></path>
          </svg>
        )}
      </div>
      <div className="w-full">
        <h5 className={`mb-3 text-lg font-semibold ${type === 'error' ? 'text-[#B45454]' : 'text-black dark:text-[#34D399]'}`}>
          {type === 'error' ? 'There were errors with your submission' : 'Success!'}
        </h5>
        <p className="leading-relaxed text-body">{message}</p>
      </div>
    </div>
  );
};

export default Alerts;
