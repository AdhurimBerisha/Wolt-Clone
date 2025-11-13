import { Stack } from "@/components/Stack";
const Layout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          contentStyle: {
            // backgroundColor: '#fff',
          },
        }}
      />
      <Stack.Screen
        name="checkout"
        options={{
          title: "",
          headerBackButtonDisplayMode: "minimal",
          contentStyle: {
            backgroundColor: "#fff",
          },
        }}
      />
    </Stack>
  );
};
export default Layout;
