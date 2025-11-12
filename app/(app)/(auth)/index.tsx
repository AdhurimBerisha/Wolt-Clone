import useUserStore from "@/hooks/use-userstore";
import { Button, Text, View } from "react-native";
const Page = () => {
  const { setIsGuest } = useUserStore();

  return (
    <View>
      <Text>My inside page</Text>
      <Button title="Go login" onPress={() => setIsGuest(false)} />
    </View>
  );
};
export default Page;
