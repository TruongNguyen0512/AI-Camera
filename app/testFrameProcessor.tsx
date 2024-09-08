import * as React from "react";
import {
  StyleSheet,
  Platform,
  View,
  SafeAreaView,
  StatusBar,
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
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from "vision-camera-resize-plugin";
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

 
  const devices = useCameraDevices();
  const device = useCameraDevice("back");

  const objectDetection = useTensorflowModel(require('../assets/object_detection.tflite'));
  const model = objectDetection.state === "loaded" ? objectDetection.model : undefined;
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
        scale: { width: 640, height: 640 },
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

  if (!permissionsGranted) return <Text>Requesting permissions...</Text>;
  if (!device) return <Text>Loading camera...</Text>;

  return (
    <>
      <StatusBar barStyle={"light-content"} />
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 2, borderRadius: 10, overflow: "hidden" }}>
          <Camera
            style={{ flex: 1 }}
            device={device}
            isActive={true}
            frameProcessor={frameProcessor}
          />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
});