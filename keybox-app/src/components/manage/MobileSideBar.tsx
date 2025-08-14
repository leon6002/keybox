interface MobileSideBarProps {
  handleClick: () => void;
  isSidebarOpen: boolean;
}
export const MobileSideBar = ({
  handleClick,
  isSidebarOpen,
}: MobileSideBarProps) => {
  return (
    <div className="lg:hidden px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <button
        onClick={handleClick}
        className={`sidebar-toggle-button p-3 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-64" : "translate-x-0"
        }`}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h8M4 18h16"
          />
        </svg>
      </button>
    </div>
  );
};
