"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import EmptyState from "@/components/EmptyState";

interface EntityNode {
  id: string;
  label: string;
  type: "person" | "place" | "keyword";
  count: number;
}

interface EntityEdge {
  source: string;
  target: string;
  weight: number;
}

interface EntityData {
  nodes: EntityNode[];
  edges: EntityEdge[];
}

interface PositionedNode extends EntityNode {
  x: number;
  y: number;
  radius: number;
}

const TYPE_COLORS: Record<string, string> = {
  person: "#60a5fa",
  place: "#4ade80",
  keyword: "#c4b5fd",
};

const TYPE_LABELS: Record<string, string> = {
  person: "사람",
  place: "장소",
  keyword: "키워드",
};

function layoutNodes(
  nodes: EntityNode[],
  width: number,
  height: number
): PositionedNode[] {
  if (nodes.length === 0) return [];

  const maxCount = Math.max(...nodes.map((n) => n.count), 1);
  const centerX = width / 2;
  const centerY = height / 2;

  // Place nodes in concentric rings by count
  const sorted = [...nodes].sort((a, b) => b.count - a.count);
  const positioned: PositionedNode[] = [];

  sorted.forEach((node, i) => {
    const radius = 14 + (node.count / maxCount) * 22;
    let x: number;
    let y: number;

    if (i === 0) {
      // Most frequent node in center
      x = centerX;
      y = centerY;
    } else {
      // Place others in rings
      const ring = Math.ceil(i / 6);
      const ringRadius = ring * 70 + 40;
      const indexInRing = (i - 1) % 6;
      const totalInRing = Math.min(6, sorted.length - (ring - 1) * 6 - 1);
      const angle = (indexInRing / Math.max(totalInRing, 1)) * Math.PI * 2 - Math.PI / 2;

      x = centerX + Math.cos(angle) * ringRadius;
      y = centerY + Math.sin(angle) * ringRadius;
    }

    // Clamp to viewport
    x = Math.max(radius + 4, Math.min(width - radius - 4, x));
    y = Math.max(radius + 4, Math.min(height - radius - 4, y));

    positioned.push({ ...node, x, y, radius });
  });

  return positioned;
}

