"use client";

import { MeshProvider } from "@meshsdk/react";
export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    
    <MeshProvider>
      {children}
    </MeshProvider>
  );
}