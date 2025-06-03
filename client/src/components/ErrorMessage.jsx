const ErrorMessage = ({ message, onRetry }) => {
  <div className="flex">
    <div className="text-red-500">⚠️ {message}</div>
    {onRetry && (
      <button onClick={onRetry} className="bg-blue-600 text-white">
        Try Again
      </button>
    )}
  </div>;
};
