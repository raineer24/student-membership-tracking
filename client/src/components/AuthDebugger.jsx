// File: client/src/components/AuthDebugger.jsx
// Lines 1-50: Authentication Debugging Component
import React, { useState, useEffect } from 'react';

/**
 * AuthDebugger Component
 * 
 * PURPOSE: Diagnose and fix authentication token issues
 * USAGE: Temporarily add to DashboardPage to debug auth problems
 * 
 * This component will:
 * - Show all localStorage keys and values
 * - Test different token retrieval methods
 * - Provide manual token setting capability
 * - Test API calls with different authentication approaches
 */

const AuthDebugger = ({ onTokenFixed }) => {
  const [debugInfo, setDebugInfo] = useState({});
  const [testResults, setTestResults] = useState({});
  const [manualToken, setManualToken] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    gatherDebugInfo();
  }, []);

  const gatherDebugInfo = () => {
    // Gather all localStorage data
    const localStorageData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      localStorageData[key] = value;
    }

    // Test different token keys
    const possibleTokenKeys = ['authToken', 'token', 'auth_token', 'accessToken', 'jwt', 'bearer'];
    const tokenTests = {};
    
    possibleTokenKeys.forEach(key => {
      const value = localStorage.getItem(key);
      tokenTests[key] = {
        exists: !!value,
        value: value ? value.substring(0, 20) + '...' : null,
        length: value ? value.length : 0
      };
    });

    setDebugInfo({
      localStorageData,
      tokenTests,
      localStorageKeys: Object.keys(localStorageData),
      totalKeys: localStorage.length
    });
  };

  const testApiCall = async (tokenKey) => {
    try {
      const token = localStorage.getItem(tokenKey);
      if (!token) {
        setTestResults(prev => ({
          ...prev,
          [tokenKey]: { error: 'Token not found', status: 'error' }
        }));
        return;
      }

      console.log(`Testing API call with token from key: ${tokenKey}`);
      console.log(`Token preview: ${token.substring(0, 30)}...`);

      const response = await fetch('/api/students', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [tokenKey]: {
          status: response.ok ? 'success' : 'error',
          statusCode: response.status,
          message: result.message || result.error || 'Unknown response',
          data: response.ok ? 'API call successful' : result
        }
      }));

      if (response.ok && onTokenFixed) {
        onTokenFixed(tokenKey, token);
      }

    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [tokenKey]: {
          status: 'error',
          message: error.message,
          error: error.toString()
        }
      }));
    }
  };

  const setManualTokenToStorage = () => {
    if (!manualToken.trim()) {
      alert('Please enter a token');
      return;
    }

    const tokenKey = 'authToken';
    localStorage.setItem(tokenKey, manualToken.trim());
    console.log(`Manually set token with key: ${tokenKey}`);
    
    gatherDebugInfo();
    alert(`Token set successfully with key: ${tokenKey}`);
  };

  const copyTokenToClipboard = (tokenKey) => {
    const token = localStorage.getItem(tokenKey);
    if (token) {
      navigator.clipboard.writeText(token);
      alert(`Token copied to clipboard from key: ${tokenKey}`);
    }
  };

  const clearAllTokens = () => {
    const tokenKeys = ['authToken', 'token', 'auth_token', 'accessToken', 'jwt', 'bearer'];
    tokenKeys.forEach(key => localStorage.removeItem(key));
    gatherDebugInfo();
    setTestResults({});
    alert('All potential token keys cleared');
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
        >
          Debug Auth Issues
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Authentication Debugger</h2>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* LocalStorage Overview */}
          <div className="bg-gray-750 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">LocalStorage Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-300 text-sm mb-2">Total Keys: {debugInfo.totalKeys}</p>
                <div className="bg-gray-700 rounded p-3 max-h-32 overflow-y-auto">
                  <pre className="text-xs text-gray-300">
                    {JSON.stringify(debugInfo.localStorageKeys, null, 2)}
                  </pre>
                </div>
              </div>
              <div>
                <p className="text-gray-300 text-sm mb-2">All Data:</p>
                <div className="bg-gray-700 rounded p-3 max-h-32 overflow-y-auto">
                  <pre className="text-xs text-gray-300">
                    {JSON.stringify(debugInfo.localStorageData, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Token Key Tests */}
          <div className="bg-gray-750 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Token Key Analysis</h3>
            <div className="space-y-2">
              {Object.entries(debugInfo.tokenTests || {}).map(([key, data]) => (
                <div key={key} className="flex items-center justify-between bg-gray-700 rounded p-3">
                  <div className="flex-1">
                    <span className="text-white font-medium">{key}</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      data.exists ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {data.exists ? 'EXISTS' : 'MISSING'}
                    </span>
                    {data.exists && (
                      <span className="ml-2 text-gray-400 text-xs">
                        Length: {data.length} | Preview: {data.value}
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {data.exists && (
                      <>
                        <button
                          onClick={() => testApiCall(key)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                        >
                          Test API
                        </button>
                        <button
                          onClick={() => copyTokenToClipboard(key)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs"
                        >
                          Copy
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API Test Results */}
          {Object.keys(testResults).length > 0 && (
            <div className="bg-gray-750 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">API Test Results</h3>
              <div className="space-y-2">
                {Object.entries(testResults).map(([key, result]) => (
                  <div key={key} className="bg-gray-700 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{key}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        result.status === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {result.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-gray-300 text-sm">
                      {result.statusCode && <p>Status Code: {result.statusCode}</p>}
                      <p>Message: {result.message}</p>
                      {result.error && <p className="text-red-400">Error: {result.error}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual Token Setting */}
          <div className="bg-gray-750 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Manual Token Setting</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste authentication token here..."
                className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={setManualTokenToStorage}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Set Token
              </button>
            </div>
            <p className="text-gray-400 text-xs mt-2">
              This will set the token with key 'authToken' in localStorage
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={gatherDebugInfo}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Refresh Debug Info
            </button>
            <button
              onClick={clearAllTokens}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Clear All Tokens
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Reload Page
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg p-4">
            <h4 className="text-yellow-300 font-semibold mb-2">Debugging Steps:</h4>
            <ol className="text-yellow-200 text-sm space-y-1 list-decimal list-inside">
              <li>Check which token keys exist in localStorage above</li>
              <li>Test API calls with existing tokens using "Test API" buttons</li>
              <li>If all tests fail, check the browser console for more details</li>
              <li>Try logging out and logging back in to regenerate the token</li>
              <li>If you have a working token, paste it in "Manual Token Setting"</li>
              <li>Contact admin if authentication server is not responding</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDebugger;