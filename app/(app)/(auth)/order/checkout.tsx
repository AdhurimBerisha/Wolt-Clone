import { PurchaseButton } from "@/components/buttons/PurchaseButton";
import { Colors } from "@/constants/theme";
import { useCartStore } from "@/hooks/use-cartstore";
import type { OrderData } from "@/services/orderService";
import { orderService } from "@/services/orderService";

import { Ionicons } from "@expo/vector-icons";
import {
  Camera,
  MapView,
  MarkerView,
  type CameraRef,
} from "@maplibre/maplibre-react-native";
import { Link, Stack, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const MAP_HEIGHT = 250;

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
  const router = useRouter();
  const { items, total, selectedRestaurant, clearCart } = useCartStore();
  const scrollOffset = useSharedValue(0);
  const cameraRef = useRef<CameraRef>(null);

  // State
  const [deliveryMode, setDeliveryMode] = useState<"delivery" | "pickup">(
    "delivery"
  );
  const [leaveAtDoor, setLeaveAtDoor] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState<
    "standard" | "schedule" | null
  >(null);
  const [tipAmount, setTipAmount] = useState(0);

  // Calculate fees
  const { serviceFee, deliveryFee } = orderService.calculateFees(total);
  const grandTotal = total + serviceFee + deliveryFee + tipAmount;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = event.contentOffset.y;
    },
  });

  const mapStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollOffset.value,
      [-100, 0, 200],
      [1.3, 1, 0.9],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollOffset.value,
      [0, 200],
      [0, -50],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
    };
  });

  const handleCheckout = async () => {
    if (!deliveryTime) return;

    try {
      const orderData: OrderData = {
        items,
        restaurantId: selectedRestaurant?.id!,
        deliveryMode,
        leaveAtDoor,
        sendAsGift: false,
        deliveryTime,
        tipAmount,
        paymentMethod: "applepay" as const,
        subtotal: total,
        serviceFee,
        deliveryFee,
        total: grandTotal,
      };

      const result = await orderService.createOrder(orderData);
      console.log("order created: ", result);
      clearCart();
      router.dismissTo("/restaurants");
    } catch (error) {}
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: selectedRestaurant?.name }} />

      <Animated.View style={[styles.mapContainer, mapStyle]}>
        <MapView
          style={StyleSheet.absoluteFill}
          mapStyle={OSM_RASTER_STYLE}
          logoEnabled={false}
        >
          <Camera
            ref={cameraRef}
            centerCoordinate={[
              selectedRestaurant?.location.longitude || 0,
              selectedRestaurant?.location.latitude || 0,
            ]}
            zoomLevel={15}
          />
          {selectedRestaurant && (
            <MarkerView
              coordinate={[
                selectedRestaurant.location.longitude,
                selectedRestaurant.location.latitude,
              ]}
            >
              <View style={styles.markerContainer}>
                <View style={styles.annotationOuter}>
                  <View style={styles.annotationInner} />
                </View>
                <View style={styles.annotationLabel}>
                  <View style={styles.annotationLabelBubble}>
                    <Text style={styles.annotationLabelText}>
                      {selectedRestaurant.name}
                    </Text>
                  </View>
                </View>
              </View>
            </MarkerView>
          )}
        </MapView>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: MAP_HEIGHT },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <View style={styles.section}>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={[
                  styles.pickerOption,
                  deliveryMode === "delivery" && styles.pickerOptionActive,
                ]}
                onPress={() => setDeliveryMode("delivery")}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    deliveryMode === "delivery" &&
                      styles.pickerOptionTextActive,
                  ]}
                >
                  Delivery
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pickerOption,
                  deliveryMode === "pickup" && styles.pickerOptionActive,
                ]}
                onPress={() => setDeliveryMode("pickup")}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    deliveryMode === "pickup" && styles.pickerOptionTextActive,
                  ]}
                >
                  Pickup
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Delivery Address */}
          <TouchableOpacity style={styles.section}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.sectionTitle}>
                  Choose a delivery address
                </Text>
                <Text style={styles.sectionSubtitle}>Tap here to continue</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>

          {/* Additional Options */}
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.optionText}>Leave order at the door</Text>
              <Switch value={leaveAtDoor} onValueChange={setLeaveAtDoor} />
            </View>
          </View>

          <TouchableOpacity style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.optionText}>Send as a gift</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>

          {/* When? Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>When?</Text>

            <TouchableOpacity
              style={styles.radioRow}
              onPress={() => setDeliveryTime("standard")}
              disabled
            >
              <View style={styles.radioLeft}>
                <View style={styles.radioCircle}>
                  {deliveryTime === "standard" && (
                    <View style={styles.radioSelected} />
                  )}
                </View>
                <View>
                  <Text style={[styles.radioLabel, styles.disabledText]}>
                    Standard
                  </Text>
                  <Text style={[styles.radioSubtext, styles.disabledText]}>
                    Currently unavailable
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <Link href="/order/schedule" asChild>
              <TouchableOpacity
                style={styles.radioRow}
                onPress={() => setDeliveryTime("schedule")}
              >
                <View style={styles.radioLeft}>
                  <View style={styles.radioCircle}>
                    {deliveryTime === "schedule" && (
                      <View style={styles.radioSelected} />
                    )}
                  </View>
                  <View>
                    <Text style={styles.radioLabel}>Schedule</Text>
                    <Text style={styles.radioSubtext}>
                      Choose a delivery time
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Payment Section */}
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.paymentIcon}>
                  <Ionicons name="logo-apple" size={24} color="#000" />
                </View>
                <Text style={styles.optionText}>Apple Pay</Text>
              </View>
              <Text style={styles.paymentAmount}>
                {grandTotal.toFixed(2)} €
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.optionText}>Redeem code</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>

          {/* Add Courier Tip */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Add courier tip</Text>
            <Text style={styles.tipDescription}>
              100% of your tip goes to your courier. It&apos;s an easy way to
              say thanks for great service.
            </Text>

            <View style={styles.tipButtons}>
              {[0, 1, 2, 5].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.tipButton,
                    tipAmount === amount && styles.tipButtonActive,
                  ]}
                  onPress={() => setTipAmount(amount)}
                >
                  <Text
                    style={[
                      styles.tipButtonText,
                      tipAmount === amount && styles.tipButtonTextActive,
                    ]}
                  >
                    {amount === 0 ? "No tip" : `${amount} €`}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.tipButton}>
                <Text style={styles.tipButtonText}>Custom</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Summary */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.summaryHeader}>
              <Text style={styles.summaryHeaderText}>How fees work</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors.secondary}
              />
            </TouchableOpacity>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Item subtotal</Text>
              <Text style={styles.summaryValue}>{total.toFixed(2)} €</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service fee</Text>
              <Text style={styles.summaryValue}>{serviceFee.toFixed(2)} €</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery fee</Text>
              <Text style={styles.summaryValue}>
                {deliveryFee.toFixed(2)} €
              </Text>
            </View>

            {tipAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Courier tip</Text>
                <Text style={styles.summaryValue}>
                  {tipAmount.toFixed(2)} €
                </Text>
              </View>
            )}

            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryTotalText}>Total</Text>
              <Text style={styles.summaryTotalValue}>
                {grandTotal.toFixed(2)} €
              </Text>
            </View>
          </View>

          {/* Bottom spacing for button */}
          <View style={{ height: 100 }} />
        </View>
      </Animated.ScrollView>

      <PurchaseButton
        onPress={handleCheckout}
        deliveryTimeSelected={deliveryTime === "schedule"}
      />
    </View>
  );
};

