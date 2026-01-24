import { View, Text, Image, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Let’s work on your swing today.</Text>
      </View>

      <View style={styles.content}>
        <Image 
        source={require("../../assets/images/partial-react-logo.png")}
        style={styles.image}
        resizeMode="cover"
        />
      </View>
      
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    paddingHorizontal: 24, // px-6
    paddingTop: 32,        // pt-8
    gap: 8,
  },

  title: {
    fontSize: 32,          // text-3xl
    fontWeight: "600",
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 16,
    color: "#525252",     // neutral-600
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  image: {
    width: "100%",
    height: 260,
    borderRadius: 20,
  },
});
