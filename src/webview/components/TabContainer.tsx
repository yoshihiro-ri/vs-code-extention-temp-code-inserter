import * as React from "react";
import { useState } from "react";

interface TabProps {
  label: string;
  children: React.ReactNode;
}

interface TabContainerProps {
  defaultActiveTab?: number;
  children: React.ReactElement<TabProps>[];
}

export const Tab: React.FC<TabProps> = ({ children }) => {
  return <>{children}</>;
};

const TabContainer: React.FC<TabContainerProps> = ({
  defaultActiveTab = 0,
  children,
}) => {
  const [activeTab, setActiveTab] = useState(defaultActiveTab);
  const validChildren = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === Tab
  ) as React.ReactElement<TabProps>[];

  const handleTabClick = (index: number) => {
    setActiveTab(index);
  };

  return (
    <div className="tab-container">
      {/* タブヘッダー */}
      <div className="flex border-b border-gray-300 mb-4">
        {validChildren.map((child, index) => (
          <button
            key={index}
            onClick={() => handleTabClick(index)}
            className={`py-2 px-4 ${
              index < validChildren.length - 1 ? "mr-2" : ""
            } cursor-pointer ${
              activeTab === index
                ? "bg-gray-100 border-b-2 border-blue-500"
                : "hover:text-blue-500"
            }`}
          >
            {child.props.label}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className="p-2">
        {validChildren.map((child, index) => (
          <div
            key={index}
            style={{ display: activeTab === index ? "block" : "none" }}
          >
            {child.props.children}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabContainer;