export default Page;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.15)",
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginHorizontal: 12,
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.15)",
  },
  mapContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: MAP_HEIGHT,
    zIndex: 0,
  },
  markerContainer: {
    alignItems: "center",
  },
  annotationOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  annotationInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
  scrollContent: {
    paddingBottom: 16,
  },
  contentContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: 8,
  },
  section: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e8e8e8",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#999",
  },
  optionText: {
    fontSize: 16,
    color: "#000",
  },
  pickerContainer: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 4,
  },
  pickerOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  pickerOptionActive: {
    backgroundColor: "#fff",
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.08)",
  },
  pickerOptionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#666",
  },
  pickerOptionTextActive: {
    color: "#000",
    fontWeight: "600",
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  radioLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.secondary,
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  radioSubtext: {
    fontSize: 14,
    color: "#666",
  },
  disabledText: {
    color: "#ccc",
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  tipDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 16,
  },
  tipButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  tipButtonActive: {
    borderColor: Colors.secondary,
    backgroundColor: "#f0f9ff",
  },
  tipButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  tipButtonTextActive: {
    color: Colors.secondary,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
  },
  summaryHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.secondary,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: "#666",
  },
  summaryValue: {
    fontSize: 15,
    color: "#000",
  },
  summaryTotal: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
    marginTop: 4,
  },
  summaryTotalText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
});
