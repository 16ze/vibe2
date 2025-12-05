"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";

/**
 * Interface pour un ami sur la carte
 */
interface FriendOnMap {
  email: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  lat: number;
  lng: number;
  lastSeen?: string;
}

/**
 * Props du composant RealMap
 */
interface RealMapProps {
  /**
   * Coordonnées de l'utilisateur actuel
   */
  userPosition: { lat: number; lng: number } | null;

  /**
   * Liste des amis à afficher sur la carte
   */
  friends: FriendOnMap[];

  /**
   * Utilisateur actuel
   */
  currentUser: any;

  /**
   * Indique si le mode fantôme est activé
   */
  isGhostMode: boolean;

  /**
   * Callback appelé quand un ami est cliqué
   */
  onFriendClick?: (friend: FriendOnMap) => void;
}

/**
 * Crée un marqueur personnalisé pour l'utilisateur actuel
 */
const createMeMarker = (avatarUrl?: string, initials?: string) => {
  return L.divIcon({
    className: "custom-me-marker",
    html: `
      <div style="position: relative;">
        <!-- Cercles concentriques animés (effet radar) -->
        <div class="radar-circle-1"></div>
        <div class="radar-circle-2"></div>
        <div class="radar-circle-3"></div>
        <!-- Avatar -->
        <div style="
          width: 64px;
          height: 64px;
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid #3b82f6;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
          position: relative;
          z-index: 10;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 24px;
        ">
          ${
            avatarUrl
              ? `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" />`
              : initials || "U"
          }
        </div>
      </div>
    `,
    iconSize: [64, 64],
    iconAnchor: [32, 32],
  });
};

/**
 * Crée un marqueur personnalisé pour un ami
 */
const createFriendMarker = (
  avatarUrl?: string,
  initials?: string,
  isPulsing: boolean = true
) => {
  return L.divIcon({
    className: "custom-friend-marker",
    html: `
      <div style="position: relative; cursor: pointer;">
        ${
          isPulsing
            ? `
          <!-- Animation pulse -->
          <div class="friend-pulse"></div>
        `
            : ""
        }
        <!-- Avatar avec bordure -->
        <div style="
          width: 48px;
          height: 48px;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid #3b82f6;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          position: relative;
          z-index: 10;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 18px;
        ">
          ${
            avatarUrl
              ? `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" />`
              : initials || "U"
          }
        </div>
        <!-- Pointe de l'épingle -->
        <div style="
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 6px solid #3b82f6;
          z-index: 5;
        "></div>
      </div>
    `,
    iconSize: [48, 60],
    iconAnchor: [24, 60],
  });
};

/**
 * Composant RealMap - Carte interactive avec Leaflet
 * Affiche une vraie carte avec les positions des amis
 */
export default function RealMap({
  userPosition,
  friends,
  currentUser,
  isGhostMode,
  onFriendClick,
}: RealMapProps) {
  const [mapReady, setMapReady] = useState(false);

  /**
   * Position par défaut (Paris) si la géolocalisation échoue
   */
  const defaultPosition: [number, number] = [48.8566, 2.3522]; // Paris

  /**
   * Position de la carte (utilisateur ou défaut)
   */
  const mapCenter: [number, number] = userPosition
    ? [userPosition.lat, userPosition.lng]
    : defaultPosition;

  /**
   * Initialise la carte au montage
   */
  useEffect(() => {
    setMapReady(true);
  }, []);

  /**
   * Génère les initiales de l'utilisateur
   */
  const userInitials = useMemo(() => {
    if (!currentUser) return "U";
    return (
      (currentUser.full_name || currentUser.username || currentUser.email)
        ?.charAt(0)
        ?.toUpperCase() || "U"
    );
  }, [currentUser]);

  /**
   * Génère les initiales d'un ami
   */
  const getFriendInitials = (friend: FriendOnMap) => {
    return (
      (friend.full_name || friend.username || friend.email)
        ?.charAt(0)
        ?.toUpperCase() || "U"
    );
  };

  if (!mapReady) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        <div className="text-white text-sm">Chargement de la carte...</div>
      </div>
    );
  }

  return (
    <>
      {/* Styles CSS pour les animations */}
      <style jsx global>{`
        /* Cercles radar pour l'utilisateur */
        .custom-me-marker .radar-circle-1,
        .custom-me-marker .radar-circle-2,
        .custom-me-marker .radar-circle-3 {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 128px;
          height: 128px;
          border-radius: 50%;
          border: 2px solid rgba(59, 130, 246, 0.3);
          animation: radar-pulse 2s infinite ease-out;
        }

        .custom-me-marker .radar-circle-2 {
          animation-delay: 0.7s;
        }

        .custom-me-marker .radar-circle-3 {
          animation-delay: 1.4s;
        }

        @keyframes radar-pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.5;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0.3;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }

        /* Animation pulse pour les amis */
        .custom-friend-marker .friend-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.3);
          animation: friend-pulse 2s infinite ease-in-out;
        }

        @keyframes friend-pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.5;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.3);
            opacity: 0;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.5;
          }
        }

        /* Style de la carte Leaflet */
        .leaflet-container {
          background: #1e293b !important;
        }

        .leaflet-control {
          display: none !important;
        }
      `}</style>

      <MapContainer
        key={`map-${mapCenter[0]}-${mapCenter[1]}`}
        center={mapCenter}
        zoom={13}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        zoomControl={false}
        scrollWheelZoom={true}
        doubleClickZoom={false}
        dragging={true}
        touchZoom={true}
      >
        {/* Fond de carte Dark Mode */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Marqueur de l'utilisateur actuel */}
        {userPosition && (
          <Marker
            position={[userPosition.lat, userPosition.lng]}
            icon={createMeMarker(currentUser?.avatar_url, userInitials)}
            interactive={false}
          />
        )}

        {/* Marqueurs des amis (masqués en mode fantôme) */}
        {!isGhostMode &&
          friends.map((friend) => (
            <Marker
              key={friend.email}
              position={[friend.lat, friend.lng]}
              icon={createFriendMarker(
                friend.avatar_url,
                getFriendInitials(friend),
                true
              )}
              eventHandlers={{
                click: () => {
                  onFriendClick?.(friend);
                },
              }}
            />
          ))}
      </MapContainer>
    </>
  );
}
