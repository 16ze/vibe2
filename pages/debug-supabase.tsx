"use client";

import { useAuth } from "@/contexts/AuthContext";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getFeed } from "@/services/postService";
import { getFollowers, getFollowing, getStats } from "@/services/socialService";
import { useEffect, useState } from "react";

/**
 * Page de diagnostic Supabase
 * Affiche l'état de la connexion et teste les requêtes principales
 */
export default function DebugSupabase() {
  const { user, isLoading: authLoading } = useAuth();
  const [testResults, setTestResults] = useState<any>({});
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const runTests = async () => {
      setIsTesting(true);
      const results: any = {};

      // Test 1: Configuration Supabase
      results.config = {
        isConfigured: isSupabaseConfigured,
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...`
          : "NON DÉFINI",
      };

      // Test 2: Connexion Supabase
      try {
        const { data, error } = await supabase.from("posts").select("id").limit(1);
        results.connection = {
          success: !error,
          error: error?.message || null,
          code: error?.code || null,
        };
      } catch (err: any) {
        results.connection = {
          success: false,
          error: err.message,
        };
      }

      // Test 3: Authentification
      results.auth = {
        isLoading: authLoading,
        hasUser: !!user,
        userId: user?.id || null,
        userEmail: user?.email || null,
      };

      // Test 4: Requête getFeed
      try {
        const posts = await getFeed(5);
        results.getFeed = {
          success: true,
          count: posts.length,
          sample: posts[0] || null,
        };
      } catch (err: any) {
        results.getFeed = {
          success: false,
          error: err.message,
        };
      }

      // Test 5: Requête getStats (si user connecté)
      if (user?.id) {
        try {
          const stats = await getStats(user.id);
          results.getStats = {
            success: true,
            stats,
          };
        } catch (err: any) {
          results.getStats = {
            success: false,
            error: err.message,
          };
        }

        // Test 6: Requête getFollowers
        try {
          const followers = await getFollowers(user.id);
          results.getFollowers = {
            success: true,
            count: followers.length,
          };
        } catch (err: any) {
          results.getFollowers = {
            success: false,
            error: err.message,
          };
        }

        // Test 7: Requête getFollowing
        try {
          const following = await getFollowing(user.id);
          results.getFollowing = {
            success: true,
            count: following.length,
          };
        } catch (err: any) {
          results.getFollowing = {
            success: false,
            error: err.message,
          };
        }
      } else {
        results.getStats = { skipped: "Pas d'utilisateur connecté" };
        results.getFollowers = { skipped: "Pas d'utilisateur connecté" };
        results.getFollowing = { skipped: "Pas d'utilisateur connecté" };
      }

      // Test 8: Tables Supabase
      const tables = ["posts", "stories", "profiles", "follows", "likes", "comments"];
      results.tables = {};
      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select("id").limit(1);
          results.tables[table] = {
            exists: !error,
            error: error?.message || null,
            code: error?.code || null,
          };
        } catch (err: any) {
          results.tables[table] = {
            exists: false,
            error: err.message,
          };
        }
      }

      setTestResults(results);
      setIsTesting(false);
    };

    runTests();
  }, [user, authLoading]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Diagnostic Supabase</h1>

        {isTesting ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
            <p>Exécution des tests...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Configuration */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="font-bold mb-2">1. Configuration</h2>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(testResults.config, null, 2)}
              </pre>
            </div>

            {/* Connexion */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="font-bold mb-2">
                2. Connexion Supabase{" "}
                {testResults.connection?.success ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-red-600">✗</span>
                )}
              </h2>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(testResults.connection, null, 2)}
              </pre>
            </div>

            {/* Authentification */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="font-bold mb-2">3. Authentification</h2>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(testResults.auth, null, 2)}
              </pre>
            </div>

            {/* getFeed */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="font-bold mb-2">
                4. getFeed(){" "}
                {testResults.getFeed?.success ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-red-600">✗</span>
                )}
              </h2>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(testResults.getFeed, null, 2)}
              </pre>
            </div>

            {/* getStats */}
            {testResults.getStats && (
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="font-bold mb-2">
                  5. getStats(){" "}
                  {testResults.getStats?.success ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-red-600">✗</span>
                  )}
                </h2>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(testResults.getStats, null, 2)}
                </pre>
              </div>
            )}

            {/* getFollowers */}
            {testResults.getFollowers && (
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="font-bold mb-2">
                  6. getFollowers(){" "}
                  {testResults.getFollowers?.success ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-red-600">✗</span>
                  )}
                </h2>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(testResults.getFollowers, null, 2)}
                </pre>
              </div>
            )}

            {/* Tables */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="font-bold mb-2">7. Tables Supabase</h2>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(testResults.tables, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