export default function EntityGraph() {
  const [data, setData] = useState<EntityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    fetch("/api/entities")
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((d: EntityData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  // Responsive dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(300, rect.width - 48),
          height: Math.max(280, Math.min(400, rect.width * 0.6)),
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  if (loading) {
    return (
      <div className="toss-card entity-graph-enter">
        <h3 className="text-xs font-semibold text-[#888] uppercase tracking-widest mb-4">
          엔티티 그래프
        </h3>
        <div className="h-64 skeleton-shimmer rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="toss-card entity-graph-enter">
        <h3 className="text-xs font-semibold text-[#888] uppercase tracking-widest mb-4">
          엔티티 그래프
        </h3>
        <EmptyState
          icon="⚠️"
          title="엔티티 그래프를 불러오지 못했어요"
          description="네트워크 연결을 확인하고 다시 시도해보세요."
          actionLabel="다시 시도"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="toss-card entity-graph-enter">
        <h3 className="text-xs font-semibold text-[#888] uppercase tracking-widest mb-4">
          엔티티 그래프
        </h3>
        <EmptyState
          icon="🔗"
          title="엔티티가 아직 없어요"
          description="기록을 쌓으면 사람, 장소, 키워드가 자동으로 추출됩니다."
        />
      </div>
    );
  }

  const positionedNodes = layoutNodes(data.nodes, dimensions.width, dimensions.height);
  const nodeMap = new Map(positionedNodes.map((n) => [n.id, n]));

  // Determine connected nodes for highlighting
  const connectedToSelected = new Set<string>();
  if (selectedNode) {
    connectedToSelected.add(selectedNode);
    for (const edge of data.edges) {
      if (edge.source === selectedNode) connectedToSelected.add(edge.target);
      if (edge.target === selectedNode) connectedToSelected.add(edge.source);
    }
  }

  const connectedToHovered = new Set<string>();
  if (hoveredNode) {
    connectedToHovered.add(hoveredNode);
    for (const edge of data.edges) {
      if (edge.source === hoveredNode) connectedToHovered.add(edge.target);
      if (edge.target === hoveredNode) connectedToHovered.add(edge.source);
    }
  }

  const activeHighlight = selectedNode ? connectedToSelected : (hoveredNode ? connectedToHovered : null);

  // Selected node details
  const selectedNodeData = selectedNode ? nodeMap.get(selectedNode) : null;
  const selectedEdges = selectedNode
    ? data.edges.filter((e) => e.source === selectedNode || e.target === selectedNode)
    : [];

  return (
    <div className="toss-card entity-graph-enter" ref={containerRef}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-[#888] uppercase tracking-widest">
          엔티티 그래프
        </h3>
        {/* Legend */}
        <div className="flex gap-3">
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: TYPE_COLORS[type] }}
              />
              <span className="text-[10px] text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Graph */}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="mx-auto block"
        style={{ maxWidth: "100%" }}
      >
        {/* Edges */}
        {data.edges.map((edge, i) => {
          const source = nodeMap.get(edge.source);
          const target = nodeMap.get(edge.target);
          if (!source || !target) return null;

          const isHighlighted = activeHighlight
            ? activeHighlight.has(edge.source) && activeHighlight.has(edge.target)
            : true;

          return (
            <line
              key={`edge-${i}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={isHighlighted ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.04)"}
              strokeWidth={Math.max(1, edge.weight * 0.8)}
              className="graph-edge"
              style={{ transition: "stroke 0.3s ease, opacity 0.3s ease" }}
            />
          );
        })}

        {/* Nodes */}
        {positionedNodes.map((node) => {
          const color = TYPE_COLORS[node.type];
          const isHighlighted = activeHighlight ? activeHighlight.has(node.id) : true;
          const isSelected = selectedNode === node.id;

          return (
            <g
              key={node.id}
              className="graph-node"
              onClick={() => handleNodeClick(node.id)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{
                opacity: isHighlighted ? 1 : 0.25,
                transition: "opacity 0.3s ease",
                cursor: "pointer",
              }}
            >
              {/* Glow effect for selected */}
              {isSelected && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius + 6}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  opacity={0.3}
                  style={{
                    animation: "glowPulse 2s ease-in-out infinite",
                  }}
                />
              )}

              {/* Node circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.radius}
                fill={color + "33"}
                stroke={color}
                strokeWidth={isSelected ? 2.5 : 1.5}
                style={{
                  transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  transform: isSelected ? `scale(1.1)` : "scale(1)",
                  transformOrigin: `${node.x}px ${node.y}px`,
                }}
              />

              {/* Label */}
              <text
                x={node.x}
                y={node.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isHighlighted ? "#e5e5e5" : "#666"}
                fontSize={node.radius > 24 ? 11 : 9}
                fontWeight={isSelected ? 700 : 500}
                style={{ pointerEvents: "none", transition: "fill 0.3s ease" }}
              >
                {node.label.length > 6 ? node.label.slice(0, 5) + ".." : node.label}
              </text>

              {/* Count badge */}
              {node.count > 1 && (
                <text
                  x={node.x}
                  y={node.y + node.radius + 12}
                  textAnchor="middle"
                  fill="#888"
                  fontSize={8}
                  style={{ pointerEvents: "none" }}
                >
                  {node.count}회
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Selected node detail panel */}
      {selectedNodeData && (
        <div
          className="mt-4 p-4 rounded-xl border border-white/5"
          style={{
            background: `linear-gradient(135deg, ${TYPE_COLORS[selectedNodeData.type]}08 0%, transparent 100%)`,
            animation: "cardFadeIn 0.25s ease-out both",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: TYPE_COLORS[selectedNodeData.type] }}
            />
            <span className="text-sm font-semibold text-white">{selectedNodeData.label}</span>
            <span className="text-[10px] text-gray-500 ml-1">
              {TYPE_LABELS[selectedNodeData.type]} | {selectedNodeData.count}회 등장
            </span>
          </div>

          {selectedEdges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-gray-500 mr-1">연결:</span>
              {selectedEdges.map((edge, i) => {
                const otherId = edge.source === selectedNode ? edge.target : edge.source;
                const otherNode = nodeMap.get(otherId);
                if (!otherNode) return null;
                return (
                  <button
                    key={i}
                    onClick={() => handleNodeClick(otherId)}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition"
                  >
                    {otherNode.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
