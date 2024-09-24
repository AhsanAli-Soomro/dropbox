"use client"; // Ensure this is used in the app router

import { useServerInsertedHTML } from "next/navigation";
import { SheetsRegistry, createGenerateId, JssProvider } from "react-jss";
import { useState } from "react";

export default function JSSRegistry({ children }) {
  const [registry] = useState(() => new SheetsRegistry());
  const generateId = createGenerateId();

  useServerInsertedHTML(() => (
    <style
      id="server-side-styles"
      dangerouslySetInnerHTML={{ __html: registry.toString() }}
    />
  ));

  return (
    <JssProvider registry={registry} generateId={generateId}>
      {children}
    </JssProvider>
  );
}
