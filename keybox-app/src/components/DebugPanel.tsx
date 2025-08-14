"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { OptimisticUpdateService } from "@/lib/storage/optimisticUpdateService";

export function DebugPanel() {
  const { user, getUserKey } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkIndexedDB = async () => {
    setIsChecking(true);
    try {
      const optimisticService = OptimisticUpdateService.getInstance();
      await optimisticService.initialize();

      // Get current user info
      const currentUserId = user?.databaseUser?.id;
      const userKey = getUserKey();

      console.log("🔍 Debug check - Current user:", currentUserId);
      console.log("🔍 Debug check - Has user key:", !!userKey);

      // Check IndexedDB directly
      const dbRequest = indexedDB.open("KeyboxOptimisticUpdates", 2);

      dbRequest.onsuccess = async (event: any) => {
        const db = event.target.result;

        // Check what stores exist
        const storeNames = Array.from(db.objectStoreNames);
        console.log("🔍 Available stores:", storeNames);

        let allEntries: any[] = [];
        let serviceEntries: any[] = [];

        if (storeNames.includes("localPasswords")) {
          try {
            const transaction = db.transaction(["localPasswords"], "readonly");
            const store = transaction.objectStore("localPasswords");
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = async () => {
              allEntries = getAllRequest.result;

              // Get entries using the service
              try {
                serviceEntries = await optimisticService.getLocalPasswords(
                  currentUserId || ""
                );
              } catch (serviceError) {
                console.error("Service error:", serviceError);
              }

              const info = {
                currentUserId,
                hasUserKey: !!userKey,
                userKeyLength: userKey?.length,
                vaultUnlocked: user?.isVaultUnlocked,
                dbStores: storeNames,
                allEntriesInDB: allEntries.length,
                serviceEntries: serviceEntries.length,
                userIdsInDB: [...new Set(allEntries.map((e: any) => e.userId))],
                sampleEntry: allEntries[0] || null,
                entriesForCurrentUser: allEntries.filter(
                  (e: any) => e.userId === currentUserId
                ).length,
                syncStatuses: [
                  ...new Set(allEntries.map((e: any) => e.syncStatus)),
                ],
              };

              setDebugInfo(info);
              console.log("🔍 Debug info:", info);
            };

            getAllRequest.onerror = () => {
              setDebugInfo({ error: "Failed to get entries from store" });
            };
          } catch (transactionError) {
            setDebugInfo({
              error: "Transaction failed",
              details: transactionError.message,
              dbStores: storeNames,
            });
          }
        } else {
          // No localPasswords store exists
          const info = {
            currentUserId,
            hasUserKey: !!userKey,
            userKeyLength: userKey?.length,
            vaultUnlocked: user?.isVaultUnlocked,
            dbStores: storeNames,
            allEntriesInDB: 0,
            serviceEntries: 0,
            error: "localPasswords store not found - database not initialized",
          };

          setDebugInfo(info);
          console.log("🔍 Debug info:", info);
        }
      };
    } catch (error) {
      console.error("Debug check failed:", error);
      setDebugInfo({ error: error.message });
    }
    setIsChecking(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "white",
        border: "2px solid red",
        padding: "10px",
        zIndex: 9999,
        maxWidth: "400px",
        fontSize: "12px",
      }}
    >
      <h3>🐛 Debug Panel</h3>
      <button
        onClick={checkIndexedDB}
        disabled={isChecking}
        style={{ marginBottom: "10px", padding: "5px 10px" }}
      >
        {isChecking ? "Checking..." : "Check IndexedDB"}
      </button>

      {debugInfo && (
        <div>
          <h4>Debug Results:</h4>
          <pre
            style={{ fontSize: "10px", overflow: "auto", maxHeight: "300px" }}
          >
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
