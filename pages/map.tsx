"use client";

import { vibe } from "@/api/vibeClient";
import { useUI } from "@/contexts/UIContext";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

/**
 * Import dynamique du composant RealMap (désactive le SSR)
 */
const RealMap = dynamic(() => import("@/components/map/RealMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
      <div className="text-white text-sm">Chargement de la carte...</div>
    </div>
  ),
});

/**
 * Interface pour un ami sur la carte
 */
interface FriendOnMap {
  email: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  lat: number; // Latitude
  lng: number; // Longitude
  lastSeen?: string; // Dernière fois vu
}

/**
 * Page Map - Carte de localisation style Snapchat
 * Affiche les amis sur une carte avec leur position
 */
export default function Map() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<FriendOnMap | null>(
    null
  );
  const [userPosition, setUserPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  /**
   * Récupère les fonctions pour masquer/afficher la BottomNav
   */
  const { hideBottomNav, showBottomNav } = useUI();

  /**
   * Masque la BottomNav au montage de la page
   * La réaffiche au démontage avec un délai pour s'assurer que la navigation est complète
   * hideBottomNav et showBottomNav sont stables grâce à useCallback
   */
  useEffect(() => {
    hideBottomNav();

    // Cleanup : réaffiche la BottomNav au démontage avec délai de sécurité
    return () => {
      // Délai pour laisser le temps à la navigation de se terminer
      setTimeout(() => {
        showBottomNav();
      }, 150);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Une seule fois au montage, les fonctions sont stables

  /**
   * Récupère l'utilisateur actuel
   */
  useEffect(() => {
    vibe.auth
      .me()
      .then(setCurrentUser)
      .catch(() => {});
  }, []);

  /**
   * Récupère la position géographique de l'utilisateur
   */
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      // Fallback sur Paris si la géolocalisation n'est pas disponible
      setUserPosition({ lat: 48.8566, lng: 2.3522 });
      setIsLoadingLocation(false);
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error("Erreur de géolocalisation:", error);
        // Fallback sur Paris si la géolocalisation échoue
        setUserPosition({ lat: 48.8566, lng: 2.3522 });
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  /**
   * Récupère tous les utilisateurs
   */
  const { data: allUsers = [] } = useQuery({
    queryKey: ["all-users-map"],
    queryFn: async () => {
      try {
        return await vibe.integrations.Core.getAllUsers();
      } catch (error) {
        console.error("Error fetching users:", error);
        return [];
      }
    },
  });

  /**
   * Récupère les relations (Follow) de l'utilisateur actuel
   */
  const { data: relationships = [] } = useQuery({
    queryKey: ["relationships-map", currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      try {
        const sent = await vibe.entities.Follow.filter({
          follower_email: currentUser.email,
        });
        const received = await vibe.entities.Follow.filter({
          following_email: currentUser.email,
        });
        return [...sent, ...received];
      } catch (error) {
        console.error("Error fetching relationships:", error);
        return [];
      }
    },
    enabled: !!currentUser,
  });

  /**
   * Détermine si un utilisateur est un ami (FRIENDS)
   */
  const isFriend = (userEmail: string): boolean => {
    if (!currentUser?.email || userEmail === currentUser.email) return false;

    const sent = relationships.find(
      (rel: any) =>
        rel.follower_email === currentUser.email &&
        rel.following_email === userEmail &&
        (rel.status === "FRIENDS" || rel.status === "active")
    );
    const received = relationships.find(
      (rel: any) =>
        rel.follower_email === userEmail &&
        rel.following_email === currentUser.email &&
        (rel.status === "FRIENDS" || rel.status === "active")
    );

    return !!(sent && received);
  };

  /**
   * Génère des coordonnées aléatoires autour d'une position de référence
   * Ajoute un petit offset aléatoire (environ 1-5 km)
   */
  const generateRandomCoordinates = (
    centerLat: number,
    centerLng: number,
    index: number
  ): { lat: number; lng: number } => {
    // Offset aléatoire en degrés (environ 0.01° = ~1km)
    // Génère un offset entre 0.005° et 0.05° (environ 500m à 5km)
    const offsetLat = (Math.random() - 0.5) * 0.05;
    const offsetLng = (Math.random() - 0.5) * 0.05;

    return {
      lat: centerLat + offsetLat,
      lng: centerLng + offsetLng,
    };
  };

  /**
   * Génère des amis simulés pour peupler la carte
   * Utilise les coordonnées de l'utilisateur comme référence
   */
  const generateMockFriends = (
    centerLat: number,
    centerLng: number
  ): FriendOnMap[] => {
    const mockNames = [
      { full_name: "Lucas", username: "lucas_m", email: "lucas@example.com" },
      { full_name: "Emma", username: "emma_p", email: "emma@example.com" },
      {
        full_name: "Sofiane",
        username: "sofiane_k",
        email: "sofiane@example.com",
      },
      { full_name: "Léa", username: "lea_d", email: "lea@example.com" },
      {
        full_name: "Thomas",
        username: "thomas_b",
        email: "thomas@example.com",
      },
      { full_name: "Sarah", username: "sarah_m", email: "sarah@example.com" },
      { full_name: "Alex", username: "alex_r", email: "alex@example.com" },
      { full_name: "Marie", username: "marie_l", email: "marie@example.com" },
    ];

    // Génère entre 5 et 8 amis simulés
    const count = 5 + Math.floor(Math.random() * 4); // 5, 6, 7 ou 8
    const selectedNames = mockNames.slice(0, count);

    return selectedNames.map((mock, index) => {
      // Génère des coordonnées autour de la position de l'utilisateur
      const coords = generateRandomCoordinates(centerLat, centerLng, index);

      // Génère une date aléatoire pour "vu il y a X"
      const minutesAgo = Math.floor(Math.random() * 60) + 1;
      const lastSeen = new Date(
        Date.now() - minutesAgo * 60 * 1000
      ).toISOString();

      return {
        email: mock.email,
        full_name: mock.full_name,
        username: mock.username,
        avatar_url: `https://i.pravatar.cc/150?u=${index + 1}`,
        lat: coords.lat,
        lng: coords.lng,
        lastSeen,
      } as FriendOnMap;
    });
  };

  /**
   * Filtre les amis et génère leurs positions en coordonnées lat/lng
   * Si moins de 3 amis réels, génère des amis simulés
   */
  const friendsOnMap = useMemo(() => {
    if (!currentUser || !userPosition) return [];

    const centerLat = userPosition.lat;
    const centerLng = userPosition.lng;

    // Récupère les vrais amis (même si allUsers est vide, on peut avoir des relations)
    const realFriends =
      allUsers.length > 0
        ? allUsers.filter((user: any) => isFriend(user.email))
        : [];

    // Si moins de 3 amis réels, génère des amis simulés
    if (realFriends.length < 3) {
      const mockFriends = generateMockFriends(centerLat, centerLng);

      // Combine les vrais amis avec les simulés
      const allFriends = [
        ...realFriends.map((friend: any, index: number) => {
          const coords = generateRandomCoordinates(centerLat, centerLng, index);
          const minutesAgo = Math.floor(Math.random() * 60) + 1;
          const lastSeen = new Date(
            Date.now() - minutesAgo * 60 * 1000
          ).toISOString();

          return {
            email: friend.email,
            full_name: friend.full_name,
            username: friend.username,
            avatar_url: friend.avatar_url,
            lat: coords.lat,
            lng: coords.lng,
            lastSeen,
          } as FriendOnMap;
        }),
        ...mockFriends,
      ];

      return allFriends;
    }

    // Si 3+ amis réels, utilise uniquement ceux-ci
    return realFriends.map((friend: any, index: number) => {
      const coords = generateRandomCoordinates(centerLat, centerLng, index);
      const minutesAgo = Math.floor(Math.random() * 60) + 1;
      const lastSeen = new Date(
        Date.now() - minutesAgo * 60 * 1000
      ).toISOString();

      return {
        email: friend.email,
        full_name: friend.full_name,
        username: friend.username,
        avatar_url: friend.avatar_url,
        lat: coords.lat,
        lng: coords.lng,
        lastSeen,
      } as FriendOnMap;
    });
  }, [allUsers, relationships, currentUser, userPosition]);

  /**
   * Compte le nombre d'amis qui peuvent voir l'utilisateur
   */
  const visibleFriendsCount = isGhostMode ? 0 : friendsOnMap.length;

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col z-[100] overflow-hidden">
      {/* Bouton Retour */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => router.push("/conversations")}
        className="absolute top-6 left-4 z-50 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-colors"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </motion.button>

      {/* Carte Leaflet - Conteneur principal */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {isLoadingLocation ? (
          <div className="w-full h-full bg-slate-900 flex items-center justify-center">
            <div className="text-white text-sm">
              Chargement de votre position...
            </div>
          </div>
        ) : (
          <RealMap
            userPosition={userPosition}
            friends={friendsOnMap}
            currentUser={currentUser}
            isGhostMode={isGhostMode}
            onFriendClick={setSelectedFriend}
          />
        )}

        {/* Tooltip pour l'ami sélectionné */}
        <AnimatePresence>
          {selectedFriend && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-md rounded-lg px-4 py-2 text-white text-sm shadow-xl"
            >
              <div className="font-semibold">
                {selectedFriend.full_name ||
                  selectedFriend.username ||
                  selectedFriend.email}
              </div>
              <div className="text-xs text-gray-300 mt-1">
                Vu il y a{" "}
                {formatDistanceToNow(
                  new Date(selectedFriend.lastSeen || Date.now()),
                  { addSuffix: false }
                )}
              </div>
              {/* Flèche pointant vers le bas */}
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4"
                style={{
                  borderLeftColor: "transparent",
                  borderRightColor: "transparent",
                  borderTopColor: "rgba(0, 0, 0, 0.8)",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay pour fermer le tooltip */}
        {selectedFriend && (
          <div
            className="absolute inset-0 z-40"
            onClick={() => setSelectedFriend(null)}
          />
        )}
      </div>

      {/* Footer - Contrôles */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-black/60 backdrop-blur-md rounded-2xl px-6 py-4 flex items-center gap-4 shadow-xl">
          {/* Toggle Mode Fantôme */}
          <div className="flex items-center gap-3">
            {isGhostMode ? (
              <EyeOff className="w-5 h-5 text-gray-400" />
            ) : (
              <Eye className="w-5 h-5 text-blue-400" />
            )}
            <span className="text-white text-sm font-medium">Mode Fantôme</span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsGhostMode(!isGhostMode)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isGhostMode ? "bg-gray-600" : "bg-blue-500"
              }`}
            >
              <motion.div
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                animate={{
                  x: isGhostMode ? 4 : 28,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </motion.button>
          </div>

          {/* Info */}
          <div className="h-6 w-px bg-white/20" />

          <div className="text-white text-xs">
            {isGhostMode ? (
              <span className="text-gray-400">Vous êtes invisible</span>
            ) : (
              <span>
                Vous êtes visible par{" "}
                <span className="font-semibold text-blue-400">
                  {visibleFriendsCount}
                </span>{" "}
                {visibleFriendsCount === 1 ? "ami" : "amis"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
