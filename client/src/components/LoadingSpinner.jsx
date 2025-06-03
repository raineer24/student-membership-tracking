const LoadingSpinner = ({ message = "Loading..." }) => {
  <div className="flex flex-col items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blu-600"></div>
    <p className="mt-4 text-gray-600">{message}</p>
  </div>;
};

export default LoadingSpinner;
