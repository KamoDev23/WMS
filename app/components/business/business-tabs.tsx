"use client";
import React, { useState } from "react";

export interface Tab {
  label: string;
  value: string;
}

export interface BusinessTabsProps {
  tabs: Tab[];
  children: React.ReactNode[];
}

const BusinessTabs: React.FC<BusinessTabsProps> = ({ tabs, children }) => {
  const [activeTab, setActiveTab] = useState<string>(tabs[0].value);

  return (
    <div>
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 -mb-px border-b-2 ${
              activeTab === tab.value
                ? "border-blue-600 font-semibold"
                : "border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {children.map((child, index) => (
          <div
            key={index}
            className={tabs[index].value === activeTab ? "block" : "hidden"}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BusinessTabs;
