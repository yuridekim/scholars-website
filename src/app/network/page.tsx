"use client";

import NetworkGraph from './NetworkGraph';

export default function Page() {
  return (
    <div className="container mx-auto p-4">
      <h1>LSIRM Analysis Network</h1>
      <NetworkGraph />
    </div>
  );
}