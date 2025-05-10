import React from "react";
import styled from "styled-components";

interface TimeRulerProps {
  totalDuration: number;
  width: number;
  timelineHeadWidth: number;
  scale: number;
  selectedSegment?: {
    startTime: number;
    endTime: number;
  };
}

const RulerContainer = styled.div<{ $timelineHeadWidth: number; $scale: number }>`
  width: calc(100% - ${props => props.$timelineHeadWidth+16}px);
  height: 28px;
  background: #2a2a2a;
  position: relative;
  border-bottom: 1px solid #3a3a3a;
  margin-left: calc(${props => props.$timelineHeadWidth+16}px);
`;

const RulerContent = styled.div<{ $scale: number }>`
  width: ${props => 100 * props.$scale}%;
  height: 100%;
  position: relative;
  transform-origin: left top;
`;

const Tick = styled.div<{ $left: number }>`
  position: absolute;
  left: ${(props) => props.$left}%;
  width: 1px;
  height: 8px;
  background: #666;
  top: 0;
`;

const MajorTick = styled(Tick)`
  height: 12px;
  background: #888;
`;

const Label = styled.div<{ $left: number; $isFirst: boolean; $isLast: boolean }>`
  position: absolute;
  left: ${(props) => props.$left}%;
  transform: ${props => {
    if (props.$isFirst) return 'translateX(0)';
    if (props.$isLast) return 'translateX(-100%)';
    return 'translateX(-50%)';
  }};
  color: #888;
  font-size: 10px;
  top: 12px;
`;

const TimeIndicator = styled.div<{ $left: number }>`
  position: absolute;
  left: ${props => props.$left}%;
  transform: translateX(-50%);
  top: 0;
  height: 100%;
  width: 1px;
  background: #fff;
  pointer-events: none;
`;

const TimeLabel = styled.div<{ $left: number }>`
  position: absolute;
  left: ${props => props.$left}%;
  transform: translateX(-50%);
  color: #fff;
  font-size: 10px;
  top: 0px;
  background: rgba(0, 0, 0, 0.5);
  padding: 0 4px;
  border-radius: 2px;
  pointer-events: none;
`;

const TimeRuler: React.FC<TimeRulerProps> = ({ 
  totalDuration, 
  width, 
  timelineHeadWidth, 
  scale,
  selectedSegment 
}) => {
  const ticks = [];
  const majorTickInterval = 5; // 每5秒一个主刻度
  const minorTickInterval = 1; // 每1秒一个次刻度

  // 生成刻度
  for (let i = 0; i <= totalDuration; i += minorTickInterval) {
    const isMajorTick = i % majorTickInterval === 0;
    // 调整最后一个刻度的位置，确保它完全可见
    const left = i === totalDuration ? 99.9 : (i / totalDuration) * 100;
    const isFirst = i === 0;
    const isLast = i === totalDuration;
    
    ticks.push(
      <React.Fragment key={i}>
        {isMajorTick ? (
          <>
            <MajorTick $left={left} />
            <Label $left={left} $isFirst={isFirst} $isLast={isLast}>{i}s</Label>
          </>
        ) : (
          <Tick $left={left} />
        )}
      </React.Fragment>
    );
  }

  return (
    <RulerContainer $timelineHeadWidth={timelineHeadWidth} $scale={scale}>
      <RulerContent $scale={scale}>
        {ticks}
        {selectedSegment && (
          <>
            <TimeIndicator $left={(selectedSegment.startTime / totalDuration) * 100} />
            <TimeLabel $left={(selectedSegment.startTime / totalDuration) * 100}>
              {selectedSegment.startTime.toFixed(1)}s
            </TimeLabel>
            <TimeIndicator $left={(selectedSegment.endTime / totalDuration) * 100} />
            <TimeLabel $left={(selectedSegment.endTime / totalDuration) * 100}>
              {selectedSegment.endTime.toFixed(1)}s
            </TimeLabel>
          </>
        )}
      </RulerContent>
    </RulerContainer>
  );
};

export default TimeRuler; 