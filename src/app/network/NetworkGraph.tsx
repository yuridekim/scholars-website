import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Scholar {
  id: string;
  discipline: string;
}

// D3 force simulation node type
interface SimulationNode extends d3.SimulationNodeDatum {
  id: string;
  discipline: string;
}

// Combined type for our nodes
interface NodeData extends Scholar, SimulationNode {}

interface LinkData {
  source: string;
  target: string;
  relationship: 'collaborate-similar' | 'collaborate-not-similar' | 'similar-not-collaborate';
  weight?: number;
}

interface Link extends Omit<LinkData, 'source' | 'target'> {
  source: SimulationNode;
  target: SimulationNode;
}

interface NetworkGraphProps {
  width?: number;
  height?: number;
  scholars: Scholar[];
  collaborationMatrix: number[][];
  similarityMatrix: number[][];
  similarityThreshold?: number;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ 
  width = 960, 
  height = 600,
  scholars,
  collaborationMatrix,
  similarityMatrix,
  similarityThreshold = 0.2
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    // Generate links based on matrices
    const links: LinkData[] = [];
    for (let i = 0; i < scholars.length - 1; i++) {
      for (let j = i + 1; j < scholars.length; j++) {
        const collaboration = collaborationMatrix[i][j];
        const similarity = similarityMatrix[i][j];
        
        if (collaboration > 0 && similarity > similarityThreshold) {
          links.push({
            source: scholars[i].id,
            target: scholars[j].id,
            relationship: 'collaborate-similar',
            weight: collaboration
          });
        } else if (collaboration > 0 && similarity <= similarityThreshold) {
          links.push({
            source: scholars[i].id,
            target: scholars[j].id,
            relationship: 'collaborate-not-similar',
            weight: collaboration
          });
        } else if (collaboration === 0 && similarity > similarityThreshold) {
          links.push({
            source: scholars[i].id,
            target: scholars[j].id,
            relationship: 'similar-not-collaborate'
          });
        }
      }
    }

    const svg = d3.select(svgRef.current);

    // Create color scales using d3's color brewer
    const disciplineColor = d3.scaleOrdinal<string>()
      .domain(Array.from(new Set(scholars.map(s => s.discipline))))
      .range(d3.schemeSet3);

    const relationshipColor = d3.scaleOrdinal<string>()
      .domain(['collaborate-similar', 'collaborate-not-similar', 'similar-not-collaborate'])
      .range(['red', 'blue', 'gray']);

    // Set up force simulation
    const simulation = d3.forceSimulation<NodeData>()
      .nodes(scholars)
      .force("link", d3.forceLink<NodeData, Link>().id(d => d.id))
      .force("charge", d3.forceManyBody().strength(-50))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Initialize links after nodes are created
    const linkForce = simulation.force<d3.ForceLink<NodeData, Link>>("link");
    if (linkForce) {
      linkForce.links(links as unknown as Link[]);
    }

    // Create edges
    const link = svg.append("g")
      .selectAll<SVGLineElement, Link>("line")
      .data(links as unknown as Link[])
      .join("line")
      .attr("stroke", d => relationshipColor(d.relationship))
      .attr("stroke-width", d => d.weight ? Math.log(3 * d.weight) : 1);

    // Create nodes
    const node = svg.append("g")
      .selectAll<SVGCircleElement, SimulationNode>("circle")
      .data(scholars as SimulationNode[])
      .join("circle")
      .attr("r", 5)
      .attr("fill", d => disciplineColor(d.discipline))
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.3)
      .call(drag(simulation));

    // Add tooltips
    node.append("title")
      .text(d => `Scholar ${d.id} (${d.discipline})`);

    // Add legend
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 180}, 20)`);

    // Discipline legend
    const disciplines = Array.from(new Set(scholars.map(s => s.discipline)));
    disciplines.forEach((discipline, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      legendRow.append("circle")
        .attr("r", 5)
        .attr("fill", disciplineColor(discipline));

      legendRow.append("text")
        .attr("x", 10)
        .attr("y", 4)
        .text(discipline)
        .style("font-size", "12px");
    });

    // Relationship legend
    const relationships = [
      { type: 'collaborate-similar', label: 'Collaborate & Similar' },
      { type: 'collaborate-not-similar', label: 'Collaborate but not Similar' },
      { type: 'similar-not-collaborate', label: 'Similar but not Collaborate' }
    ];

    relationships.forEach((rel, i) => {
      const yOffset = (disciplines.length + 1) * 20 + i * 20;
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${yOffset})`);

      legendRow.append("line")
        .attr("x1", -10)
        .attr("x2", 10)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", relationshipColor(rel.type))
        .attr("stroke-width", 2);

      legendRow.append("text")
        .attr("x", 15)
        .attr("y", 4)
        .text(rel.label)
        .style("font-size", "12px");
    });

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as SimulationNode).x ?? 0)
        .attr("y1", d => (d.source as SimulationNode).y ?? 0)
        .attr("x2", d => (d.target as SimulationNode).x ?? 0)
        .attr("y2", d => (d.target as SimulationNode).y ?? 0);

      node
        .attr("cx", d => d.x ?? 0)
        .attr("cy", d => d.y ?? 0);
    });

    // Implement drag behavior
    function drag(simulation: d3.Simulation<NodeData, undefined>) {
      function dragstarted(event: d3.D3DragEvent<SVGCircleElement, NodeData, NodeData>) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragged(event: d3.D3DragEvent<SVGCircleElement, NodeData, NodeData>) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: d3.D3DragEvent<SVGCircleElement, NodeData, NodeData>) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag<SVGCircleElement, NodeData>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [width, height, scholars, collaborationMatrix, similarityMatrix, similarityThreshold]);

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