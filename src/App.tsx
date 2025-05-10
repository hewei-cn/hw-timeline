import { useState, useMemo } from 'react'
import Timeline from './components/Timeline'
import TimelineGroup from './components/TimelineGroup'
import './App.css'

// 生成随机颜色
const generateRandomColor = () => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFD93D', '#FF8B94',
    '#9B59B6', '#3498DB', '#E74C3C', '#2ECC71', '#F1C40F', '#1ABC9C'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// 生成单个时间轴的片段
const generateTimelineSegments = () => {
  const segments = [];
  const totalDuration = 60; // 总时长60秒
  const minDuration = 5; // 最小持续时间5秒
  const maxDuration = 15; // 最大持续时间15秒
  const minGap = 2; // 最小间隔2秒

  let currentTime = 0;
  const segmentCount = Math.floor(Math.random() * 4) + 1; // 每个时间轴1-3个片段

  for (let i = 0; i < segmentCount; i++) {
    if (currentTime >= totalDuration) break;

    const duration = Math.floor(Math.random() * (maxDuration - minDuration + 1)) + minDuration;
    if (currentTime + duration > totalDuration) break;

    segments.push({
      id: `${i + 1}`,
      startTime: (currentTime / totalDuration) * 100,
      endTime: ((currentTime + duration) / totalDuration) * 100,
      color: generateRandomColor()
    });

    currentTime += duration + minGap;
  }

  return segments;
};

// 生成100个时间轴的数据
const generateTimelines = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `timeline-${index + 1}`,
    name: `Timeline ${index + 1}`,
    segments: generateTimelineSegments(),
    enabled: true
  }));
};

function App() {
  // 使用 useMemo 缓存测试数据
  const initialTimelines = useMemo(() => generateTimelines(10), []);
  const [timelines, setTimelines] = useState(initialTimelines);

  // TimelineGroup 测试数据
  const groupTestData = useMemo(() => generateTimelines(6), []);
  const [groupTimelines, setGroupTimelines] = useState(groupTestData);

  const handleSegmentChange = (timelineId: string, newSegments: any[]) => {
    setTimelines(prev => prev.map(timeline => 
      timeline.id === timelineId 
        ? { ...timeline, segments: newSegments }
        : timeline
    ));
  };

  const handleToggleEnabled = (timelineId: string, enabled: boolean) => {
    setTimelines(prev => prev.map(timeline => 
      timeline.id === timelineId 
        ? { ...timeline, enabled }
        : timeline
    ));
  };

  const handleDelete = (timelineId: string) => {
    setTimelines(prev => prev.filter(timeline => timeline.id !== timelineId));
  };

  // TimelineGroup 事件处理函数
  const handleGroupTimelineChange = (newTimelines: any[]) => {
    setGroupTimelines(newTimelines);
  };

  const handleGroupTimelineDelete = (timelineId: string) => {
    setGroupTimelines(prev => prev.filter(timeline => timeline.id !== timelineId));
  };

  return (
    <div className="app-container">
      <h1>Animation Timeline</h1>
      
      {/* 原始 Timeline 测试区域 */}
      <div className="timeline-info">
        <p>Total Timelines: {timelines.length}</p>
      </div>
      <div className="timelines-container">
        {timelines.map(timeline => (
          <Timeline
            key={timeline.id}
            segments={timeline.segments}
            onSegmentChange={(segments) => handleSegmentChange(timeline.id, segments)}
            totalDuration={100}
            fps={30}
            enabled={timeline.enabled}
            onToggleEnabled={(enabled) => handleToggleEnabled(timeline.id, enabled)}
            onDelete={() => handleDelete(timeline.id)}
            timelineHeadWidth={145}
            name={timeline.name}
            scale={1}
          />
        ))}
      </div>

      {/* TimelineGroup 测试区域 */}
      <h2>TimelineGroup Test</h2>
      <div className="timeline-group-container">
        <TimelineGroup
          timelines={groupTimelines}
          totalDuration={100}
          fps={30}
          onTimelineChange={handleGroupTimelineChange}
          onTimelineDelete={handleGroupTimelineDelete}
          timelineHeadWidth={150}
        />
      </div>
    </div>
  )
}

export default App
