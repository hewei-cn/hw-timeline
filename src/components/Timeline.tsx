import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import TimelineHead from "./TimelineHead";

interface AnimationSegment {
  id: string;
  startTime: number;
  endTime: number;
  color: string;
}

interface TimelineProps {
  segments: AnimationSegment[];
  onSegmentChange: (segments: AnimationSegment[]) => void;
  totalDuration: number; // 总时长
  snapFrame?: number; // 吸附距离（帧数）
  fps?: number; // 帧率
  onDelete?: () => void;
  enabled?: boolean;
  onToggleEnabled?: (enabled: boolean) => void;
  timelineHeadWidth?: number;
  minScale?: number;
  maxScale?: number;
  name?: string;
  scale: number;
  onSegmentUpdate?: (segment: AnimationSegment | null) => void;
}

const TimelineWrapper = styled.div`
  display: flex;
  width: 100%;
  align-items: stretch;
`;

const TimelineContainer = styled.div`
  flex: 1;
  height: 32px;
  background: #2a2a2a;
  position: relative;
  border-radius: 1px;
  padding: 1px;
  overflow: hidden;
`;

const TimelineTrack = styled.div<{ $totalDuration: number; $scale: number }>`
  flex: 1;
  height: 32px;
  background: #1a1a1a;
  position: relative;
  overflow: hidden;
`;

const TrackContent = styled.div<{ $scale: number }>`
  width: ${props => 100 * props.$scale}%;
  height: 100%;
  position: relative;
  transform-origin: left top;
`;

const Segment = styled.div<{
  $start: number;
  $end: number;
  $color: string;
  $isGhost?: boolean;
  $isSelected?: boolean;
  $totalDuration: number;
}>`
  position: absolute;
  height: 100%;
  background: ${(props: { $color: string; $isGhost?: boolean }) =>
    props.$isGhost ? `${props.$color}30` : props.$color};
  left: ${(props: { $start: number }) => `${props.$start}%`};
  width: ${(props: { $start: number; $end: number }) =>
    `${props.$end - props.$start}%`};
  border-radius: 1px;
  cursor: move;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  transition: opacity 0.2s;
  box-sizing: border-box;
  border: ${(props: { $isGhost?: boolean; $isSelected?: boolean }) =>
    props.$isGhost
      ? "1px dashed white"
      : props.$isSelected
      ? "1px solid white"
      : "1px solid transparent"};

  &:hover {
    opacity: 0.8;
  }
`;

