import React from 'react';
import styled from 'styled-components';

interface TimelineHeadProps {
  width?: number;
  enabled?: boolean;
  name?: string;
  onToggleEnabled?: (enabled: boolean) => void;
  onDelete?: () => void;
}

const HeadContainer = styled.div<{ $width?: number }>`
  width: ${props => props.$width || 120}px;
  height: 32px;
  background: #2a2a2a;
  border-radius: 1px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
`;

const Name = styled.span`
  color: #fff;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  text-align: left;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const Button = styled.button`
  background: #444;
  border: none;
  color: white;
  width: 18px;
  height: 18px;
  border-radius: 1px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  padding: 0;
  line-height: 1;
  
  &:hover {
    background: #555;
  }
  
  &:disabled {
    background: #333;
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const TimelineHead: React.FC<TimelineHeadProps> = ({
  width,
  enabled = true,
  name = "Timeline",
  onToggleEnabled,
  onDelete
}) => {
  return (
    <HeadContainer $width={width}>
      <Name>{name}</Name>
      <Controls>
        <Button
          onClick={() => onToggleEnabled?.(!enabled)}
          disabled={!onToggleEnabled}
          aria-label={enabled ? 'Disable timeline' : 'Enable timeline'}
        >
          {enabled ? "✓" : "x"}
        </Button>
        {onDelete && (
          <Button 
            onClick={onDelete}
            aria-label="Delete timeline"
          >
            ×
          </Button>
        )}
      </Controls>
    </HeadContainer>
  );
};

export default TimelineHead; 