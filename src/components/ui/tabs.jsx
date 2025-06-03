import { useState, Children, cloneElement } from "react";

// Tabs context and basic implementation
export function Tabs({ defaultValue, children, className = "", onValueChange }) {
  const [active, setActive] = useState(defaultValue);

  const handleChange = (value) => {
    setActive(value);
    if (onValueChange) onValueChange(value);
  };

  // Clone children and pass active tab and handler
  return (
    <div className={className}>
      {Children.map(children, child =>
        cloneElement(child, {
          activeTab: active,
          onTabChange: handleChange,
        })
      )}
    </div>
  );
}

export function TabsList({ children, className = "", activeTab, onTabChange }) {
  return (
    <div className={className}>
      {Children.map(children, child =>
        cloneElement(child, { activeTab, onTabChange })
      )}
    </div>
  );
}

export function TabsTrigger({ value, children, activeTab, onTabChange }) {
  const isActive = activeTab === value;
  return (
    <button
      type="button"
      className={`px-4 py-2 border-b-2 ${isActive ? "border-[#006241] text-[#006241] font-bold" : "border-transparent text-gray-500"} focus:outline-none`}
      onClick={() => onTabChange(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, activeTab }) {
  if (activeTab !== value) return null;
  return <div>{children}</div>;
}