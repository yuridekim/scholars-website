// app/visualization/NetworkGraph.tsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface NodeData {
  id: string;
  group: string;
  label: string;
}

interface Node extends NodeData {
  // Properties added by d3 force simulation
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  index?: number;
}

interface LinkData {
  source: string;
  target: string;
  type: 'collaborate-similar' | 'collaborate-not-similar' | 'similar-not-collaborate';
}

interface Link extends Omit<LinkData, 'source' | 'target'> {
  source: Node;
  target: Node;
}

interface NetworkGraphProps {
  width?: number;
  height?: number;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ 
  width = 960, 
  height = 600 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Sample data - replace with your actual data
    const data: { nodes: NodeData[]; links: LinkData[] } = {
      nodes: [
        // CS/Stats/Engineering/Data Science nodes
        { id: "1", group: "CS", label: "Data Mining" },
        { id: "2", group: "CS", label: "Machine Learning" },
        { id: "3", group: "CS", label: "Network Analysis" },
        { id: "4", group: "CS", label: "AI Systems" },
        { id: "5", group: "CS", label: "Statistics" },
        
        // Medicine/Nursing nodes
        { id: "6", group: "Medicine", label: "Clinical Research" },
        { id: "7", group: "Medicine", label: "Healthcare Analytics" },
        { id: "8", group: "Medicine", label: "Medical Imaging" },
        { id: "9", group: "Medicine", label: "Patient Care" },
        
        // Psychology nodes
        { id: "10", group: "Psychology", label: "Cognitive Science" },
        { id: "11", group: "Psychology", label: "Behavioral Studies" },
        { id: "12", group: "Psychology", label: "Mental Health" },
        
        // Public Health nodes
        { id: "13", group: "Public Health", label: "Epidemiology" },
        { id: "14", group: "Public Health", label: "Health Policy" },
        { id: "15", group: "Public Health", label: "Population Studies" },
        
        // Others
        { id: "16", group: "Others", label: "Economics" },
        { id: "17", group: "Others", label: "Social Sciences" },
        { id: "18", group: "Others", label: "Environmental Science" }
      ],
      links: [
        // Collaborate & Similar
        { source: "1", target: "2", type: "collaborate-similar" },
        { source: "2", target: "3", type: "collaborate-similar" },
        { source: "3", target: "4", type: "collaborate-similar" },
        { source: "4", target: "5", type: "collaborate-similar" },
        
        // Collaborate but not Similar
        { source: "1", target: "6", type: "collaborate-not-similar" },
        { source: "2", target: "8", type: "collaborate-not-similar" },
        { source: "3", target: "13", type: "collaborate-not-similar" },
        { source: "5", target: "15", type: "collaborate-not-similar" },
        
        // Similar but not Collaborate
        { source: "6", target: "7", type: "similar-not-collaborate" },
        { source: "7", target: "8", type: "similar-not-collaborate" },
        { source: "10", target: "11", type: "similar-not-collaborate" },
        { source: "13", target: "14", type: "similar-not-collaborate" },
        
        // Additional connections
        { source: "2", target: "10", type: "collaborate-not-similar" },
        { source: "4", target: "12", type: "collaborate-not-similar" },
        { source: "5", target: "13", type: "collaborate-similar" },
        { source: "8", target: "15", type: "collaborate-not-similar" },
        { source: "9", target: "14", type: "similar-not-collaborate" },
        { source: "11", target: "17", type: "collaborate-not-similar" },
        { source: "16", target: "17", type: "similar-not-collaborate" },
        { source: "17", target: "18", type: "similar-not-collaborate" }
      ]
    };

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current);

    const color = d3.scaleOrdinal<string, string>()
      .domain(["CS", "Medicine", "Psychology", "Public Health", "Others"])
      .range(["#7bc7c7", "#e9d97f", "#b8b8b8", "#e9a37f", "#98b5e2"]);

    const linkColor = d3.scaleOrdinal<string, string>()
      .domain(["collaborate-similar", "collaborate-not-similar", "similar-not-collaborate"])
      .range(["red", "blue", "gray"]);

    const simulation = d3.forceSimulation<Node>()
      .nodes(data.nodes)
      .force("link", d3.forceLink<Node, Link>().id((d: Node) => d.id))
      .force("charge", d3.forceManyBody().strength(-50))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Need to initialize links after nodes are created
    const linkForce = simulation.force<d3.ForceLink<Node, Link>>("link");
    if (linkForce) {
      linkForce.links(data.links as unknown as Link[]);
    }

    const link = svg.append("g")
      .selectAll<SVGLineElement, Link>("line")
      .data(data.links as unknown as Link[])
      .join("line")
      .attr("stroke", d => linkColor(d.type))
      .attr("stroke-width", 1);

    const node = svg.append("g")
      .selectAll<SVGCircleElement, Node>("circle")
      .data(data.nodes as Node[])
      .join("circle")
      .attr("r", 5)
      .attr("fill", d => color(d.group))
      .call(drag(simulation));

    node.append("title")
      .text(d => d.label);

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x ?? 0)
        .attr("y1", d => d.source.y ?? 0)
        .attr("x2", d => d.target.x ?? 0)
        .attr("y2", d => d.target.y ?? 0);

      node
        .attr("cx", d => d.x ?? 0)
        .attr("cy", d => d.y ?? 0);
    });

    function drag(simulation: d3.Simulation<Node, undefined>) {
      function dragstarted(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragged(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag<SVGCircleElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [width, height]);

  return (
    <div className="network-graph">
      <svg ref={svgRef} width={width} height={height} />
      <style jsx>{`
        .network-graph {
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }
        .network-graph svg {
          display: block;
          background: white;
        }
      `}</style>
    </div>
  );
};

export default NetworkGraph;