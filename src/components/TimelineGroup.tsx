import React, { useState, useCallback } from "react";
import styled from "styled-components";
import Timeline from "./Timeline";
import TimeRuler from "./TimeRuler";

interface AnimationSegment {
  id: string;
  startTime: number;
  endTime: number;
  color: string;
}

interface TimelineData {
  id: string;
  name: string;
  segments: AnimationSegment[];
  enabled: boolean;
}

interface TimelineGroupProps {
  timelines: TimelineData[];
  totalDuration: number;
  fps?: number;
  onTimelineChange: (timelines: TimelineData[]) => void;
  onTimelineDelete?: (timelineId: string) => void;
  timelineHeadWidth?: number;
}

const GroupContainer = styled.div`
  width: 100%;
  overflow: hidden;
  position: relative;
  margin: 0;
  padding: 0;
`;

const TimelineGroup: React.FC<TimelineGroupProps> = ({
  timelines,
  totalDuration,
  fps = 30,
  onTimelineChange,
  onTimelineDelete,
  timelineHeadWidth = 150,
}) => {
  const [scale, setScale] = useState(1);
  const [activeSegment, setActiveSegment] = useState<{
    startTime: number;
    endTime: number;
  } | undefined>(undefined);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prevScale => {
      const newScale = Math.max(0.5, Math.min(3, prevScale + delta));
      return Number(newScale.toFixed(1));
    });
  }, []);

  const handleSegmentChange = (
    timelineId: string,
    segments: AnimationSegment[]
  ) => {
    onTimelineChange(
      timelines.map((timeline) =>
        timeline.id === timelineId ? { ...timeline, segments } : timeline
      )
    );
  };

  const handleToggleEnabled = (timelineId: string, enabled: boolean) => {
    onTimelineChange(
      timelines.map((timeline) =>
        timeline.id === timelineId ? { ...timeline, enabled } : timeline
      )
    );
  };

  const handleSegmentUpdate = (segment: AnimationSegment | null) => {
    setActiveSegment(segment ? {
      startTime: segment.startTime,
      endTime: segment.endTime
    } : undefined);
  };

  return (
    <GroupContainer onWheel={handleWheel}>
      <TimeRuler 
        totalDuration={totalDuration} 
        width={100} 
        timelineHeadWidth={timelineHeadWidth}
        scale={scale}
        selectedSegment={activeSegment}
      />
      {timelines.map((timeline) => (
        <Timeline
          key={timeline.id}
          segments={timeline.segments}
          onSegmentChange={(segments) =>
            handleSegmentChange(timeline.id, segments)
          }
          totalDuration={totalDuration}
          fps={fps}
          enabled={timeline.enabled}
          onToggleEnabled={(enabled) =>
            handleToggleEnabled(timeline.id, enabled)
          }
          onDelete={
            onTimelineDelete ? () => onTimelineDelete(timeline.id) : undefined
          }
          timelineHeadWidth={timelineHeadWidth}
          name={timeline.name}
          scale={scale}
          onSegmentUpdate={handleSegmentUpdate}
        />
      ))}
    </GroupContainer>
  );
};

export default TimelineGroup;
