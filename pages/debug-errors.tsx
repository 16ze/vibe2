"use client";

import { useEffect, useState } from "react";

/**
 * Page de diagnostic pour identifier toutes les erreurs
 */
export default function DebugErrors() {
  const [errors, setErrors] = useState<Array<{
    type: string;
    message: string;
    stack?: string;
    timestamp: string;
  }>>([]);

  useEffect(() => {
    // Capture les erreurs JavaScript
    const handleError = (event: ErrorEvent) => {
      setErrors((prev) => [
        ...prev,
        {
          type: "Error",
          message: event.message || "Unknown error",
          stack: event.error?.stack,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    // Capture les promesses rejetées
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setErrors((prev) => [
        ...prev,
        {
          type: "UnhandledRejection",
          message: event.reason?.message || String(event.reason) || "Unknown rejection",
          stack: event.reason?.stack,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  const clearErrors = () => {
    setErrors([]);
  };

  const copyErrors = () => {
    const errorsText = errors
      .map(
        (e) =>
          `[${e.timestamp}] ${e.type}: ${e.message}${e.stack ? `\n${e.stack}` : ""}`
      )
      .join("\n\n");
    navigator.clipboard.writeText(errorsText);
    alert("Erreurs copiées dans le presse-papier !");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">🐛 Diagnostic des Erreurs</h1>
          <div className="flex gap-2">
            <button
              onClick={clearErrors}
              className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
            >
              Effacer
            </button>
            <button
              onClick={copyErrors}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Copier
            </button>
          </div>
        </div>

        <div className="mb-4 text-gray-400">
          {errors.length === 0
            ? "Aucune erreur détectée"
            : `${errors.length} erreur(s) détectée(s)`}
        </div>

        {errors.length > 0 && (
          <div className="space-y-4">
            {errors.map((error, index) => (
              <div
                key={index}
                className="bg-red-900/30 border border-red-500 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-red-400 font-semibold">
                      {error.type}
                    </span>
                    <span className="text-gray-400 text-sm ml-2">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <div className="text-red-200 mb-2">{error.message}</div>
                {error.stack && (
                  <pre className="text-xs text-gray-400 overflow-x-auto bg-black/30 p-2 rounded mt-2">
                    {error.stack}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">📋 Informations Système</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">User Agent:</span>
              <div className="text-gray-300 break-all">
                {typeof window !== "undefined" ? navigator.userAgent : "N/A"}
              </div>
            </div>
            <div>
              <span className="text-gray-400">LocalStorage Size:</span>
              <div className="text-gray-300">
                {typeof window !== "undefined"
                  ? (() => {
                      let total = 0;
                      for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key) {
                          const value = localStorage.getItem(key);
                          if (value) {
                            total += key.length + value.length;
                          }
                        }
                      }
                      return `${(total / 1024 / 1024).toFixed(2)} MB`;
                    })()
                  : "N/A"}
              </div>
            </div>
            <div>
              <span className="text-gray-400">LocalStorage Keys:</span>
              <div className="text-gray-300">
                {typeof window !== "undefined"
                  ? localStorage.length
                  : "N/A"}
              </div>
            </div>
            <div>
              <span className="text-gray-400">Service Worker:</span>
              <div className="text-gray-300">
                {typeof window !== "undefined" && "serviceWorker" in navigator
                  ? "Disponible"
                  : "Non disponible"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

