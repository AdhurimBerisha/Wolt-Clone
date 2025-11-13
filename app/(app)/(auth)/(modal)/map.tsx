import { Colors } from "@/constants/theme";
import { useRestaurantMarkers, useRestaurants } from "@/hooks/useRestaurants";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Camera,
  MapView,
  MarkerView,
  type CameraRef,
} from "@maplibre/maplibre-react-native";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const DEFAULT_CENTER: [number, number] = [7.6257, 51.9625];
const FALLBACK_IMAGE = require("@/assets/images/icon.png");

const OSM_RASTER_STYLE = {
  version: 8,
  name: "OSM Raster",
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster" as const,
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const Page = () => {
  const { data: restaurantMarkers, isLoading: markersLoading } =
    useRestaurantMarkers();
  const { data: restaurants, isLoading: restaurantsLoading } = useRestaurants();

  const cameraRef = useRef<CameraRef>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const centerCoordinate = useMemo(() => {
    if (restaurantMarkers && restaurantMarkers.length > 0) {
      const first = restaurantMarkers[0];
      return [first.longitude, first.latitude] as [number, number];
    }
    return DEFAULT_CENTER;
  }, [restaurantMarkers]);

  const cards = useMemo(() => {
    if (!restaurantMarkers) {
      return [];
    }

    return restaurantMarkers.map((marker) => {
      const restaurant = restaurants?.find((r) => r.id === marker.id);
      return { marker, restaurant };
    });
  }, [restaurantMarkers, restaurants]);

  useEffect(() => {
    if (!selectedId && restaurantMarkers && restaurantMarkers.length > 0) {
      setSelectedId(restaurantMarkers[0].id);
    }
  }, [restaurantMarkers, selectedId]);

  const moveCameraToMarker = useCallback(
    (id: string) => {
      const target = restaurantMarkers?.find((marker) => marker.id === id);
      if (target) {
        cameraRef.current?.moveTo([target.longitude, target.latitude], 600);
      }
    },
    [restaurantMarkers]
  );

  useEffect(() => {
    if (selectedId) {
      moveCameraToMarker(selectedId);
    }
  }, [selectedId, moveCameraToMarker]);

  const selectMarker = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const openRestaurant = useCallback(
    (id: string) => {
      selectMarker(id);
      router.push({
        pathname: "/(app)/(auth)/(modal)/(restaurant)/[id]",
        params: { id },
      });
    },
    [selectMarker]
  );

  if (markersLoading || restaurantsLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size={"large"} color={Colors.secondary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.floatingIconButton, styles.backButton]}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={22} color="#222" />
      </Pressable>
      <Pressable
        style={[styles.floatingIconButton, styles.filterButton]}
        onPress={() => router.push("/(app)/(auth)/(modal)/filter" as const)}
      >
        <Ionicons name="filter" size={20} color="#222" />
      </Pressable>
      <MapView
        style={styles.map}
        mapStyle={OSM_RASTER_STYLE}
        logoEnabled={false}
      >
        <Camera
          ref={cameraRef}
          centerCoordinate={centerCoordinate}
          zoomLevel={13}
        />
        {restaurantMarkers?.map((marker) => (
          <MarkerView
            key={marker.id}
            coordinate={[marker.longitude, marker.latitude]}
          >
            <Pressable
              style={styles.markerContainer}
              onPress={() => openRestaurant(marker.id)}
              onPressIn={() => selectMarker(marker.id)}
            >
              <View
                style={[
                  styles.annotationOuter,
                  selectedId === marker.id && styles.annotationOuterSelected,
                ]}
              >
                <View
                  style={[
                    styles.annotationInner,
                    selectedId === marker.id && styles.annotationInnerSelected,
                  ]}
                />
              </View>
              <View style={styles.annotationLabel}>
                <View style={styles.annotationLabelBubble}>
                  <Text style={styles.annotationLabelText}>{marker.name}</Text>
                </View>
              </View>
            </Pressable>
          </MarkerView>
        ))}
      </MapView>
      <View pointerEvents="box-none" style={styles.cardsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContent}
        >
          {cards.map(({ marker, restaurant }) => (
            <Pressable
              key={marker.id}
              style={[
                styles.restaurantCard,
                selectedId === marker.id && styles.restaurantCardSelected,
              ]}
              onPressIn={() => selectMarker(marker.id)}
              onPress={() => openRestaurant(marker.id)}
            >
              <Image
                source={restaurant?.image ?? FALLBACK_IMAGE}
                style={styles.restaurantCardImage}
              />
              <View style={styles.restaurantCardInfo}>
                <Text style={styles.restaurantCardTitle} numberOfLines={1}>
                  {restaurant?.name ?? marker.name}
                </Text>
                <Text style={styles.restaurantCardSubtitle} numberOfLines={1}>
                  {restaurant?.description ?? marker.cuisine.join(", ")}
                </Text>
                <View style={styles.restaurantCardMetaRow}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.restaurantCardMetaText}>
                    {marker.rating.toFixed(1)} • {marker.deliveryTime}
                  </Text>
                </View>
                <View style={styles.restaurantCardMetaRow}>
                  <Ionicons
                    name="bicycle-outline"
                    size={14}
                    color={Colors.secondary}
                  />
                  <Text style={styles.restaurantCardMetaText}>
                    €{marker.deliveryFee.toFixed(2)}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};
export default Page;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  floatingIconButton: {
    backgroundColor: "rgba(255,255,255,0.95)",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 10,
  },
  filterButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: "center",
  },
  annotationOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 157, 224, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(0, 157, 224, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  annotationOuterSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  annotationInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.secondary,
  },
  annotationInnerSelected: {
    backgroundColor: "#fff",
  },
  annotationLabel: {
    marginTop: 6,
    alignItems: "center",
  },
  annotationLabelBubble: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  annotationLabelText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#222",
  },
  cardsContainer: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
  },
  cardsContent: {
    paddingHorizontal: 16,
    paddingRight: 28,
    gap: 12,
  },
  restaurantCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    width: 260,
    gap: 12,
  },
  restaurantCardSelected: {
    borderColor: Colors.secondary,
    shadowOpacity: 0.15,
  },
  restaurantCardImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  restaurantCardInfo: {
    flex: 1,
    gap: 4,
  },
  restaurantCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  restaurantCardSubtitle: {
    fontSize: 12,
    color: Colors.muted,
  },
  restaurantCardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  restaurantCardMetaText: {
    fontSize: 12,
    color: Colors.muted,
  },
});
