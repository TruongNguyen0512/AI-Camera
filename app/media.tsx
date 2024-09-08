import React, { useEffect, useState } from 'react';
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Image, NativeModules, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import ObscuraButton from "@/components/ObscuraButton";
import { saveToLibraryAsync } from "expo-media-library";
import ImageResizer from 'react-native-image-resizer';
import { loadTensorflowModel, Tensor } from 'react-native-fast-tflite';
import RNFS from 'react-native-fs';



export default function MediaScreen() {
  const { media, type } = useLocalSearchParams();
  const router = useRouter();
  const [model, setModel] = useState<any>(null);

  useEffect(() => {
    // Load the TensorFlow Lite model using react-native-fast-tflite
    const loadModel = async () => {
      try {
        const loadedModel = await loadTensorflowModel(require('../assets/object_detection.tflite'), 'android-gpu');
        console.log('Model loaded successfully:', loadedModel);
        setModel(loadedModel);
      } catch (error) {
        console.error('Error loading model:', error);
      }
    };
    loadModel();
  }, []);

  const processImage = async (uri: string) => {
    try {
      // Resize the image to the required input size (640x640)
      const resizedImage = await ImageResizer.createResizedImage(uri, 640, 640, 'JPEG', 100);
      
      // Read the resized image as base64
      const base64 = await RNFS.readFile(resizedImage.uri, 'base64');

      // Convert base64 to Uint8Array
      const raw = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

      // Convert to float32 array and normalize
      const float32Data = new Float32Array(raw.length);
      for (let i = 0; i < raw.length; i++) {
        float32Data[i] = (raw[i] - 127.5) / 127.5; // Normalize to [-1, 1]
      }

      // Create tensor metadata object
    const tensorInfo: Tensor = {
      name: 'input_image_tensor',  // Example name, adjust as needed
      dataType: 'float32',
      shape: [1, 640, 640, 3],
    };

    return { tensorInfo, tensorData: float32Data };
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const handleRunModel = async () => {
    if (!model || !media) {
      console.log('Model or media not available:', { model, media });
      return;
    }
  
    console.log('Running model with media:', media);
    
    // Xử lý ảnh thành tensor data
    const result = await processImage(`file://${media}`);
    if (!result) {
      console.log('Failed to process image');
      return;
    }
  
    const { tensorData } = result; // tensorData là mảng Float32Array chứa dữ liệu thực tế
  
    console.log('Input tensor created:', tensorData);
  
    // Chạy mô hình với dữ liệu tensor đã được xử lý
    try {
      // Sử dụng phương thức run của model với tensorData
      const outputs = await model.run([tensorData]); 
      console.log('Model outputs:', outputs);
    } catch (error) {
      console.error('Error running model:', error);
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      {
        type === "photo" ? (
          <Image
            source={{ uri: `file://${media}` }}
            style={{ width: "100%", height: "80%", resizeMode: "contain" }}
          />
        ) : null
      }
      <ObscuraButton
        title="Save to gallery"
        containerStyle={{ alignSelf: "center" }}
        onPress={async () => {
          saveToLibraryAsync(media as string);
          Alert.alert("Saved to gallery!");
          router.back();
        }}
      />
      <ObscuraButton
        title="Run Model"
        containerStyle={{ alignSelf: "center", marginTop: 20 }}
        onPress={handleRunModel}
      />
      <Link href="/" style={styles.link}>
        <ThemedText type="link">Delete and go back</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
    alignSelf: "center",
  },
});
