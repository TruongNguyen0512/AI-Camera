import * as React from "react";
import {
  StyleSheet,
  Platform,
  View,
  SafeAreaView,
  StatusBar,
  TouchableHighlight,
  Linking,
  Text,
  PermissionsAndroid,
} from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraDevices,
  useCameraPermission,
  useFrameProcessor,
} from "react-native-vision-camera";
import { Redirect, useRouter } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import ObscuraButton from "@/components/ObscuraButton";
import { FontAwesome5 } from "@expo/vector-icons";
import ZoomControls from "@/components/ZoomControls";
import { BlurView } from "expo-blur";
import ExposureControls from "@/components/ExposureControls";
import { useTensorflowModel, loadTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';

export default function HomeScreen() {
  const [permissionsGranted, setPermissionsGranted] = React.useState(false);

  const requestPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);

      const allGranted = Object.values(granted).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );

      if (allGranted) {
        setPermissionsGranted(true);
      } else {
        console.log("Permissions denied");
      }
    } catch (err) {
      console.warn(err);
    }
  };

  React.useEffect(() => {
    requestPermissions();
  }, []);

//   const { hasPermission } = useCameraPermission();
  const microphonePermission = Camera.getMicrophonePermissionStatus();
  const [showZoomControls, setShowZoomControls] = React.useState(false);
  const [showExposureControls, setShowExposureControls] = React.useState(false);

  const camera = React.useRef<Camera>(null);
  const devices = useCameraDevices();
  const [cameraPosition, setCameraPosition] = React.useState<"front" | "back">(
    "back"
  );
  const device = useCameraDevice(cameraPosition);
  const [zoom, setZoom] = React.useState(device?.neutralZoom);
  const [exposure, setExposure] = React.useState(0);
  const [flash, setFlash] = React.useState<"off" | "on">("off");
  const [torch, setTorch] = React.useState<"off" | "on">("off");
//   const redirectToPermissions =
//     !hasPermission || microphonePermission === "not-determined";

  const router = useRouter();

  const takePicture = async () => {
    try {
      if (camera.current == null) throw new Error("Camera ref is null!");

      console.log("Taking photo...");
      const photo = await camera.current.takePhoto({
        flash: flash,
        enableShutterSound: false,
      });
      router.push({
        pathname: "/media",
        params: { media: photo.path, type: "photo" },
      });
      // onMediaCaptured(photo, 'photo')
    } catch (e) {
      console.error("Failed to take photo!", e);
    }
  };

  // New code starts here
  const objectDetection = useTensorflowModel(require('../assets/object_detection.tflite'));
  const model = objectDetection.state === "loaded" ? objectDetection.model : undefined;
  console.log("TensorFlow model state:", objectDetection.state);
  const { resize } = useResizePlugin();

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    console.log("FrameProcessor is running...");
  
    try {
      if (model == null) {
        console.log("Model is not loaded yet.");
        return;
      }
  
      console.log("Model is loaded, running inference...");
      
      const resized = resize(frame, {
        scale: {
          width: 640,
          height: 640,
        },
        pixelFormat: 'rgb',
        dataType: 'uint8',
      });
  
      const outputs = model.runSync([resized]);
      const detection_boxes = outputs[0];
      console.log(`Detected ${detection_boxes[0]} objects!`);
    } catch (error) {
      console.error('Error in frame processor:', error);
    }
  }, [model]);
  
  // // New code ends here

  if (!permissionsGranted) return <Text>Requesting permissions...</Text>;
//   if (redirectToPermissions) return <Redirect href={"/permissions"} />;
  if (!device) return <></>;

  return (
    <>
      <StatusBar barStyle={"light-content"} />
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 2, borderRadius: 10, overflow: "hidden" }}>
          <Camera
            ref={camera}
            style={{ flex: 1 }}
            photo={true}
            zoom={zoom}
            device={device!}
            isActive={true}
            resizeMode="cover"
            preview={true}
            exposure={exposure}
            torch={torch}
            frameProcessor={frameProcessor} // Added frameProcessor here
            // fps={60}
          />
          <BlurView
            intensity={100}
            tint="dark"
            style={{
              flex: 1,
              position: "absolute",
              bottom: 0,
              right: 0,
              padding: 10,
            }}
            experimentalBlurMethod="dimezisBlurView"
          >
            <Text
              style={{
                color: "white",
              }}
            >
              Exposure: {exposure} | Zoom: x{zoom}
            </Text>
          </BlurView>
        </View>

        {/* <ZoomControls
          setZoom={setZoom}
          setShowZoomControls={setShowZoomControls}
          zoom={zoom}
        /> */}

        {showZoomControls ? (
          <ZoomControls
            setZoom={setZoom}
            setShowZoomControls={setShowZoomControls}
            zoom={zoom ?? 1}
          />
        ) : showExposureControls ? (
          <ExposureControls
            setExposure={setExposure}
            setShowExposureControls={setShowExposureControls}
            exposure={exposure}
          />
        ) : (
          <View style={{ flex: 1, padding: 10 }}>
            {/* Top section */}
            <View
              style={{
                flex: 0.7,
              }}
            >
              <ThemedText>Max FPS: {device.formats[0].maxFps}</ThemedText>
              <ThemedText>
                Width: {device.formats[0].photoWidth} Height:{" "}
                {device.formats[0].photoHeight}
              </ThemedText>
              <ThemedText>Camera: {device.name}</ThemedText>
            </View>

            {/* Middle section */}
            <View
              style={{
                flex: 0.7,
                flexDirection: "row",
                justifyContent: "space-evenly",
              }}
            >
              <ObscuraButton
                iconName={torch === "on" ? "flashlight" : "flashlight-outline"}
                onPress={() => setTorch((t) => (t === "off" ? "on" : "off"))}
                containerStyle={{ alignSelf: "center" }}
              />
              <ObscuraButton
                iconName={
                  flash === "on" ? "flash-outline" : "flash-off-outline"
                }
                onPress={() => setFlash((f) => (f === "off" ? "on" : "off"))}
                containerStyle={{ alignSelf: "center" }}
              />
              <ObscuraButton
                iconName="camera-reverse-outline"
                onPress={() =>
                  setCameraPosition((p) => (p === "back" ? "front" : "back"))
                }
                containerStyle={{ alignSelf: "center" }}
              />
              <ObscuraButton
                iconName="image-outline"
                onPress={() => {
                  const link = Platform.select({
                    ios: "photos-redirect://",
                    android: "content://media/external/images/media",
                  });
                  Linking.openURL(link!);
                }}
                containerStyle={{ alignSelf: "center" }}
              />
              <ObscuraButton
                iconName="settings-outline"
                onPress={() => router.push("/_sitemap")}
                containerStyle={{ alignSelf: "center" }}
              />
            </View>

            {/* Botton section */}
            <View
              style={{
                flex: 1.1,
                flexDirection: "row",
                justifyContent: "space-evenly",
                alignItems: "center",
              }}
            >
              <ObscuraButton
                iconSize={40}
                title="+/-"
                onPress={() => setShowZoomControls((s) => !s)}
                containerStyle={{ alignSelf: "center" }}
              />
              <TouchableHighlight onPress={takePicture}>
                <FontAwesome5 name="dot-circle" size={55} color={"white"} />
              </TouchableHighlight>
              <ObscuraButton
                iconSize={40}
                title="1x"
                onPress={() => setShowExposureControls((s) => !s)}
                containerStyle={{ alignSelf: "center" }}
              />
            </View>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});