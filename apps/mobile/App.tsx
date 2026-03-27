import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import TradingScreen from "./src/screens/TradingScreen";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <TradingScreen />
    </SafeAreaProvider>
  );
}
