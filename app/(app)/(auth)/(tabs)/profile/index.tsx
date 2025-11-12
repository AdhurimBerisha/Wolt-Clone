import { ScrollView, StyleSheet, Text } from "react-native";
const Profile = () => {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.container}
    >
      <Text>Profile</Text>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 70,
    marginLeft: 17,
  },
});
export default Profile;
