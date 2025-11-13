import { Colors } from "@/constants/theme";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
const Page = () => {
  const { id } = useLocalSearchParams();
  return (
    <View style={styles.container}>
      <Text>Page: {id}</Text>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
export default Page;