const ResizeHandle = styled.div<{ $position: "left" | "right" }>`
  position: absolute;
  top: 0;
  ${(props) => props.$position}: -3px;
  width: 6px;
  height: 100%;
  cursor: ${(props) => (props.$position === "left" ? "w-resize" : "e-resize")};
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  opacity: 0;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

const Timeline: React.FC<TimelineProps> = ({
  segments,
  onSegmentChange,
  totalDuration,
  snapFrame = 5,
  fps = 30,
  onDelete,
  enabled = true,
  onToggleEnabled,
  timelineHeadWidth = 120,
  name = "Timeline",
  scale = 1,
  onSegmentUpdate,
}) => {
  const [draggingSegment, setDraggingSegment] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [initialStartTime, setInitialStartTime] = useState(0);
  const [initialEndTime, setInitialEndTime] = useState(0);
  const [resizeMode, setResizeMode] = useState<"left" | "right" | null>(null);
  const [ghostSegment, setGhostSegment] = useState<AnimationSegment | null>(
    null
  );
  const [lastValidPosition, setLastValidPosition] = useState<{
    startTime: number;
    endTime: number;
  } | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const snapDistance = (snapFrame * 1) / fps;

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedSegment) {
        const newSegments = segments.filter(
          (segment) => segment.id !== selectedSegment
        );
        onSegmentChange(newSegments);
        setSelectedSegment(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedSegment, segments, onSegmentChange]);

  // 将百分比转换为帧数
  const percentToFrames = (percent: number): number => {
    const totalFrames = totalDuration * fps;
    return Math.round((percent / 100) * totalFrames);
  };

  // 将帧数转换为百分比
  const framesToPercent = (frames: number): number => {
    const totalFrames = totalDuration * fps;
    return (frames / totalFrames) * 100;
  };

  // 将时间对齐到最近的帧
  const snapToFrame = (percent: number): number => {
    const frames = percentToFrames(percent);
    return framesToPercent(frames);
  };

  const isValidPosition = (
    currentSegment: AnimationSegment,
    startTime: number,
    endTime: number
  ): boolean => {
    const minDuration = 1;
    if (endTime - startTime < minDuration) return false;
    if (startTime < 0 || endTime > totalDuration) return false;

    return !segments.some((segment) => {
      if (segment.id === currentSegment.id) return false;
      return (
        (startTime >= segment.startTime && startTime < segment.endTime) ||
        (endTime > segment.startTime && endTime <= segment.endTime) ||
        (startTime <= segment.startTime && endTime >= segment.endTime)
      );
    });
  };

  // 找到有效的位置
  const findValidPosition = (
    currentSegment: AnimationSegment,
    startTime: number,
    endTime: number
  ): { startTime: number; endTime: number } | null => {
    // 对齐到帧
    const snappedStartTime = snapToFrame(startTime);
    const snappedEndTime = snapToFrame(endTime);
    const duration = snapToFrame(endTime - startTime);

    if (isValidPosition(currentSegment, snappedStartTime, snappedEndTime)) {
      return { startTime: snappedStartTime, endTime: snappedEndTime };
    }

    if (lastValidPosition) {
      const lastDuration =
        lastValidPosition.endTime - lastValidPosition.startTime;
      if (Math.abs(lastDuration - duration) < 0.1) {
        const offset = startTime - lastValidPosition.startTime;
        const newStartTime = Math.max(
          0,
          Math.min(totalDuration - duration, startTime + offset)
        );
        const newEndTime = newStartTime + duration;
        const snappedNewStartTime = snapToFrame(newStartTime);
        const snappedNewEndTime = snapToFrame(newEndTime);
        if (
          isValidPosition(
            currentSegment,
            snappedNewStartTime,
            snappedNewEndTime
          )
        ) {
          return { startTime: snappedNewStartTime, endTime: snappedNewEndTime };
        }
      }
    }

    const searchRange = 10;
    const step = 1 / fps;

    const direction = startTime > (lastValidPosition?.startTime ?? 0) ? 1 : -1;
    for (let offset = 0; offset <= searchRange; offset += step) {
      const newStartTime = Math.max(
        0,
        Math.min(totalDuration - duration, startTime + offset * direction)
      );
      const newEndTime = newStartTime + duration;
      const snappedNewStartTime = snapToFrame(newStartTime);
      const snappedNewEndTime = snapToFrame(newEndTime);
      if (
        isValidPosition(currentSegment, snappedNewStartTime, snappedNewEndTime)
      ) {
        return { startTime: snappedNewStartTime, endTime: snappedNewEndTime };
      }
    }

    for (let offset = 0; offset <= searchRange; offset += step) {
      const newStartTime = Math.max(
        0,
        Math.min(totalDuration - duration, startTime - offset * direction)
      );
      const newEndTime = newStartTime + duration;
      const snappedNewStartTime = snapToFrame(newStartTime);
      const snappedNewEndTime = snapToFrame(newEndTime);
      if (
        isValidPosition(currentSegment, snappedNewStartTime, snappedNewEndTime)
      ) {
        return { startTime: snappedNewStartTime, endTime: snappedNewEndTime };
      }
    }

    return null;
  };

  const findSnapPosition = (
    currentSegment: AnimationSegment,
    newStartTime: number,
    newEndTime: number
  ): { startTime: number; endTime: number } => {
    let finalStartTime = newStartTime;
    let finalEndTime = newEndTime;
    const duration = newEndTime - newStartTime;
    const minDuration = 5;

    // 找到目标位置附近的片段
    const nearbySegments = segments
      .filter((segment) => segment.id !== currentSegment.id)
      .sort((a, b) => {
        const distA = Math.min(
          Math.abs(newStartTime - a.endTime),
          Math.abs(newEndTime - a.startTime)
        );
        const distB = Math.min(
          Math.abs(newStartTime - b.endTime),
          Math.abs(newEndTime - b.startTime)
        );
        return distA - distB;
      });

    // 检查是否在两个片段之间
    if (nearbySegments.length >= 2) {
      const [segment1, segment2] = nearbySegments;
      const gap = Math.min(
        segment2.startTime - segment1.endTime,
        segment1.startTime - segment2.endTime
      );

      // 如果间隙太小，尝试调整位置
      if (gap < duration && gap >= minDuration) {
        if (resizeMode === "left") {
          // 如果是左调整，尽量靠近左边的片段
          finalStartTime = segment1.endTime;
          finalEndTime = finalStartTime + duration;
        } else if (resizeMode === "right") {
          // 如果是右调整，尽量靠近右边的片段
          finalEndTime = segment2.startTime;
          finalStartTime = finalEndTime - duration;
        } else {
          // 如果是移动，尝试在间隙中居中
          const center = (segment1.endTime + segment2.startTime) / 2;
          finalStartTime = center - duration / 2;
          finalEndTime = center + duration / 2;
        }
      }
    }

    // 检查与单个片段的吸附
    segments.forEach((segment) => {
      if (segment.id === currentSegment.id) return;

      if (
        (resizeMode === "left" || resizeMode === null) &&
        Math.abs(newStartTime - segment.endTime) <= snapDistance
      ) {
        finalStartTime = segment.endTime;
      }
      if (
        (resizeMode === "right" || resizeMode === null) &&
        Math.abs(newEndTime - segment.startTime) <= snapDistance
      ) {
        finalEndTime = segment.startTime;
      }
      if (resizeMode === null) {
        const segmentMiddle = (segment.startTime + segment.endTime) / 2;
        if (Math.abs(newStartTime - segmentMiddle) <= snapDistance) {
          finalStartTime = segmentMiddle;
        }
        if (Math.abs(newEndTime - segmentMiddle) <= snapDistance) {
          finalEndTime = segmentMiddle;
        }
      }
    });

    // 确保最小持续时间
    if (finalEndTime - finalStartTime < minDuration) {
      if (resizeMode === "left") {
        finalStartTime = finalEndTime - minDuration;
      } else if (resizeMode === "right") {
        finalEndTime = finalStartTime + minDuration;
      }
    }

    // 对齐到帧
    finalStartTime = snapToFrame(finalStartTime);
    finalEndTime = snapToFrame(finalEndTime);

    // 确保在有效范围内
    return {
      startTime: Math.max(
        0,
        Math.min(totalDuration - minDuration, finalStartTime)
      ),
      endTime: Math.min(totalDuration, Math.max(minDuration, finalEndTime)),
    };
  };

  const handleMouseDown = (
    e: React.MouseEvent,
    segmentId: string,
    mode: "move" | "left" | "right"
  ) => {
    const segment = segments.find((s) => s.id === segmentId);
    if (!segment) return;

    setSelectedSegment(segmentId);
    setDraggingSegment(segmentId);
    setDragStartX(e.clientX);
    setInitialStartTime(segment.startTime);
    setInitialEndTime(segment.endTime);
    setResizeMode(mode === "move" ? null : mode);
    setGhostSegment(null);
    setLastValidPosition(null);
    onSegmentUpdate?.(segment);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingSegment || !timelineRef.current) return;

    const timelineRect = timelineRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStartX;
    const deltaPercent = (deltaX / (timelineRect.width * scale)) * 100;

    const newSegments = segments.map((segment) => {
      if (segment.id === draggingSegment) {
        let newStartTime = segment.startTime;
        let newEndTime = segment.endTime;

        if (resizeMode === "left") {
          newStartTime = Math.max(
            0,
            Math.min(initialEndTime - 5, initialStartTime + deltaPercent)
          );
        } else if (resizeMode === "right") {
          newEndTime = Math.min(
            totalDuration,
            Math.max(initialStartTime + 5, initialEndTime + deltaPercent)
          );
        } else {
          const duration = initialEndTime - initialStartTime;
          newStartTime = Math.max(
            0,
            Math.min(totalDuration - duration, initialStartTime + deltaPercent)
          );
          newEndTime = newStartTime + duration;
        }

        const { startTime, endTime } = findSnapPosition(
          segment,
          newStartTime,
          newEndTime
        );

        if (!isValidPosition(segment, startTime, endTime)) {
          const validPosition = findValidPosition(segment, startTime, endTime);
          if (validPosition) {
            setLastValidPosition(validPosition);
            setGhostSegment({
              ...segment,
              startTime: validPosition.startTime,
              endTime: validPosition.endTime,
            });
            onSegmentUpdate?.({
              ...segment,
              startTime: validPosition.startTime,
              endTime: validPosition.endTime,
            });
          }
        } else {
          setLastValidPosition({ startTime, endTime });
          setGhostSegment(null);
          onSegmentUpdate?.({
            ...segment,
            startTime,
            endTime,
          });
        }

        return { ...segment, startTime, endTime };
      }
      return segment;
    });

    onSegmentChange(newSegments);
  };

  const handleMouseUp = () => {
    if (draggingSegment && ghostSegment) {
      const newSegments = segments.map((segment) => {
        if (segment.id === draggingSegment) {
          return ghostSegment;
        }
        return segment;
      });
      onSegmentChange(newSegments);
    }
    setDraggingSegment(null);
    setResizeMode(null);
    setGhostSegment(null);
    setLastValidPosition(null);
    onSegmentUpdate?.(null);
  };

  useEffect(() => {
    if (draggingSegment) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    draggingSegment,
    dragStartX,
    initialStartTime,
    initialEndTime,
    resizeMode,
    ghostSegment,
    lastValidPosition,
  ]);

  // 格式化时间显示
  const formatDuration = (startTime: number, endTime: number): string => {
    const duration = endTime - startTime;
    const seconds = duration.toFixed(1);
    return `${seconds}s`;
  };

  return (
    <TimelineWrapper>
      <TimelineHead
        width={timelineHeadWidth}
        enabled={enabled}
        name={name}
        onToggleEnabled={onToggleEnabled}
        onDelete={onDelete}
      />
      <TimelineContainer data-testid="timeline-container">
        <TimelineTrack
          ref={timelineRef}
          $totalDuration={totalDuration}
          $scale={scale}
          data-testid="timeline-track"
        >
          <TrackContent $scale={scale}>
            {segments.map((segment) => (
              <Segment
                key={segment.id}
                $start={segment.startTime}
                $end={segment.endTime}
                $color={segment.color}
                $isSelected={segment.id === selectedSegment}
                $totalDuration={totalDuration}
                onMouseDown={(e: React.MouseEvent) =>
                  handleMouseDown(e, segment.id, "move")
                }
              >
                {formatDuration(segment.startTime, segment.endTime)}
                <ResizeHandle
                  $position="left"
                  onMouseDown={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleMouseDown(e, segment.id, "left");
                  }}
                />
                <ResizeHandle
                  $position="right"
                  onMouseDown={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleMouseDown(e, segment.id, "right");
                  }}
                />
              </Segment>
            ))}
            {ghostSegment && (
              <Segment
                key={`ghost-${ghostSegment.id}`}
                $start={ghostSegment.startTime}
                $end={ghostSegment.endTime}
                $color={ghostSegment.color}
                $isGhost={true}
                $totalDuration={totalDuration}
              >
                {formatDuration(ghostSegment.startTime, ghostSegment.endTime)}
              </Segment>
            )}
          </TrackContent>
        </TimelineTrack>
      </TimelineContainer>
    </TimelineWrapper>
  );
};

export default Timeline;

