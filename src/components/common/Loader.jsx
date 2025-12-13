import React from 'react';
import styled from 'styled-components';

export default function Loader({ className = "", overlay = false }) {
  if (overlay) {
    return (
      <OverlayWrapper className={className}>
        <StyledLoader>
          <Dot />
          <Dot />
          <Dot />
        </StyledLoader>
      </OverlayWrapper>
    );
  }

  return (
    <InlineWrapper className={className}>
      <StyledLoader>
        <Dot />
        <Dot />
        <Dot />
      </StyledLoader>
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const Dot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #0ea5e9; /* snowblue color */
  animation: bounce 1.4s ease-in-out infinite both;

  &:nth-child(1) {
    animation-delay: -0.32s;
  }

  &:nth-child(2) {
    animation-delay: -0.16s;
  }

  &:nth-child(3) {
    animation-delay: 0s;
  }

  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
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
