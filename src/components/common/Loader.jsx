import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

export default function Loader({ className = "", overlay = false }) {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return ".";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  if (overlay) {
    return (
      <OverlayWrapper className={className}>
        <StyledLoader />
        <LoadingText>Loading{dots}</LoadingText>
      </OverlayWrapper>
    );
  }

  return (
    <InlineWrapper className={className}>
      <StyledLoader />
      <LoadingText>Loading{dots}</LoadingText>
    </InlineWrapper>
  );
}

const OverlayWrapper = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 52px;
`;

const InlineWrapper = styled.div`
  width: 100%;
  height: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 88px;
`;

const StyledLoader = styled.div`
  width: 148px;
  height: 148px;
  border-radius: 50%;
  background-color: #ccc;
  background-image: radial-gradient(#4285f4 4px, #0000 0),
    radial-gradient(#ea4335 4px, #0000 0), 
    radial-gradient(#fbbc05 4px, #0000 0),
    radial-gradient(#34a853 4px, #0000 0);
  background-position:
    24px center,
    8px center,
    -8px center,
    -24px center;
  position: relative;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.15) inset;
  animation: flash 1s linear infinite;

  &::before,
  &::after {
    content: "";
    position: absolute;
    border: 1px solid #ccc;
    border-top-color: #0000;
    left: 50%;
    top: 100%;
    transform: translateX(-50%);
    width: 16px;
    height: 18px;
    background: #fff;
  }

  &::before {
    width: 0px;
    height: 64px;
    transform: translate(-50%, 18px);
  }

  @keyframes flash {
    0% {
      background-image: radial-gradient(#4285f4 4px, #0000 0),
        radial-gradient(#ea4335 4px, #0000 0),
        radial-gradient(#fbbc05 4px, #0000 0),
        radial-gradient(#34a853 4px, #0000 0);
    }
    25% {
      background-image: radial-gradient(#ea4335 4px, #0000 0),
        radial-gradient(#fbbc05 4px, #0000 0),
        radial-gradient(#34a853 4px, #0000 0),
        radial-gradient(#4285f4 4px, #0000 0);
    }
    50% {
      background-image: radial-gradient(#fbbc05 4px, #0000 0),
        radial-gradient(#34a853 4px, #0000 0),
        radial-gradient(#4285f4 4px, #0000 0),
        radial-gradient(#ea4335 4px, #0000 0);
    }
    75% {
      background-image: radial-gradient(#34a853 4px, #0000 0),
        radial-gradient(#4285f4 4px, #0000 0),
        radial-gradient(#ea4335 4px, #0000 0),
        radial-gradient(#fbbc05 4px, #0000 0);
    }
    100% {
      background-image: radial-gradient(#4285f4 4px, #0000 0),
        radial-gradient(#ea4335 4px, #0000 0),
        radial-gradient(#fbbc05 4px, #0000 0),
        radial-gradient(#34a853 4px, #0000 0);
    }
  }
`;

const LoadingText = styled.p`
  margin: 0;
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
  text-align: center;
`;
