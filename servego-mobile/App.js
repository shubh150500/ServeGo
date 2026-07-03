import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  BackHandler,
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Handle hardware back button presses on Android
  useEffect(() => {
    const onBackPress = () => {
      if (webViewRef.current && canGoBack) {
        webViewRef.current.goBack();
        return true; // Prevent default action (exiting app)
      }
      return false; // Exit app
    };

    BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => {
      BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    };
  }, [canGoBack]);

  const handleStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
  };

  const handleReload = () => {
    setHasError(false);
    setIsLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#C46A4A" />
      
      <View style={styles.webViewWrapper}>
        <WebView
          ref={webViewRef}
          source={{ uri: "https://servego.co.in" }}
          style={styles.webview}
          onNavigationStateChange={handleStateChange}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => setHasError(true)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          allowsBackForwardNavigationGestures={true}
          renderLoading={() => (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#C46A4A" />
            </View>
          )}
        />

        {/* Loading overlay */}
        {isLoading && !hasError && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#C46A4A" />
            <Text style={styles.loadingText}>Connecting to ServeGo...</Text>
          </View>
        )}

        {/* Custom error/offline screens */}
        {hasError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Connection Lost</Text>
            <Text style={styles.errorDescription}>
              Please check your internet connection and try again.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#C46A4A", // Top statusbar background padding match
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  webViewWrapper: {
    flex: 1,
    backgroundColor: "#FAF6F1", // Fallback color
  },
  webview: {
    flex: 1,
  },
  centerContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FAF6F1",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99,
  },
  loadingText: {
    marginTop: 12,
    color: "#6B5E4F",
    fontWeight: "600",
    fontSize: 14,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FAF6F1",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 100,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#C46A4A",
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 14,
    color: "#6B5E4F",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#C46A4A",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});
