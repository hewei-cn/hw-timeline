import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import Timeline from '../Timeline';

interface AnimationSegment {
  id: string;
  startTime: number;
  endTime: number;
  color: string;
}

describe('Timeline Component', () => {
  const mockSegments: AnimationSegment[] = [
    {
      id: '1',
      startTime: 10,
      endTime: 30,
      color: '#ff0000'
    },
    {
      id: '2',
      startTime: 40,
      endTime: 60,
      color: '#00ff00'
    }
  ];

  const defaultProps = {
    segments: mockSegments,
    onSegmentChange: jest.fn(),
    totalDuration: 100,
    snapFrame: 5,
    fps: 30,
    enabled: true,
    onToggleEnabled: jest.fn(),
    onDelete: jest.fn(),
    timelineHeadWidth: 120,
    minScale: 0.5,
    maxScale: 2,
    name: 'Test Timeline'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders timeline with segments', () => {
    render(<Timeline {...defaultProps} scale={1} />);
    
    // 检查是否渲染了所有片段
    mockSegments.forEach(segment => {
      expect(screen.getByText(segment.id)).toBeInTheDocument();
    });
  });

  it('handles segment selection', () => {
    render(<Timeline {...defaultProps} scale={1} />);
    
    // 点击第一个片段
    const firstSegment = screen.getByText('1');
    fireEvent.mouseDown(firstSegment);
    
    // 检查片段是否被选中（通过样式）
    expect(firstSegment).toHaveStyle({ border: '1px solid white' });
  });

  it('handles segment deletion', () => {
    render(<Timeline {...defaultProps} scale={1} />);
    
    // 选中第一个片段
    const firstSegment = screen.getByText('1');
    fireEvent.mouseDown(firstSegment);
    
    // 模拟按下删除键
    fireEvent.keyDown(document, { key: 'Delete' });
    
    // 检查 onSegmentChange 是否被调用，且不包含被删除的片段
    expect(defaultProps.onSegmentChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.not.objectContaining({ id: '1' })
      ])
    );
  });

  describe('Position Conflict Detection', () => {
    it('prevents overlapping segments', () => {
      const overlappingSegments: AnimationSegment[] = [
        {
          id: '1',
          startTime: 10,
          endTime: 30,
          color: '#ff0000'
        },
        {
          id: '2',
          startTime: 20, // 与第一个片段重叠
          endTime: 40,
          color: '#00ff00'
        }
      ];

      render(
        <Timeline
          {...defaultProps}
          segments={overlappingSegments}
          scale={1}
        />
      );

      // 尝试移动第二个片段
      const secondSegment = screen.getByText('2');
      fireEvent.mouseDown(secondSegment);
      fireEvent.mouseMove(document, { clientX: 100 });

      // 验证片段位置被修正，不再重叠
      expect(defaultProps.onSegmentChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: '2',
            startTime: expect.any(Number),
            endTime: expect.any(Number)
          })
        ])
      );

      // 获取更新后的片段
      const updatedSegments = defaultProps.onSegmentChange.mock.calls[0][0] as AnimationSegment[];
      const segment1 = updatedSegments.find((s: AnimationSegment) => s.id === '1');
      const segment2 = updatedSegments.find((s: AnimationSegment) => s.id === '2');

      // 验证片段不再重叠
      expect(segment1?.endTime).toBeLessThanOrEqual(segment2?.startTime ?? 0);
    });

    it('prevents segments from going out of bounds', () => {
      const outOfBoundsSegments: AnimationSegment[] = [
        {
          id: '1',
          startTime: -10, // 超出左边界
          endTime: 20,
          color: '#ff0000'
        }
      ];

      render(
        <Timeline
          {...defaultProps}
          segments={outOfBoundsSegments}
          scale={1}
        />
      );

      // 尝试移动片段
      const segment = screen.getByText('1');
      fireEvent.mouseDown(segment);
      fireEvent.mouseMove(document, { clientX: 100 });

      // 验证片段位置被修正到有效范围内
      expect(defaultProps.onSegmentChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            startTime: expect.any(Number),
            endTime: expect.any(Number)
          })
        ])
      );

      // 获取更新后的片段
      const updatedSegment = defaultProps.onSegmentChange.mock.calls[0][0][0] as AnimationSegment;
      expect(updatedSegment.startTime).toBeGreaterThanOrEqual(0);
      expect(updatedSegment.endTime).toBeLessThanOrEqual(defaultProps.totalDuration);
    });

    it('maintains minimum segment duration', () => {
      const shortSegment: AnimationSegment[] = [
        {
          id: '1',
          startTime: 10,
          endTime: 12, // 持续时间太短
          color: '#ff0000'
        }
      ];

      render(
        <Timeline
          {...defaultProps}
          segments={shortSegment}
          scale={1}
        />
      );

      // 尝试调整片段大小
      const segment = screen.getByText('1');
      const resizeHandle = segment.querySelector('[data-position="right"]');
      if (resizeHandle) {
        fireEvent.mouseDown(resizeHandle);
        fireEvent.mouseMove(document, { clientX: 50 });
      }

      // 验证片段持续时间被修正到最小值
      expect(defaultProps.onSegmentChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            startTime: expect.any(Number),
            endTime: expect.any(Number)
          })
        ])
      );

      // 获取更新后的片段
      const updatedSegment = defaultProps.onSegmentChange.mock.calls[0][0][0] as AnimationSegment;
      expect(updatedSegment.endTime - updatedSegment.startTime).toBeGreaterThanOrEqual(5); // 最小持续时间
    });

    it('handles multiple segment movements', () => {
      const multipleSegments: AnimationSegment[] = [
        {
          id: '1',
          startTime: 10,
          endTime: 30,
          color: '#ff0000'
        },
        {
          id: '2',
          startTime: 40,
          endTime: 60,
          color: '#00ff00'
        },
        {
          id: '3',
          startTime: 70,
          endTime: 90,
          color: '#0000ff'
        }
      ];

      render(
        <Timeline
          {...defaultProps}
          segments={multipleSegments}
          scale={1}
        />
      );

      // 尝试移动中间片段
      const middleSegment = screen.getByText('2');
      fireEvent.mouseDown(middleSegment);
      fireEvent.mouseMove(document, { clientX: 200 });

      // 验证所有片段位置都被正确更新
      expect(defaultProps.onSegmentChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: '1' }),
          expect.objectContaining({ id: '2' }),
          expect.objectContaining({ id: '3' })
        ])
      );

      // 获取更新后的片段
      const updatedSegments = defaultProps.onSegmentChange.mock.calls[0][0] as AnimationSegment[];
      
      // 验证片段顺序保持不变
      const segment1 = updatedSegments.find((s: AnimationSegment) => s.id === '1');
      const segment2 = updatedSegments.find((s: AnimationSegment) => s.id === '2');
      const segment3 = updatedSegments.find((s: AnimationSegment) => s.id === '3');

      expect(segment1?.endTime).toBeLessThanOrEqual(segment2?.startTime ?? 0);
      expect(segment2?.endTime).toBeLessThanOrEqual(segment3?.startTime ?? 0);
    });
  });

  describe('Position Validation', () => {
    it('validates segment positions correctly', () => {
      const initialSegments: AnimationSegment[] = [
        {
          id: '1',
          startTime: 20,
          endTime: 40,
          color: '#ff0000'
        }
      ];

      render(
        <Timeline
          {...defaultProps}
          segments={initialSegments}
          scale={1}
        />
      );

      const segment1 = screen.getByText('1');
      fireEvent.mouseDown(segment1);
      fireEvent.mouseMove(document, { clientX: 100 });
      expect(defaultProps.onSegmentChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            startTime: expect.any(Number),
            endTime: expect.any(Number)
          })
        ])
      );

      const updatedSegments = defaultProps.onSegmentChange.mock.calls[0][0] as AnimationSegment[];
      const lastSegment = updatedSegments[updatedSegments.length - 1];
      expect(lastSegment.startTime).toBeGreaterThanOrEqual(40);

      const segment = screen.getByText('1');
      fireEvent.mouseDown(segment);
      fireEvent.mouseMove(document, { clientX: 50 });
      const finalSegments = defaultProps.onSegmentChange.mock.calls[1][0] as AnimationSegment[];
      const movedSegment = finalSegments.find(s => s.id === '1');
      expect(movedSegment?.startTime).toBeGreaterThanOrEqual(25);


      const segment2 = screen.getByText('1');
      fireEvent.mouseDown(segment2);
      fireEvent.mouseMove(document, { clientX: 200 });
      const finalSegments2 = defaultProps.onSegmentChange.mock.calls[2][0] as AnimationSegment[];
      const movedSegment2 = finalSegments2.find(s => s.id === '1');
      expect(movedSegment2?.endTime).toBeLessThanOrEqual(defaultProps.totalDuration);


      const segment3 = screen.getByText('1');
      fireEvent.mouseDown(segment3);
      fireEvent.mouseMove(document, { clientX: 150 });
      const finalSegments3 = defaultProps.onSegmentChange.mock.calls[2][0] as AnimationSegment[];
      const movedSegment3 = finalSegments3.find(s => s.id === '1');
      expect(movedSegment3?.endTime && movedSegment3?.startTime ? 
        movedSegment3.endTime - movedSegment3.startTime : 0
      ).toBeGreaterThanOrEqual(5);
    });

    it('handles edge cases for position validation', () => {
      const edgeCaseSegments: AnimationSegment[] = [
        {
          id: '1',
          startTime: 0,
          endTime: 20,
          color: '#ff0000'
        },
        {
          id: '2',
          startTime: 80,
          endTime: 100,
          color: '#00ff00'
        }
      ];

      render(
        <Timeline
          {...defaultProps}
          segments={edgeCaseSegments}
          scale={1}
        />
      );

      const segment1 = screen.getByText('1');
      fireEvent.mouseDown(segment1);
      fireEvent.mouseMove(document, { clientX: 100 });
      const updatedSegments = defaultProps.onSegmentChange.mock.calls[0][0] as AnimationSegment[];
      const movedSegment = updatedSegments.find(s => s.id === '1');
      expect(movedSegment?.startTime).toBeGreaterThanOrEqual(20);


      const segment2 = screen.getByText('2');
      fireEvent.mouseDown(segment2);
      fireEvent.mouseMove(document, { clientX: 50 });
      const updatedSegments2 = defaultProps.onSegmentChange.mock.calls[1][0] as AnimationSegment[];
      const movedSegment2 = updatedSegments2.find(s => s.id === '2');
      expect(movedSegment2?.startTime).toBeGreaterThanOrEqual(35);


      const segment3 = screen.getByText('1');
      fireEvent.mouseDown(segment3);
      fireEvent.mouseMove(document, { clientX: 150 });
      const updatedSegments3 = defaultProps.onSegmentChange.mock.calls[2][0] as AnimationSegment[];
      const movedSegment3 = updatedSegments3.find(s => s.id === '1');
      expect(movedSegment3?.endTime).toBeLessThanOrEqual(65);


      const segment4 = screen.getByText('2');
      fireEvent.mouseDown(segment4);
      fireEvent.mouseMove(document, { clientX: 200 });
      const updatedSegments4 = defaultProps.onSegmentChange.mock.calls[3][0] as AnimationSegment[];
      const movedSegment4 = updatedSegments4.find(s => s.id === '2');
      expect(movedSegment4?.startTime).toBeGreaterThanOrEqual(40);
    });
  });
}); 