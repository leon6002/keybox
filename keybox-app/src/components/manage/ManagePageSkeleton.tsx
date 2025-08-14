export const ManagePageSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header Skeleton */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg animate-pulse"></div>
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-12rem)]">
          {/* Left Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg h-full">
              {/* Search Bar Skeleton */}
              <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse mb-4"></div>
                <div className="h-10 bg-blue-200 dark:bg-blue-800 rounded-lg animate-pulse"></div>
              </div>

              {/* Password List Skeleton */}
              <div className="p-4 space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-3 p-3 rounded-xl animate-pulse"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
                    </div>
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content Skeleton */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg h-full">
              {/* Form Header Skeleton */}
              <div className="p-8 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-64 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Form Fields Skeleton */}
              <div className="p-8 space-y-8">
                {/* Basic Info Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                  </div>
                </div>

                {/* Secure Info Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-3 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                    </div>
                  </div>

                  {/* Type Selector Skeleton */}
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

                  {/* Fields Skeleton */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="space-y-3">
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons Skeleton */}
                <div className="flex justify-between pt-6">
                  <div className="h-10 w-24 bg-red-200 dark:bg-red-800 rounded-lg animate-pulse"></div>
                  <div className="h-10 w-24 bg-blue-200 dark:bg-blue-800 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Loading Indicator */}
      <div className="fixed bottom-8 right-8">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Loading passwords...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
