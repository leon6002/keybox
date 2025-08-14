const PasswordEditFormSkeleton = () => {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header Section Skeleton */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-8">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-64 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Title and Favorite Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-400 rounded animate-pulse"></div>
                <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="relative">
                <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-pink-400 rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Folder Selection Skeleton */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-3 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
        </div>

        {/* Secure Information Skeleton */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-3 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Type Selector Skeleton */}
          <div className="mb-6">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="p-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl animate-pulse"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className="text-2xl">🔒</div>
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fields Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="relative">
                  <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Details Skeleton */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-6 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-3 w-52 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-6">
            {/* Tags */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-400 rounded animate-pulse"></div>
                <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
            </div>
            {/* Notes */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-400 rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-400 rounded animate-pulse"></div>
              <div className="h-10 w-24 bg-red-200 dark:bg-red-800 rounded-lg animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-10 w-24 bg-red-200 dark:bg-red-800 rounded-lg animate-pulse"></div>
              <div className="h-10 w-24 bg-blue-200 dark:bg-blue-800 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordEditFormSkeleton;
