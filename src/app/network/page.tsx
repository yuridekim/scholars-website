"use client";

import NetworkGraph from './NetworkGraph';

export default function Page() {
  // Sample scholars data
  const scholars = [
    { id: "1", discipline: "CS" },
    { id: "2", discipline: "CS" },
    { id: "3", discipline: "Medicine" },
    { id: "4", discipline: "Medicine" },
    { id: "5", discipline: "Psychology" },
    { id: "6", discipline: "Public Health" },
    { id: "7", discipline: "Others" },
    { id: "8", discipline: "Others" },
  ];

  // Sample collaboration matrix (8x8)
  const collaborationMatrix = [
    [0, 1, 1, 0, 0, 0, 0, 0],
    [1, 0, 0, 1, 0, 0, 0, 0],
    [1, 0, 0, 1, 1, 0, 0, 0],
    [0, 1, 1, 0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0, 1, 1, 0],
    [0, 0, 0, 1, 1, 0, 0, 1],
    [0, 0, 0, 0, 1, 0, 0, 1],
    [0, 0, 0, 0, 0, 1, 1, 0]
  ];

  // Sample similarity matrix (8x8)
  const similarityMatrix = [
    [1.0, 0.8, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1],
    [0.8, 1.0, 0.2, 0.3, 0.1, 0.1, 0.1, 0.1],
    [0.3, 0.2, 1.0, 0.7, 0.4, 0.3, 0.1, 0.1],
    [0.2, 0.3, 0.7, 1.0, 0.3, 0.4, 0.1, 0.1],
    [0.1, 0.1, 0.4, 0.3, 1.0, 0.5, 0.3, 0.2],
    [0.1, 0.1, 0.3, 0.4, 0.5, 1.0, 0.2, 0.3],
    [0.1, 0.1, 0.1, 0.1, 0.3, 0.2, 1.0, 0.6],
    [0.1, 0.1, 0.1, 0.1, 0.2, 0.3, 0.6, 1.0]
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">LSIRM Analysis Network</h1>
      <NetworkGraph 
        scholars={scholars}
        collaborationMatrix={collaborationMatrix}
        similarityMatrix={similarityMatrix}
        width={800}
        height={600}
      />
    </div>
  );
}