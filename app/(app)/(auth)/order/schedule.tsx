import { Colors } from "@/constants/theme";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Schedule = () => {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedTime, setSelectedTime] = useState(0);

  // -------------------- Generate days --------------------
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const in2Days = new Date(today);
  in2Days.setDate(in2Days.getDate() + 2);
  const in3Days = new Date(today);
  in3Days.setDate(in3Days.getDate() + 3);

  const nextDays = [
    "Today",
    `${tomorrow.getDate()}.${tomorrow.getMonth() + 1}`,
    `${in2Days.getDate()}.${in2Days.getMonth() + 1}`,
    `${in3Days.getDate()}.${in3Days.getMonth() + 1}`,
  ];

  // -------------------- Generate 5-minute interval times --------------------
  const nextTimes = Array.from({ length: 24 * 12 }, (_, i) => {
    const hour = Math.floor(i / 12);
    const minute = (i % 12) * 5;
    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  });

  const handleConfirm = () => {
    router.dismiss();
  };

  return (
    <View style={styles.container}>
      <View style={{ padding: 20, gap: 20 }}>
        <Text style={styles.header}>Select date</Text>

        {/* Days */}
        <FlatList
          data={nextDays}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[
                styles.dayButton,
                selectedDay === index && styles.dayButtonSelected,
              ]}
              onPress={() => setSelectedDay(index)}
            >
              <Text
                style={[
                  styles.dayText,
                  selectedDay === index && styles.dayTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />

        <Text style={styles.header}>Select time</Text>
      </View>

      {/* Times (scrollable) */}
      <FlatList
        data={nextTimes}
        keyExtractor={(item) => item}
        numColumns={3}
        contentContainerStyle={{ padding: 20, gap: 10 }}
        columnWrapperStyle={{ gap: 10 }}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              styles.timeButton,
              selectedTime === index && styles.timeButtonSelected,
            ]}
            onPress={() => setSelectedTime(index)}
          >
            <Text
              style={[
                styles.timeText,
                selectedTime === index && styles.timeTextSelected,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Confirm button */}
      <View style={{ padding: 20 }}>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Schedule;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 5,
  },

  // Day buttons
  dayButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#F0F0F0",
  },
  dayButtonSelected: {
    backgroundColor: Colors.secondary,
  },
  dayText: {
    fontSize: 15,
    fontWeight: "500",
  },
  dayTextSelected: {
    color: "#fff",
  },

  // Time buttons
  timeButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
    flex: 1,
  },
  timeButtonSelected: {
    backgroundColor: Colors.secondary,
  },
  timeText: {
    textAlign: "center",
    fontSize: 15,
  },
  timeTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },

  // Confirm button
  confirmBtn: {
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
