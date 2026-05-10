import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { colors, typography } from '@/theme/tokens';
import { useUiStore } from '@/stores/uiStore';
import { i18n } from '@/lib/i18n';

export default function Survey() {
  const router = useRouter();
  const { locale } = useUiStore();
  const t = (k: string) => i18n.t(k, { locale });

  const [photo, setPhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      return;
    }

    const picked = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!picked.canceled && picked.assets[0].base64) {
      setPhoto(picked.assets[0].uri);
      analyzePhoto(picked.assets[0].base64);
    }
  };

  const handlePickPhoto = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!picked.canceled && picked.assets[0].base64) {
      setPhoto(picked.assets[0].uri);
      analyzePhoto(picked.assets[0].base64);
    }
  };

  const analyzePhoto = async (base64Image: string) => {
    setIsAnalyzing(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-gateway', {
        body: {
          task: 'site_photo_analysis',
          images: [`data:image/jpeg;base64,${base64Image}`],
          locale,
        },
      });
      if (error) throw error;
      setResult(data);
    } catch (e) {
      console.error(e);
      setResult({ error: t('common.error') });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('survey.title')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.preview} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={64} color={colors.ink400} />
            <Text style={styles.placeholderText}>{t('survey.subtitle')}</Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
            <Ionicons name="camera" size={24} color={colors.white} />
            <Text style={styles.buttonText}>{t('survey.camera')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handlePickPhoto}
          >
            <Ionicons name="images" size={24} color={colors.navy} />
            <Text style={[styles.buttonText, { color: colors.navy }]}>{t('survey.gallery')}</Text>
          </TouchableOpacity>
        </View>

        {isAnalyzing && (
          <View style={styles.resultContainer}>
            <ActivityIndicator size="large" color={colors.navy} />
            <Text style={styles.analyzingText}>{t('survey.analyzing')}</Text>
          </View>
        )}

        {result && !isAnalyzing && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>{t('survey.recommendations')}</Text>
            <Text style={styles.resultText}>{JSON.stringify(result, null, 2)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cloud },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.stone,
  },
  backButton: { padding: 4 },
  title: { ...typography.lg, fontWeight: 'bold', color: colors.navy },
  content: { flex: 1, padding: 16 },
  preview: { width: '100%', height: 300, borderRadius: 12, marginBottom: 24, resizeMode: 'cover' },
  placeholder: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.stone,
    borderStyle: 'dashed',
  },
  placeholderText: {
    ...typography.md,
    color: colors.ink400,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  actions: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  button: {
    flex: 1,
    backgroundColor: colors.navy,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButton: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.navy },
  buttonText: { ...typography.md, fontWeight: 'bold', color: colors.white },
  resultContainer: { backgroundColor: colors.white, padding: 16, borderRadius: 12, marginTop: 16 },
  analyzingText: { ...typography.md, color: colors.navy, textAlign: 'center', marginTop: 16 },
  resultTitle: { ...typography.lg, fontWeight: 'bold', color: colors.navy, marginBottom: 8 },
  resultText: { ...typography.sm, color: colors.ink400 },
});
